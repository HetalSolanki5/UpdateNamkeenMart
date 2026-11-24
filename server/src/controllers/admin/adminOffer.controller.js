import mongoose from 'mongoose';
import Offer from '../../models/Offer.js';
import { logAudit } from '../../utils/auditLogger.js';

/**
 * Helper to compute offer status ('active' | 'upcoming' | 'expired' | 'inactive')
 */
const getComputedOfferStatus = (offer, now = new Date()) => {
  if (!offer.isActive) return 'inactive';
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
};

/**
 * Validate offer input payload
 */
const validateOfferPayload = (data) => {
  const {
    offerName,
    offerCategory = 'product_discount',
    minCartValue,
    loyaltyCriteriaType,
    loyaltyCriteriaValue,
    discountType,
    discountValue,
    applicableTo,
    categoryId,
    productIds,
    startDate,
    endDate
  } = data;

  if (!offerName || typeof offerName !== 'string' || !offerName.trim()) {
    return 'Offer name is required.';
  }

  if (!['product_discount', 'cart_threshold', 'loyalty_customer'].includes(offerCategory)) {
    return 'Offer category must be "product_discount", "cart_threshold", or "loyalty_customer".';
  }

  if (!['percentage', 'flat'].includes(discountType)) {
    return 'Discount type must be either "percentage" or "flat".';
  }

  const numericVal = Number(discountValue);
  if (isNaN(numericVal) || numericVal <= 0) {
    return 'Discount value must be a positive number.';
  }

  if (discountType === 'percentage' && (numericVal < 1 || numericVal > 90)) {
    return 'Percentage discount must be between 1 and 90.';
  }

  // Branch validation based on offerCategory
  if (offerCategory === 'cart_threshold') {
    const numericMinCart = Number(minCartValue);
    if (isNaN(numericMinCart) || numericMinCart <= 0) {
      return 'minCartValue must be a positive number when offerCategory is "cart_threshold".';
    }
  } else if (offerCategory === 'loyalty_customer') {
    if (!['min_delivered_orders', 'min_total_spend'].includes(loyaltyCriteriaType)) {
      return 'loyaltyCriteriaType must be either "min_delivered_orders" or "min_total_spend".';
    }
    const numericCriteriaVal = Number(loyaltyCriteriaValue);
    if (isNaN(numericCriteriaVal) || numericCriteriaVal <= 0) {
      return 'loyaltyCriteriaValue must be a positive number when offerCategory is "loyalty_customer".';
    }
  } else {
    // product_discount validation (Phase 10A)
    if (!['all_products', 'category', 'specific_products'].includes(applicableTo)) {
      return 'Applicable to must be "all_products", "category", or "specific_products".';
    }

    if (applicableTo === 'category') {
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return 'A valid categoryId is required when applicableTo is "category".';
      }
    }

    if (applicableTo === 'specific_products') {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return 'productIds must be a non-empty array when applicableTo is "specific_products".';
      }
      const invalidId = productIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidId) {
        return 'All productIds must be valid ObjectIds.';
      }
    }
  }

  if (!startDate || isNaN(new Date(startDate).getTime())) {
    return 'Valid start date is required.';
  }

  if (!endDate || isNaN(new Date(endDate).getTime())) {
    return 'Valid end date is required.';
  }

  if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
    return 'End date must be strictly after start date.';
  }

  return null;
};

// @desc    Get all admin offers with optional status filter
// @route   GET /api/admin/offers
// @access  Private (Admin only)
export const getAdminOffers = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const now = new Date();

    const allOffers = await Offer.find()
      .populate('categoryId', 'categoryName')
      .populate('productIds', 'productName')
      .sort({ startDate: -1 })
      .lean();

    // Map computed status onto each offer
    const offersWithStatus = allOffers.map((o) => ({
      ...o,
      computedStatus: getComputedOfferStatus(o, now)
    }));

    // Filter by status if requested and not "all"
    let filtered = offersWithStatus;
    if (status && status !== 'all') {
      if (status === 'active') {
        filtered = offersWithStatus.filter((o) => o.computedStatus === 'active');
      } else if (status === 'upcoming') {
        filtered = offersWithStatus.filter((o) => o.computedStatus === 'upcoming');
      } else if (status === 'expired') {
        filtered = offersWithStatus.filter((o) => o.computedStatus === 'expired');
      } else if (status === 'inactive') {
        filtered = offersWithStatus.filter((o) => o.computedStatus === 'inactive');
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / limitNum) || 0;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedOffers = filtered.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      offers: paginatedOffers,
      page: pageNum,
      totalPages,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new offer
// @route   POST /api/admin/offers
// @access  Private (Admin only)
export const createOffer = async (req, res, next) => {
  try {
    const validationError = validateOfferPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      offerName,
      description,
      offerCategory = 'product_discount',
      minCartValue,
      loyaltyCriteriaType,
      loyaltyCriteriaValue,
      discountType,
      discountValue,
      applicableTo,
      categoryId,
      productIds,
      startDate,
      endDate,
      isActive = true
    } = req.body;

    const offer = await Offer.create({
      offerName: offerName.trim(),
      description: description ? description.trim() : '',
      offerCategory,
      minCartValue: offerCategory === 'cart_threshold' ? Number(minCartValue) : undefined,
      loyaltyCriteriaType: offerCategory === 'loyalty_customer' ? loyaltyCriteriaType : undefined,
      loyaltyCriteriaValue: offerCategory === 'loyalty_customer' ? Number(loyaltyCriteriaValue) : undefined,
      discountType,
      discountValue: Number(discountValue),
      applicableTo: offerCategory === 'product_discount' ? applicableTo : undefined,
      categoryId: offerCategory === 'product_discount' && applicableTo === 'category' ? categoryId : undefined,
      productIds: offerCategory === 'product_discount' && applicableTo === 'specific_products' ? productIds : [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: Boolean(isActive)
    });

    await logAudit({
      userId: req.user._id,
      action: 'Created offer',
      module: 'Offers',
      description: `Created offer "${offer.offerName}" (${offer.offerCategory}, ${offer.discountType}: ${offer.discountValue})`
    });

    return res.status(201).json({
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing offer
// @route   PUT /api/admin/offers/:id
// @access  Private (Admin only)
export const updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const validationError = validateOfferPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      offerName,
      description,
      offerCategory,
      minCartValue,
      loyaltyCriteriaType,
      loyaltyCriteriaValue,
      discountType,
      discountValue,
      applicableTo,
      categoryId,
      productIds,
      startDate,
      endDate,
      isActive
    } = req.body;

    offer.offerName = offerName.trim();
    offer.description = description !== undefined ? description.trim() : offer.description;
    if (offerCategory) {
      offer.offerCategory = offerCategory;
    }
    if (offer.offerCategory === 'cart_threshold') {
      offer.minCartValue = Number(minCartValue);
      offer.loyaltyCriteriaType = undefined;
      offer.loyaltyCriteriaValue = undefined;
      offer.applicableTo = undefined;
      offer.categoryId = undefined;
      offer.productIds = [];
    } else if (offer.offerCategory === 'loyalty_customer') {
      offer.minCartValue = undefined;
      offer.loyaltyCriteriaType = loyaltyCriteriaType;
      offer.loyaltyCriteriaValue = Number(loyaltyCriteriaValue);
      offer.applicableTo = undefined;
      offer.categoryId = undefined;
      offer.productIds = [];
    } else {
      offer.minCartValue = undefined;
      offer.loyaltyCriteriaType = undefined;
      offer.loyaltyCriteriaValue = undefined;
      offer.applicableTo = applicableTo;
      offer.categoryId = applicableTo === 'category' ? categoryId : undefined;
      offer.productIds = applicableTo === 'specific_products' ? productIds : [];
    }
    offer.discountType = discountType;
    offer.discountValue = Number(discountValue);
    offer.startDate = new Date(startDate);
    offer.endDate = new Date(endDate);
    if (isActive !== undefined) {
      offer.isActive = Boolean(isActive);
    }

    await offer.save();

    await logAudit({
      userId: req.user._id,
      action: 'Updated offer',
      module: 'Offers',
      description: `Updated offer "${offer.offerName}" (ID: ${offer._id})`
    });

    return res.status(200).json({
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete offer
// @route   DELETE /api/admin/offers/:id
// @access  Private (Admin only)
export const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const offerName = offer.offerName;
    await Offer.findByIdAndDelete(id);

    await logAudit({
      userId: req.user._id,
      action: 'Deleted offer',
      module: 'Offers',
      description: `Deleted offer "${offerName}" (ID: ${id})`
    });

    return res.status(200).json({
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle offer active status
// @route   PUT /api/admin/offers/:id/active
// @access  Private (Admin only)
export const toggleOfferActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive boolean flag is required' });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.isActive = isActive;
    await offer.save();

    const actionText = isActive ? 'Activated offer' : 'Deactivated offer';
    await logAudit({
      userId: req.user._id,
      action: actionText,
      module: 'Offers',
      description: `${actionText} "${offer.offerName}" (ID: ${offer._id})`
    });

    return res.status(200).json({
      message: `Offer ${isActive ? 'activated' : 'deactivated'} successfully`,
      offer
    });
  } catch (error) {
    next(error);
  }
};
