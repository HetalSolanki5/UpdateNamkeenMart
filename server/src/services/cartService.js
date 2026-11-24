
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Variant from '../models/Variant.js';
import Stock from '../models/Stock.js';

// Add Item to Cart
export const addToCart = async (userId, variantId, quantity) => {
    if (!userId || !variantId || !quantity || quantity <= 0) {
        throw new Error('User, variant and valid quantity are required');
    }

    // Check user cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({ userId });
    }

    // Check variant
    const variant = await Variant.findById(variantId);

    if (!variant || !variant.isActive) {
        throw new Error('Product variant not found or inactive');
    }

    // Check stock availability
    const stock = await Stock.findOne({ variantId });

    if (!stock || stock.availableQuantity < quantity) {
        throw new Error('Insufficient stock available');
    }

    // Check minimum order quantity
    if (quantity < variant.minOrderQty) {
        throw new Error(
            `Minimum order quantity is ${variant.minOrderQty}`
        );
    }

    // Check whether item already exists
    let cartItem = await CartItem.findOne({
        cartId: cart._id,
        variantId
    });

    if (cartItem) {
        const newQuantity = cartItem.quantity + quantity;

        if (newQuantity > stock.availableQuantity) {
            throw new Error('Requested quantity exceeds available stock');
        }

        cartItem.quantity = newQuantity;
        await cartItem.save();
    } else {
        cartItem = await CartItem.create({
            cartId: cart._id,
            variantId,
            quantity
        });
    }

    return cartItem;
};


// Get User Cart
export const getCart = async (userId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error('Cart not found');
    }

    const cartItems = await CartItem.find({
        cartId: cart._id
    }).populate({
        path: 'variantId'
    });

    return {
        cart,
        items: cartItems
    };
};


// Update Cart Item Quantity
export const updateQuantity = async (
    userId,
    cartItemId,
    quantity
) => {
    if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error('Cart not found');
    }

    const cartItem = await CartItem.findOne({
        _id: cartItemId,
        cartId: cart._id
    }).populate('variantId');

    if (!cartItem) {
        throw new Error('Cart item not found');
    }

    const variant = cartItem.variantId;

    if (!variant || !variant.isActive) {
        throw new Error('Product variant is unavailable');
    }

    if (quantity < variant.minOrderQty) {
        throw new Error(
            `Minimum order quantity is ${variant.minOrderQty}`
        );
    }

    const stock = await Stock.findOne({
        variantId: variant._id
    });

    if (!stock || quantity > stock.availableQuantity) {
        throw new Error('Insufficient stock available');
    }

    cartItem.quantity = quantity;

    await cartItem.save();

    return cartItem;
};


// Remove Item From Cart
export const removeItem = async (userId, cartItemId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error('Cart not found');
    }

    const cartItem = await CartItem.findOneAndDelete({
        _id: cartItemId,
        cartId: cart._id
    });

    if (!cartItem) {
        throw new Error('Cart item not found');
    }

    return {
        message: 'Item removed from cart successfully'
    };
};


// Clear Entire Cart
export const clearCart = async (userId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new Error('Cart not found');
    }

    await CartItem.deleteMany({
        cartId: cart._id
    });

    return {
        message: 'Cart cleared successfully'
    };
};


// Get Cart Item Count
export const getCartItemCount = async (userId) => {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return 0;
    }

    return await CartItem.countDocuments({
        cartId: cart._id
    });
};


// Default Export
const cartService = {
    addToCart,
    getCart,
    updateQuantity,
    removeItem,
    clearCart,
    getCartItemCount
};

export default cartService;
