import Offer from '../models/Offer.js';
import Order from '../models/Order.js';

/**
 * Find the single best active offer applicable to a given product document or object.
 *
 * BUSINESS RULE - HIGHEST DISCOUNT WINS, NO STACKING:
 * If multiple offers match (e.g. an "all_products" 10% offer and a "category" 20% offer),
 * we choose the offer with the highest effective discount value for the customer.
 * Not stacking discounts keeps calculation clear, transparent, and user-friendly,
 * while preventing unintended compound discounts.
 *
 * @param {Object} product - Product document or lean object with _id and categoryId
 * @param {Date} [referenceDate] - Date to check validity against (defaults to now)
 * @returns {Promise<Object|null>} - Best matching Offer doc/object or null
 */
export const getActiveOfferForProduct = async (product, referenceDate = new Date()) => {
  if (!product || !product._id) return null;

  const now = referenceDate;
  const productId = product._id;
  const categoryId = product.categoryId?._id || product.categoryId;

  // Build query: active, within date window, and matching targeting rules
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableTo: 'all_products' },
      ...(categoryId ? [{ applicableTo: 'category', categoryId }] : []),
      { applicableTo: 'specific_products', productIds: productId }
    ]
  };

  const matchingOffers = await Offer.find(query).lean();

  if (!matchingOffers || matchingOffers.length === 0) {
    return null;
  }

  if (matchingOffers.length === 1) {
    return matchingOffers[0];
  }

  // If multiple offers match, pick the highest discount value (best deal for customer)
  // For ranking between percentage and flat or same types, we sort descending by discountValue
  matchingOffers.sort((a, b) => b.discountValue - a.discountValue);

  return matchingOffers[0];
};

/**
 * Apply an offer to a retail price.
 *
 * SECURITY & CONSTRAINTS:
 * Final price can never be negative. If a flat discount exceeds the price,
 * discountAmount is capped at the price itself.
 *
 * @param {number} price - Original selling price
 * @param {Object|null} offer - Offer document/object (or null if none)
 * @returns {{
 *   finalPrice: number,
 *   discountAmount: number,
 *   offerName: string|null,
 *   discountType: string|null,
 *   discountValue: number|null
 * }}
 */
export const applyDiscount = (price, offer) => {
  const numericPrice = Number(price) || 0;

  if (!offer) {
    return {
      finalPrice: numericPrice,
      discountAmount: 0,
      offerName: null,
      discountType: null,
      discountValue: null
    };
  }

  let discountAmount = 0;

  if (offer.discountType === 'percentage') {
    discountAmount = Math.round((numericPrice * (offer.discountValue / 100)) * 100) / 100;
  } else if (offer.discountType === 'flat') {
    discountAmount = Number(offer.discountValue) || 0;
  }

  // Final price can never go below 0: cap discountAmount at the price itself
  if (discountAmount > numericPrice) {
    discountAmount = numericPrice;
  }

  const finalPrice = Math.max(0, Math.round((numericPrice - discountAmount) * 100) / 100);

  return {
    finalPrice,
    discountAmount,
    offerName: offer.offerName,
    discountType: offer.discountType,
    discountValue: offer.discountValue
  };
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 10E: CART-TOTAL THRESHOLD DISCOUNT (BULK ORDER DISCOUNT)
 * ─────────────────────────────────────────────────────────────────────────────
 * Unlike Phase 10A's getActiveOfferForProduct (which calculates discounts per
 * product), this logic calculates a single bulk discount applied to the cart's
 * total subtotal when it meets or exceeds minCartValue.
 *
 * BUSINESS RULE - HIGHEST DISCOUNT WINS, NO STACKING:
 * Mirrors Phase 10A: if multiple cart_threshold offers qualify (e.g., "Spend 3000
 * get 10%" and "Spend 5000 get 20%"), we select the offer with the highest
 * discountValue to give the customer the best transparent deal without stacking.
 *
 * @param {number} subtotal - Current cart subtotal (after Phase 10A product discounts)
 * @param {Date} [referenceDate] - Date to check validity against
 * @returns {Promise<Object|null>} - Best matching Offer or null
 */
export const getActiveCartThresholdOffer = async (subtotal, referenceDate = new Date()) => {
  const numericSubtotal = Number(subtotal) || 0;
  if (numericSubtotal <= 0) return null;

  const now = referenceDate;

  // Find all active cart_threshold offers whose minimum required cart value is <= subtotal
  const query = {
    offerCategory: 'cart_threshold',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    minCartValue: { $lte: numericSubtotal }
  };

  const matchingOffers = await Offer.find(query).lean();

  if (!matchingOffers || matchingOffers.length === 0) {
    return null;
  }

  if (matchingOffers.length === 1) {
    return matchingOffers[0];
  }

  // Highest discount value wins (consistency with Phase 10A design)
  matchingOffers.sort((a, b) => b.discountValue - a.discountValue);

  return matchingOffers[0];
};

/**
 * Apply cart-level discount to the cart subtotal.
 *
 * SECURITY:
 * finalSubtotal can never go below 0. If flat discount exceeds the subtotal,
 * discountAmount is capped at the subtotal itself.
 *
 * @param {number} subtotal - Cart subtotal
 * @param {Object|null} offer - Cart threshold Offer document/object or null
 * @returns {{
 *   finalSubtotal: number,
 *   discountAmount: number,
 *   offerName: string|null,
 *   discountType: string|null,
 *   discountValue: number|null,
 *   minCartValue: number|null
 * }}
 */
export const applyCartDiscount = (subtotal, offer) => {
  const numericSubtotal = Number(subtotal) || 0;

  if (!offer) {
    return {
      finalSubtotal: numericSubtotal,
      discountAmount: 0,
      offerName: null,
      discountType: null,
      discountValue: null,
      minCartValue: null
    };
  }

  let discountAmount = 0;

  if (offer.discountType === 'percentage') {
    discountAmount = Math.round((numericSubtotal * (offer.discountValue / 100)) * 100) / 100;
  } else if (offer.discountType === 'flat') {
    discountAmount = Number(offer.discountValue) || 0;
  }

  // Cap discount so finalSubtotal never drops below 0
  if (discountAmount > numericSubtotal) {
    discountAmount = numericSubtotal;
  }

  const finalSubtotal = Math.max(0, Math.round((numericSubtotal - discountAmount) * 100) / 100);

  return {
    finalSubtotal,
    discountAmount,
    offerName: offer.offerName,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    minCartValue: offer.minCartValue
  };
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 10G: LOYALTY & REGULAR CUSTOMER DISCOUNT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Compute a customer's order history metrics from the Order model:
 * - deliveredOrderCount: Total orders with orderStatus === 'delivered'.
 *   (Specifically rewards completed, trustworthy order history).
 * - totalLifetimeSpend: Sum of totalAmount across ALL of the user's orders.
 *   (Lifetime spend reflects the total business volume given by this customer,
 *   even if their most recent order is still being processed/shipped).
 *
 * @param {string|mongoose.Types.ObjectId} userId - Customer User ID
 * @returns {Promise<{ deliveredOrderCount: number, totalLifetimeSpend: number }>}
 */
export const getCustomerLoyaltyStats = async (userId) => {
  if (!userId) {
    return { deliveredOrderCount: 0, totalLifetimeSpend: 0 };
  }

  // Fetch all orders for this user
  const userOrders = await Order.find({ userId }).select('orderStatus totalAmount').lean();

  if (!userOrders || userOrders.length === 0) {
    return { deliveredOrderCount: 0, totalLifetimeSpend: 0 };
  }

  let deliveredOrderCount = 0;
  let totalLifetimeSpend = 0;

  for (const ord of userOrders) {
    if (ord.orderStatus === 'delivered') {
      deliveredOrderCount += 1;
    }
    // Sum totalAmount across ALL orders (not just delivered) as explained above
    totalLifetimeSpend += Number(ord.totalAmount) || 0;
  }

  totalLifetimeSpend = Math.round(totalLifetimeSpend * 100) / 100;

  return {
    deliveredOrderCount,
    totalLifetimeSpend
  };
};

/**
 * Find the best active loyalty discount for a given customer based on their stats.
 *
 * BUSINESS RULE - HIGHEST DISCOUNT WINS, NO STACKING:
 * Consistent with Phase 10A and Phase 10E: if multiple loyalty offers qualify
 * (e.g. 5% for 3 orders, 10% for 5 orders), the customer gets the single highest
 * discountValue.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Customer User ID
 * @param {Date} [referenceDate] - Date to check validity against
 * @returns {Promise<Object|null>} - Best matching Offer or null
 */
export const getActiveLoyaltyOffer = async (userId, referenceDate = new Date()) => {
  if (!userId) return null;

  const stats = await getCustomerLoyaltyStats(userId);
  const now = referenceDate;

  // Find all active loyalty offers in the current date window
  const query = {
    offerCategory: 'loyalty_customer',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  };

  const loyaltyOffers = await Offer.find(query).lean();

  if (!loyaltyOffers || loyaltyOffers.length === 0) {
    return null;
  }

  // Filter offers matching the customer's actual stats
  const eligibleOffers = loyaltyOffers.filter((offer) => {
    if (offer.loyaltyCriteriaType === 'min_delivered_orders') {
      return stats.deliveredOrderCount >= Number(offer.loyaltyCriteriaValue);
    }
    if (offer.loyaltyCriteriaType === 'min_total_spend') {
      return stats.totalLifetimeSpend >= Number(offer.loyaltyCriteriaValue);
    }
    return false;
  });

  if (eligibleOffers.length === 0) {
    return null;
  }

  if (eligibleOffers.length === 1) {
    return eligibleOffers[0];
  }

  // Highest discountValue wins
  eligibleOffers.sort((a, b) => b.discountValue - a.discountValue);

  return eligibleOffers[0];
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 10G COMBINED DECISION: BEST WHOLE-ORDER OFFER
 * ─────────────────────────────────────────────────────────────────────────────
 * Both Phase 10E (cart_threshold) and Phase 10G (loyalty_customer) discounts
 * apply to the WHOLE order subtotal (unlike Phase 10A per-product discounts).
 *
 * SINGLE SOURCE OF TRUTH (DRY PRINCIPLE):
 * To prevent duplicated comparison logic between cart display and checkout,
 * getBestWholeOrderOffer compares the best cart_threshold offer and the best
 * loyalty_customer offer.
 *
 * BUSINESS RULE - HIGHER DISCOUNT WINS, NO STACKING:
 * If a customer qualifies for both (e.g. they crossed Rs 5,000 cart AND are a
 * loyal customer), the offer with the HIGHER discountValue wins. No stacking
 * prevents compounding discounts that erode margins and keeps pricing crystal-clear.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Customer User ID
 * @param {number} subtotal - Current cart subtotal
 * @param {Date} [referenceDate] - Date to check validity against
 * @returns {Promise<Object|null>} - Single best whole-order Offer or null
 */
export const getBestWholeOrderOffer = async (userId, subtotal, referenceDate = new Date()) => {
  const [cartOffer, loyaltyOffer] = await Promise.all([
    getActiveCartThresholdOffer(subtotal, referenceDate),
    getActiveLoyaltyOffer(userId, referenceDate)
  ]);

  if (!cartOffer && !loyaltyOffer) {
    return null;
  }

  if (cartOffer && !loyaltyOffer) {
    return cartOffer;
  }

  if (!cartOffer && loyaltyOffer) {
    return loyaltyOffer;
  }

  // Both match: pick the one with the higher discountValue (no stacking)
  if (loyaltyOffer.discountValue > cartOffer.discountValue) {
    return loyaltyOffer;
  }

  return cartOffer;
};


