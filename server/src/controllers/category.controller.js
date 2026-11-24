import * as categoryService from '../services/categoryService.js';

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getActiveCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};
