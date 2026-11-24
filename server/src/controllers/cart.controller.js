import mongoose from 'mongoose';
import { Cart, CartItem, Variant, Stock } from '../models/index.js';
import { getBestWholeOrderOffer, applyCartDiscount } from '../utils/offerCalculator.js';

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

    // Validate variant exists and isActive
    const variant = await Variant.findOne({ _id: variantId, isActive: true });
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Find or create cart for user
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Check existing item
    const existingItem = await CartItem.findOne({
      cartId: cart._id,
      variantId: variant._id
    });

    const targetQuantity = existingItem ? existingItem.quantity + addQuantity : addQuantity;

    // Check Stock: availableQuantity - reservedQuantity must be >= targetQuantity
    const stock = await Stock.findOne({ variantId: variant._id });
    const available = stock ? ((stock.availableQuantity || 0) - (stock.reservedQuantity || 0)) : 0;

    if (available < targetQuantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Update quantity or create new item
    if (existingItem) {
      existingItem.quantity = targetQuantity;
      await existingItem.save();
    } else {
      await CartItem.create({
        cartId: cart._id,
        variantId: variant._id,
        quantity: targetQuantity
      });
    }

    // Return 201 with updated cart
    const cartData = await getCartDetails(cart._id, req.user._id);
    return res.status(201).json(cartData);
  } catch (error) {
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

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = await CartItem.findOne({ _id: itemId, cartId: cart._id });
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Re-check stock for new quantity
    const stock = await Stock.findOne({ variantId: cartItem.variantId });
    const available = stock ? ((stock.availableQuantity || 0) - (stock.reservedQuantity || 0)) : 0;

    if (available < parsedQty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    cartItem.quantity = parsedQty;
    await cartItem.save();

    const cartData = await getCartDetails(cart._id, req.user._id);
    return res.status(200).json(cartData);
  } catch (error) {
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

    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      await CartItem.findOneAndDelete({ _id: itemId, cartId: cart._id });
    }

    const cartData = cart
      ? await getCartDetails(cart._id)
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
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      await CartItem.deleteMany({ cartId: cart._id });
    }

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
