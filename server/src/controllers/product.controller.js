import mongoose from 'mongoose';
import { Product, Variant, Stock, Review, Category } from '../models/index.js';

/**
 * Helper to compute stockStatus based on Stock record:
 * - "out_of_stock": available <= reserved
 * - "low_stock": available <= lowStockThreshold and > reserved
 * - "in_stock": available > reserved (and above lowStockThreshold)
 */
export const computeStockStatus = (stock) => {
  if (!stock) return 'out_of_stock';
  const available = stock.availableQuantity || 0;
  const reserved = stock.reservedQuantity || 0;
  const threshold = stock.lowStockThreshold ?? 10;

  if (available <= reserved) {
    return 'out_of_stock';
  }
  if (available <= threshold && available > reserved) {
    return 'low_stock';
  }
  return 'in_stock';
};

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      weight,
      inStock,
      minRating,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // 1. Build initial Product filter
    const productFilter = { isActive: true };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        productFilter.categoryId = category;
      } else {
        // If an invalid category ObjectId is passed, return empty products list
        return res.status(200).json({
          products: [],
          page: Number(page),
          totalPages: 0,
          totalResults: 0
        });
      }
    }

    if (search && search.trim() !== '') {
      // Case-insensitive text match on productName
      productFilter.productName = { $regex: search.trim(), $options: 'i' };
    }

    // 2. Fetch matching products with category populated
    const baseProducts = await Product.find(productFilter)
      .populate('categoryId', '_id categoryName')
      .lean();

    if (!baseProducts || baseProducts.length === 0) {
      return res.status(200).json({
        products: [],
        page: Number(page),
        totalPages: 0,
        totalResults: 0
      });
    }

    // Extract product IDs
    const productIds = baseProducts.map((p) => p._id);

    // 3. Fetch all active variants and their stocks
    const [allVariants, allReviews] = await Promise.all([
      Variant.find({ productId: { $in: productIds }, isActive: true }).lean(),
      Review.find({ productId: { $in: productIds }, isApproved: true }).lean()
    ]);

    const variantIds = allVariants.map((v) => v._id);
    const allStocks = await Stock.find({ variantId: { $in: variantIds } }).lean();

    // Index stocks by variantId string
    const stockMap = new Map();
    for (const s of allStocks) {
      stockMap.set(s.variantId.toString(), s);
    }

    // Index reviews by productId string
    const reviewMap = new Map();
    for (const r of allReviews) {
      const pid = r.productId.toString();
      if (!reviewMap.has(pid)) {
        reviewMap.set(pid, []);
      }
      reviewMap.get(pid).push(r);
    }

    // Index variants by productId string
    const variantMap = new Map();
    for (const v of allVariants) {
      const pid = v.productId.toString();
      if (!variantMap.has(pid)) {
        variantMap.set(pid, []);
      }
      const stockDoc = stockMap.get(v._id.toString());
      const stockStatus = computeStockStatus(stockDoc);
      const availableQuantity = stockDoc ? (stockDoc.availableQuantity || 0) : 0;

      variantMap.get(pid).push({
        _id: v._id,
        weight: v.weight,
        unit: v.unit,
        displayName: v.displayName,
        sellingPrice: v.sellingPrice,
        wholesalePrice: null, // Always hidden/null for public customer routes
        sku: v.sku,
        stockStatus,
        availableQuantity
      });
    }

    // Check variant filter criteria
    const hasMinPrice = minPrice !== undefined && minPrice !== '';
    const hasMaxPrice = maxPrice !== undefined && maxPrice !== '';
    const hasWeight = weight !== undefined && weight !== '';
    const hasInStock = inStock === 'true';
    const hasVariantFilters = hasMinPrice || hasMaxPrice || hasWeight || hasInStock;

    // 4. Assemble and filter products in application code
    let processedProducts = [];

    for (const prod of baseProducts) {
      const variants = variantMap.get(prod._id.toString()) || [];

      // Check if product has any matching variants if variant filters are provided
      if (hasVariantFilters) {
        const matchingVariants = variants.filter((v) => {
          if (hasMinPrice && v.sellingPrice < Number(minPrice)) return false;
          if (hasMaxPrice && v.sellingPrice > Number(maxPrice)) return false;
          if (hasWeight && v.weight !== Number(weight)) return false;
          if (hasInStock && v.availableQuantity <= 0) return false;
          return true;
        });

        // Drop products that end up with zero matching variants
        if (matchingVariants.length === 0) {
          continue;
        }
      }

      // Calculate reviews & rating
      const reviews = reviewMap.get(prod._id.toString()) || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

      // Filter by minRating if requested
      if (minRating !== undefined && minRating !== '' && averageRating < Number(minRating)) {
        continue;
      }

      // Prepare category object
      const categoryObj = prod.categoryId
        ? { _id: prod.categoryId._id, categoryName: prod.categoryId.categoryName }
        : null;

      // Clean up internal availableQuantity from response variants
      const cleanVariants = variants.map(({ availableQuantity, ...rest }) => rest);

      // Determine min/max variant price for sorting
      const variantPrices = variants.map((v) => v.sellingPrice);
      const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;

      processedProducts.push({
        _id: prod._id,
        productName: prod.productName,
        description: prod.description,
        productImages: prod.productImages,
        category: categoryObj,
        variants: cleanVariants,
        averageRating,
        reviewCount,
        createdAt: prod.createdAt,
        minVariantPrice,
        maxVariantPrice
      });
    }

    // 5. Apply sorting
    if (sort === 'priceLowHigh') {
      processedProducts.sort((a, b) => a.minVariantPrice - b.minVariantPrice);
    } else if (sort === 'priceHighLow') {
      processedProducts.sort((a, b) => b.maxVariantPrice - a.maxVariantPrice);
    } else if (sort === 'popular') {
      processedProducts.sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      // Default: 'newest'
      processedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 6. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const totalResults = processedProducts.length;
    const totalPages = Math.ceil(totalResults / limitNum) || 0;
    const startIndex = (pageNum - 1) * limitNum;

    const paginatedProducts = processedProducts
      .slice(startIndex, startIndex + limitNum)
      .map(({ minVariantPrice, maxVariantPrice, createdAt, ...item }) => item);

    return res.status(200).json({
      products: paginatedProducts,
      page: pageNum,
      totalPages,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('categoryId', '_id categoryName')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch active variants
    const variants = await Variant.find({ productId: product._id, isActive: true }).lean();
    const variantIds = variants.map((v) => v._id);

    // Fetch stocks for variants
    const stocks = await Stock.find({ variantId: { $in: variantIds } }).lean();
    const stockMap = new Map();
    for (const s of stocks) {
      stockMap.set(s.variantId.toString(), s);
    }

    const formattedVariants = variants.map((v) => {
      const stockDoc = stockMap.get(v._id.toString());
      return {
        _id: v._id,
        weight: v.weight,
        unit: v.unit,
        displayName: v.displayName,
        sellingPrice: v.sellingPrice,
        wholesalePrice: null, // Always hidden for customer
        sku: v.sku,
        stockStatus: computeStockStatus(stockDoc)
      };
    });

    // Fetch approved reviews with user basic name
    const reviews = await Review.find({ productId: product._id, isApproved: true })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0;

    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        _id: r.userId?._id,
        name: r.userId?.name || 'Anonymous Customer'
      }
    }));

    return res.status(200).json({
      product: {
        _id: product._id,
        productName: product.productName,
        description: product.description,
        ingredients: product.ingredients,
        nutritionalInformation: product.nutritionalInformation,
        productImages: product.productImages,
        category: product.categoryId
          ? { _id: product.categoryId._id, categoryName: product.categoryId.categoryName }
          : null,
        variants: formattedVariants,
        reviews: formattedReviews,
        averageRating,
        reviewCount
      }
    });
  } catch (error) {
    next(error);
  }
};
