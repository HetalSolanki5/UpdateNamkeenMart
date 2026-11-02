import mongoose from 'mongoose';
import { Review } from '../../models/index.js';

/**
 * @desc    Get paginated customer reviews for admin
 * @route   GET /api/admin/reviews
 * @access  Private (Admin only)
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const { isApproved, page = 1, limit = 10 } = req.query;

    const query = {};
    if (isApproved !== undefined && isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, totalResults] = await Promise.all([
      Review.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'productName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    return res.status(200).json({
      reviews,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum) || 0,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a review
 * @route   PUT /api/admin/reviews/:id/approve
 * @access  Private (Admin only)
 */
export const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review approved successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hide a review
 * @route   PUT /api/admin/reviews/:id/hide
 * @access  Private (Admin only)
 */
export const hideReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved: false },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review hidden successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private (Admin only)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

