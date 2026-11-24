
import Category from '../models/Category.js';

// Add new category
export const addCategory = async (categoryData) => {
    const {
        categoryName,
        description,
        image,
        isActive
    } = categoryData;

    if (!categoryName) {
        throw new Error('Category name is required');
    }

    const existingCategory = await Category.findOne({
        categoryName: categoryName.trim()
    });

    if (existingCategory) {
        throw new Error('Category already exists');
    }

    const category = await Category.create({
        categoryName: categoryName.trim(),
        description,
        image,
        isActive: isActive ?? true
    });

    return category;
};


// Get all categories
export const getAllCategories = async () => {
    return await Category.find().sort({ createdAt: -1 });
};


// Get active categories
export const getActiveCategories = async () => {
    return await Category.find({ isActive: true });
};


// Get category by ID
export const getCategoryById = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error('Category not found');
    }

    return category;
};


// Update category
export const updateCategory = async (categoryId, updateData) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error('Category not found');
    }

    const allowedFields = [
        'categoryName',
        'description',
        'image',
        'isActive'
    ];

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            category[field] = updateData[field];
        }
    });

    await category.save();

    return category;
};


// Delete category
export const deleteCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error('Category not found');
    }

    await Category.findByIdAndDelete(categoryId);

    return {
        message: 'Category deleted successfully'
    };
};


const categoryService = {
    addCategory,
    getAllCategories,
    getActiveCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};

export default categoryService;
