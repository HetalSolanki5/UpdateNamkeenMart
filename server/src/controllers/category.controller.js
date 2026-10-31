import { Category } from '../models/index.js';

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    // Return all categories where isActive is true, sorted by categoryName
    const categories = await Category.find({ isActive: true })
      .sort({ categoryName: 1 })
      .select('_id categoryName description image isActive createdAt updatedAt');

    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};
