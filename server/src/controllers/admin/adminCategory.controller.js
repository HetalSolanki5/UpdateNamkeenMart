import mongoose from 'mongoose';
import { Category, Product } from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';
import * as categoryService from '../../services/categoryService.js';

/**
 * @desc    Get all categories for admin (including inactive ones, sorted by categoryName)
 * @route   GET /api/admin/categories
 * @access  Private (Admin only)
 */
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/admin/categories
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.addCategory(req.body);

    await logAudit({
      userId: req.user._id,
      action: 'Created category',
      module: 'Categories',
      description: `Created category: ${category.categoryName}`
    });

    return res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message && error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Update category fields
 * @route   PUT /api/admin/categories/:id
 * @access  Private (Admin only)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await categoryService.updateCategory(id, req.body);

    await logAudit({
      userId: req.user._id,
      action: 'Updated category',
      module: 'Categories',
      description: `Updated category: ${category.categoryName}`
    });

    return res.status(200).json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Delete category (only if no products reference it)
 * @route   DELETE /api/admin/categories/:id
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Safety check: Check if any product references this categoryId
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with existing products. Deactivate it instead.'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await categoryService.deleteCategory(id);

    await logAudit({
      userId: req.user._id,
      action: 'Deleted category',
      module: 'Categories',
      description: `Deleted category: ${category.categoryName}`
    });

    return res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Toggle category active status
 * @route   PUT /api/admin/categories/:id/active
 * @access  Private (Admin only)
 */
export const toggleCategoryActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await categoryService.updateCategory(id, { isActive });

    const actionText = isActive ? 'Activated category' : 'Deactivated category';
    await logAudit({
      userId: req.user._id,
      action: actionText,
      module: 'Categories',
      description: `${actionText}: ${category.categoryName}`
    });

    return res.status(200).json({
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      category
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
