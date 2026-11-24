import mongoose from 'mongoose';
import {
  Product,
  Variant,
  Stock,
  Category,
  OrderItem,
  WholesaleOrderItem
} from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';
import { computeStockStatus } from '../product.controller.js';
import * as productService from '../../services/productService.js';

/**
 * @desc    Get all products for admin (active and inactive), category populated,
 *          variants + stock summary + wholesalePrice included.
 * @route   GET /api/admin/products
 * @access  Private (Admin only)
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, productRange, page = 1, limit = 20 } = req.query;

    const productFilter = {};

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        productFilter.categoryId = category;
      } else {
        return res.status(200).json({
          products: [],
          page: Number(page),
          totalPages: 0,
          total: 0
        });
      }
    }

    if (productRange && ['regular', 'diet'].includes(productRange.toLowerCase())) {
      productFilter.productRange = productRange.toLowerCase();
    }

    if (search && search.trim() !== '') {
      productFilter.productName = { $regex: search.trim(), $options: 'i' };
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNumber - 1) * pageSize;

    const [products, total] = await Promise.all([
      Product.find(productFilter)
        .populate('categoryId', '_id categoryName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Product.countDocuments(productFilter)
    ]);

    const productIds = products.map((p) => p._id);

    // Fetch all variants (active & inactive) for these products
    const variants = await Variant.find({ productId: { $in: productIds } }).lean();
    const variantIds = variants.map((v) => v._id);

    // Fetch stock records for all variants
    const stocks = await Stock.find({ variantId: { $in: variantIds } }).lean();
    const stockMap = new Map();
    for (const s of stocks) {
      stockMap.set(s.variantId.toString(), s);
    }

    // Attach stock and computed status to each variant
    const variantMap = new Map();
    for (const v of variants) {
      const s = stockMap.get(v._id.toString()) || null;
      const status = computeStockStatus(s);
      const variantWithStock = {
        ...v,
        stock: s,
        stockStatus: status
      };

      const pid = v.productId.toString();
      if (!variantMap.has(pid)) {
        variantMap.set(pid, []);
      }
      variantMap.get(pid).push(variantWithStock);
    }

    // Construct response products with variants and stock summary
    const formattedProducts = products.map((p) => {
      const pVariants = variantMap.get(p._id.toString()) || [];
      const totalAvailable = pVariants.reduce((sum, v) => sum + (v.stock?.availableQuantity || 0), 0);
      const totalReserved = pVariants.reduce((sum, v) => sum + (v.stock?.reservedQuantity || 0), 0);

      return {
        ...p,
        variants: pVariants,
        stockSummary: {
          totalAvailable,
          totalReserved,
          variantCount: pVariants.length
        }
      };
    });

    return res.status(200).json({
      products: formattedProducts,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product, optionally create nested variants and their Stock records
 * @route   POST /api/admin/products
 * @access  Private (Admin only)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      categoryId,
      productName,
      productRange = 'regular',
      description,
      ingredients,
      nutritionalInformation,
      productImages,
      variants
    } = req.body;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Valid categoryId is required' });
    }

    if (!productName || productName.trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Check category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Create Product
    const newProduct = await Product.create({
      categoryId,
      productName: productName.trim(),
      productRange: ['regular', 'diet'].includes(productRange?.toLowerCase()) ? productRange.toLowerCase() : 'regular',
      description,
      ingredients,
      nutritionalInformation,
      productImages: Array.isArray(productImages) ? productImages : [],
      isActive: true
    });

    const createdVariants = [];

    // Create nested variants if provided
    if (Array.isArray(variants) && variants.length > 0) {
      for (const item of variants) {
        const {
          weight,
          unit = 'g',
          displayName,
          sellingPrice,
          wholesalePrice,
          sku,
          initialQuantity = 0,
          lowStockThreshold = 10
        } = item;

        if (!weight || !sellingPrice || wholesalePrice === undefined || !sku) {
          throw new Error('Each variant must have weight, sellingPrice, wholesalePrice, and sku');
        }

        const variantDoc = await Variant.create({
          productId: newProduct._id,
          weight,
          unit,
          displayName: displayName || `${newProduct.productName} - ${weight}${unit}`,
          sellingPrice,
          wholesalePrice,
          sku: sku.trim(),
          isActive: true
        });

        const stockDoc = await Stock.create({
          variantId: variantDoc._id,
          availableQuantity: Number(initialQuantity) || 0,
          reservedQuantity: 0,
          lowStockThreshold: Number(lowStockThreshold) || 10
        });

        createdVariants.push({
          ...variantDoc.toObject(),
          stock: stockDoc
        });
      }
    }

    await logAudit({
      userId: req.user._id,
      action: 'Created product',
      module: 'Products',
      description: `Created product "${newProduct.productName}" with ${createdVariants.length} variant(s)`
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
      variants: createdVariants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product core fields (not variants)
 * @route   PUT /api/admin/products/:id
 * @access  Private (Admin only)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      productName,
      productRange,
      description,
      ingredients,
      nutritionalInformation,
      productImages
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId' });
      }
      const cat = await Category.findById(categoryId);
      if (!cat) {
        return res.status(404).json({ message: 'Category not found' });
      }
      product.categoryId = categoryId;
    }

    if (productName !== undefined) product.productName = productName.trim();
    if (productRange !== undefined && ['regular', 'diet'].includes(productRange.toLowerCase())) {
      product.productRange = productRange.toLowerCase();
    }
    if (description !== undefined) product.description = description;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (nutritionalInformation !== undefined) product.nutritionalInformation = nutritionalInformation;
    if (productImages !== undefined) {
      product.productImages = Array.isArray(productImages) ? productImages : [];
    }

    await product.save();

    await logAudit({
      userId: req.user._id,
      action: 'Updated product',
      module: 'Products',
      description: `Updated product: ${product.productName}`
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product, its variants, and stocks (only if no order history exists)
 * @route   DELETE /api/admin/products/:id
 * @access  Private (Admin only)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find all variants for this product
    const variants = await Variant.find({ productId: id });
    const variantIds = variants.map((v) => v._id);

    // Check if any variant exists in OrderItem or WholesaleOrderItem
    if (variantIds.length > 0) {
      const [orderItemCount, wholesaleItemCount] = await Promise.all([
        OrderItem.countDocuments({ variantId: { $in: variantIds } }),
        WholesaleOrderItem.countDocuments({ variantId: { $in: variantIds } })
      ]);

      if (orderItemCount > 0 || wholesaleItemCount > 0) {
        return res.status(400).json({
          message: 'Cannot delete a product that has order history. Deactivate it instead.'
        });
      }
    }

    // Safe to delete: product, variants, and stocks
    await Promise.all([
      Product.findByIdAndDelete(id),
      Variant.deleteMany({ productId: id }),
      Stock.deleteMany({ variantId: { $in: variantIds } })
    ]);

    await logAudit({
      userId: req.user._id,
      action: 'Deleted product',
      module: 'Products',
      description: `Deleted product "${product.productName}" and its variants`
    });

    return res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle product active/inactive
 * @route   PUT /api/admin/products/:id/active
 * @access  Private (Admin only)
 */
export const toggleProductActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Call productService.updateProductStatus
    const product = await productService.updateProductStatus(id, isActive);

    const actionText = isActive ? 'Activated product' : 'Deactivated product';
    await logAudit({
      userId: req.user._id,
      action: actionText,
      module: 'Products',
      description: `${actionText}: ${product.productName}`
    });

    return res.status(200).json({
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add variant to product + create Stock document
 * @route   POST /api/admin/products/:id/variants
 * @access  Private (Admin only)
 */
export const addVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      weight,
      unit = 'g',
      displayName,
      sellingPrice,
      wholesalePrice,
      sku,
      initialQuantity = 0,
      lowStockThreshold = 10
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!weight || !sellingPrice || wholesalePrice === undefined || !sku) {
      return res.status(400).json({
        message: 'weight, sellingPrice, wholesalePrice, and sku are required'
      });
    }

    // Check SKU uniqueness
    const existingSku = await Variant.findOne({ sku: sku.trim() });
    if (existingSku) {
      return res.status(409).json({ message: 'SKU already exists' });
    }

    const variant = await Variant.create({
      productId: product._id,
      weight,
      unit,
      displayName: displayName || `${product.productName} - ${weight}${unit}`,
      sellingPrice,
      wholesalePrice,
      sku: sku.trim(),
      isActive: true
    });

    const stock = await Stock.create({
      variantId: variant._id,
      availableQuantity: Number(initialQuantity) || 0,
      reservedQuantity: 0,
      lowStockThreshold: Number(lowStockThreshold) || 10
    });

    await logAudit({
      userId: req.user._id,
      action: 'Added variant',
      module: 'Products',
      description: `Added variant ${variant.sku} to ${product.productName}`
    });

    return res.status(201).json({
      message: 'Variant created successfully',
      variant: {
        ...variant.toObject(),
        stock
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update variant fields (not stock quantities)
 * @route   PUT /api/admin/variants/:variantId
 * @access  Private (Admin only)
 */
export const updateVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { weight, unit, displayName, sellingPrice, wholesalePrice, sku } = req.body;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    if (sku && sku.trim() !== variant.sku) {
      const duplicateSku = await Variant.findOne({
        _id: { $ne: variantId },
        sku: sku.trim()
      });
      if (duplicateSku) {
        return res.status(409).json({ message: 'SKU already in use' });
      }
      variant.sku = sku.trim();
    }

    if (weight !== undefined) variant.weight = weight;
    if (unit !== undefined) variant.unit = unit;
    if (displayName !== undefined) variant.displayName = displayName;
    if (sellingPrice !== undefined) variant.sellingPrice = sellingPrice;
    if (wholesalePrice !== undefined) variant.wholesalePrice = wholesalePrice;

    await variant.save();

    await logAudit({
      userId: req.user._id,
      action: 'Updated variant',
      module: 'Products',
      description: `Updated variant: ${variant.sku}`
    });

    return res.status(200).json({
      message: 'Variant updated successfully',
      variant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete variant and its Stock doc (only if no order history)
 * @route   DELETE /api/admin/variants/:variantId
 * @access  Private (Admin only)
 */
export const deleteVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Check order history for this specific variant
    const [orderCount, wholesaleCount] = await Promise.all([
      OrderItem.countDocuments({ variantId }),
      WholesaleOrderItem.countDocuments({ variantId })
    ]);

    if (orderCount > 0 || wholesaleCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete a variant that has order history. Deactivate it instead.'
      });
    }

    // Safe to delete variant and stock
    await Promise.all([
      Variant.findByIdAndDelete(variantId),
      Stock.findOneAndDelete({ variantId })
    ]);

    await logAudit({
      userId: req.user._id,
      action: 'Deleted variant',
      module: 'Products',
      description: `Deleted variant ${variant.sku}`
    });

    return res.status(200).json({
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle variant active/inactive
 * @route   PUT /api/admin/variants/:variantId/active
 * @access  Private (Admin only)
 */
export const toggleVariantActive = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID' });
    }

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    variant.isActive = isActive;
    await variant.save();

    const actionText = isActive ? 'Activated variant' : 'Deactivated variant';
    await logAudit({
      userId: req.user._id,
      action: actionText,
      module: 'Products',
      description: `${actionText}: ${variant.sku}`
    });

    return res.status(200).json({
      message: `Variant ${isActive ? 'activated' : 'deactivated'} successfully`,
      variant
    });
  } catch (error) {
    next(error);
  }
};
