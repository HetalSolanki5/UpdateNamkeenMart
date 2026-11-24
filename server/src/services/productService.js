
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Add New Product
export const addProduct = async (productData) => {
    const {
        categoryId,
        productName,
        description,
        ingredients,
        productImages,
        productRange,
        isActive
    } = productData;

    if (!categoryId || !productName) {
        throw new Error('Category and product name are required');
    }

    // Check category
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new Error('Category not found');
    }

    // Check duplicate product
    const existingProduct = await Product.findOne({
        categoryId,
        productName: productName.trim()
    });

    if (existingProduct) {
        throw new Error('Product already exists in this category');
    }

    const product = await Product.create({
        categoryId,
        productName: productName.trim(),
        description,
        ingredients,
        productImages: productImages || [],
        productRange,
        isActive: isActive ?? true
    });

    return product;
};


// Get All Products
export const getAllProducts = async () => {
    return await Product.find()
        .populate('categoryId')
        .sort({ createdAt: -1 });
};


// Get Active Products
export const getActiveProducts = async () => {
    return await Product.find({ isActive: true })
        .populate('categoryId')
        .sort({ createdAt: -1 });
};


// Get Products By Category
export const getProductsByCategory = async (categoryId) => {
    return await Product.find({
        categoryId,
        isActive: true
    }).populate('categoryId');
};


// Get Product By ID
export const getProductById = async (productId) => {
    const product = await Product.findById(productId)
        .populate('categoryId');

    if (!product) {
        throw new Error('Product not found');
    }

    return product;
};


// Update Product
export const updateProduct = async (productId, updateData) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    const allowedFields = [
        'categoryId',
        'productName',
        'description',
        'ingredients',
        'productImages',
        'productRange',
        'isActive'
    ];

    // Update only allowed fields
    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            product[field] = updateData[field];
        }
    });

    // Validate updated category
    if (updateData.categoryId) {
        const category = await Category.findById(
            updateData.categoryId
        );

        if (!category) {
            throw new Error('Category not found');
        }
    }

    await product.save();

    return product;
};


// Delete Product
export const deleteProduct = async (productId) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    await Product.findByIdAndDelete(productId);

    return {
        message: 'Product deleted successfully'
    };
};


// Change Product Status
export const updateProductStatus = async (
    productId,
    isActive
) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    product.isActive = isActive;

    await product.save();

    return product;
};


// Search Products
export const searchProducts = async (searchText) => {
    if (!searchText || !searchText.trim()) {
        return [];
    }

    return await Product.find({
        isActive: true,
        productName: {
            $regex: searchText.trim(),
            $options: 'i'
        }
    }).populate('categoryId');
};


// Default Export
const productService = {
    addProduct,
    getAllProducts,
    getActiveProducts,
    getProductsByCategory,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    searchProducts
};

export default productService;
