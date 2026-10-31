import mongoose from 'mongoose';
import { Wishlist, Product, Variant } from '../models/index.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private (Customer only)
export const getWishlist = async (req, res, next) => {
  try {
    const wishlistDocs = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: 'productId',
        select: '_id productName productImages isActive'
      })
      .sort({ createdAt: -1 });

    const wishlistItems = await Promise.all(
      wishlistDocs.map(async (doc) => {
        if (!doc.productId || !doc.productId.isActive) {
          return null;
        }

        // Fetch the first active variant to get the starting/lowest price
        const variant = await Variant.findOne({
          productId: doc.productId._id,
          isActive: true
        }).sort({ sellingPrice: 1 });

        return {
          _id: doc._id,
          product: {
            _id: doc.productId._id,
            productName: doc.productId.productName,
            productImages: doc.productId.productImages,
            price: variant ? variant.sellingPrice : null
          },
          createdAt: doc.createdAt
        };
      })
    );

    return res.status(200).json({
      wishlist: wishlistItems.filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private (Customer only)
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Valid productId is required' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find existing or create (avoid duplicate error)
    let item = await Wishlist.findOne({ userId: req.user._id, productId });
    if (!item) {
      item = await Wishlist.create({
        userId: req.user._id,
        productId
      });
    }

    return res.status(201).json({
      message: 'Added to wishlist',
      item
    });
  } catch (error) {
    // Handle rare race condition where duplicate index is triggered
    if (error.code === 11000) {
      const existing = await Wishlist.findOne({ userId: req.user._id, productId: req.body.productId });
      return res.status(201).json({
        message: 'Added to wishlist',
        item: existing
      });
    }
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private (Customer only)
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Valid productId is required' });
    }

    await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId
    });

    return res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};
