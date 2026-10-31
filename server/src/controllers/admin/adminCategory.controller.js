import mongoose from 'mongoose';
import { Category, Product } from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';

/**
 * @desc    Get all categories for admin (including inactive ones, sorted by categoryName)
 * @route   GET /api/admin/categories
 * @access  Private (Admin only)
 */
export const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ categoryName: 1 });
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
    const { categoryName, description, image } = req.body;

    if (!categoryName || categoryName.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = categoryName.trim();

    // Check categoryName uniqueness (case-insensitive check)
    const existing = await Category.findOne({
      categoryName: { $regex: `^${trimmedName}$`, $options: 'i' }
    });
    if (existing) {
      return res.status(409).json({ message: 'Category name already exists' });
    }

    // Note: image is accepted as a URL string for now.
    // File upload middleware (e.g. multer) can be attached in future phases.
    const category = await Category.create({
      categoryName: trimmedName,
      description,
      image,
      isActive: true
    });

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
    const { categoryName, description, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (categoryName && categoryName.trim() !== '') {
      const trimmedName = categoryName.trim();
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        categoryName: { $regex: `^${trimmedName}$`, $options: 'i' }
      });
      if (duplicate) {
        return res.status(409).json({ message: 'Another category with this name already exists' });
      }
      category.categoryName = trimmedName;
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;

    await category.save();

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

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Safety check: Check if any product references this categoryId
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with existing products. Deactivate it instead.'
      });
    }

    await Category.findByIdAndDelete(id);

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

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.isActive = isActive;
    await category.save();

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
    next(error);
  }
};
