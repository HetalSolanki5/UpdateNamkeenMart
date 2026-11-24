import mongoose from 'mongoose';
import { Cart, CartItem, Variant, Stock } from '../models/index.js';
import { getBestWholeOrderOffer, applyCartDiscount } from '../utils/offerCalculator.js';
import * as cartService from '../services/cartService.js';

/**
 * Helper to compute stockStatus based on Stock record:
 * - "out_of_stock": available <= reserved
 * - "low_stock": available <= lowStockThreshold and > reserved
 * - "in_stock": available > reserved
 */
const computeStockStatus = (stock) => {
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

/**
 * Helper to retrieve and format the full cart details
 */
const getCartDetails = async (cartId, userId = null) => {
  const cartItems = await CartItem.find({ cartId })
    .populate({
      path: 'variantId',
      populate: {
        path: 'productId',
        select: '_id productName productImages isActive'
      }
    })
    .lean();

  let subtotal = 0;
  const items = [];

  for (const item of cartItems) {
    const variant = item.variantId;
    if (!variant || !variant.isActive || !variant.productId || !variant.productId.isActive) {
      continue;
    }

    // Always fetch latest stock directly from database
    const stock = await Stock.findOne({ variantId: variant._id }).lean();
    const stockStatus = computeStockStatus(stock);

    const itemSubtotal = variant.sellingPrice * item.quantity;
    subtotal += itemSubtotal;

    items.push({
      _id: item._id,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      variant: {
        _id: variant._id,
        weight: variant.weight,
        unit: variant.unit,
        displayName: variant.displayName,
        sellingPrice: variant.sellingPrice,
        sku: variant.sku,
        stockStatus
      },
      product: {
        _id: variant.productId._id,
        productName: variant.productId.productName,
        productImages: variant.productId.productImages
      }
    });
  }

  // PHASE 10E & 10G: Check for best whole-order discount (cart-threshold or loyalty offer)
  // Single decision point via getBestWholeOrderOffer to evaluate threshold & customer loyalty
  const bestWholeOffer = await getBestWholeOrderOffer(userId, subtotal);
  const cartDiscount = applyCartDiscount(subtotal, bestWholeOffer);

  const deliveryCharge = 0; // Fixed placeholder in this phase
  const total = cartDiscount.finalSubtotal + deliveryCharge;

  return {
    items,
    subtotal, // Unchanged subtotal before cart discount
    cartDiscountAmount: cartDiscount.discountAmount,
    cartOfferName: cartDiscount.offerName,
    deliveryCharge,
    total
  };
};

// @desc    Get user's shopping cart
// @route   GET /api/cart
// @access  Private (Customer only)
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const cartData = await getCartDetails(cart._id, req.user._id);
    return res.status(200).json(cartData);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private (Customer only)
export const addToCart = async (req, res, next) => {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Valid variantId is required' });
    }

    const parsedQty = parseInt(quantity, 10);
    const addQuantity = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;

    // Use cartService.addToCart logic
    await cartService.addToCart(req.user._id, variantId, addQuantity);

    const cart = await Cart.findOne({ userId: req.user._id });
    const cartData = await getCartDetails(cart._id, req.user._id);
    return res.status(201).json(cartData);
  } catch (error) {
    if (error.message && (error.message.includes('not found') || error.message.includes('unavailable'))) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message && (error.message.includes('stock') || error.message.includes('quantity'))) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:itemId
// @access  Private (Customer only)
export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Valid itemId is required' });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be at least 1. To remove, use DELETE.' });
    }

    // Use cartService.updateQuantity
    await cartService.updateQuantity(req.user._id, itemId, parsedQty);

    const cart = await Cart.findOne({ userId: req.user._id });
    const cartData = await getCartDetails(cart._id, req.user._id);
    return res.status(200).json(cartData);
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message && (error.message.includes('stock') || error.message.includes('quantity'))) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Remove one item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private (Customer only)
export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Valid itemId is required' });
    }

    // Use cartService.removeItem
    await cartService.removeItem(req.user._id, itemId);

    const cart = await Cart.findOne({ userId: req.user._id });
    const cartData = cart
      ? await getCartDetails(cart._id, req.user._id)
      : { items: [], subtotal: 0, deliveryCharge: 0, total: 0 };

    return res.status(200).json(cartData);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items from cart
// @route   DELETE /api/cart
// @access  Private (Customer only)
export const clearCart = async (req, res, next) => {
  try {
    // Use cartService.clearCart
    await cartService.clearCart(req.user._id);

    return res.status(200).json({
      items: [],
      subtotal: 0,
      deliveryCharge: 0,
      total: 0
    });
  } catch (error) {
    next(error);
  }
};
