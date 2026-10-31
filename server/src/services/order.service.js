import mongoose from 'mongoose';
import {
  Order,
  OrderItem,
  Payment,
  Invoice,
  Cart,
  CartItem,
  Variant,
  Stock,
  Product,
  User
} from '../models/index.js';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generateCode.js';

/**
 * Core checkout business logic: validates address, verifies fresh stock & prices,
 * reduces stock, creates Order, OrderItems, Payment, Invoice, and clears cart.
 *
 * NOTE ON STOCK TRANSACTIONS & ROLLBACK:
 * In production multi-server MongoDB setups, replica sets enable native multi-document
 * ACID transactions (session.startTransaction()). However, in single-node local MongoDB
 * environments (often used in student or local development setups without replica sets),
 * transactions throw "Transactions are not supported by this deployment".
 * Therefore, we implement a compensating rollback pattern: we keep track of all stock
 * reductions and, in case of any subsequent failure before checkout completion, we
 * immediately restore the reduced quantities back to the Stock collection.
 */
export const createOrderFromCart = async (user, { addressId, paymentMethod }) => {
  // 1. Double-check user role
  if (!user || user.role !== 'customer') {
    const err = new Error('Only customers can place orders.');
    err.status = 403;
    throw err;
  }

  // Reload fresh user from DB to ensure addresses are up-to-date
  const freshUser = await User.findById(user._id);
  if (!freshUser) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  // 2. Find delivery address in user.addresses
  const foundAddress = freshUser.addresses.id(addressId);
  if (!foundAddress) {
    const err = new Error('Delivery address not found.');
    err.status = 400;
    throw err;
  }

  // 3. Load user's Cart and CartItems
  const cart = await Cart.findOne({ userId: freshUser._id });
  if (!cart) {
    const err = new Error('Your cart is empty.');
    err.status = 400;
    throw err;
  }

  const cartItems = await CartItem.find({ cartId: cart._id });
  if (!cartItems || cartItems.length === 0) {
    const err = new Error('Your cart is empty.');
    err.status = 400;
    throw err;
  }

  // 4. Validate all cart items with fresh data from DB
  const validatedItems = [];

  for (const item of cartItems) {
    const variant = await Variant.findById(item.variantId);
    if (!variant || !variant.isActive) {
      const err = new Error('One of the items in your cart is no longer available.');
      err.status = 400;
      throw err;
    }

    const product = await Product.findById(variant.productId);
    if (!product || !product.isActive) {
      const err = new Error(`Product for ${variant.displayName || 'variant'} is no longer available.`);
      err.status = 400;
      throw err;
    }

    const stock = await Stock.findOne({ variantId: variant._id });
    if (!stock) {
      const err = new Error(`Stock record not found for ${variant.displayName || 'item'}.`);
      err.status = 400;
      throw err;
    }

    const available = (stock.availableQuantity || 0) - (stock.reservedQuantity || 0);
    if (available < item.quantity) {
      const err = new Error(`Insufficient stock for ${variant.displayName || product.productName}. Available: ${available}, requested: ${item.quantity}`);
      err.status = 400;
      throw err;
    }

    // Never trust frontend prices: read directly from database
    const unitPrice = variant.sellingPrice;
    const itemSubtotal = unitPrice * item.quantity;

    validatedItems.push({
      item,
      variant,
      product,
      stock,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal
    });
  }

  // Track reduced stocks for compensating rollback in case of subsequent errors
  const reducedStocks = [];

  try {
    // 5. Reduce stock for each item
    for (const valItem of validatedItems) {
      valItem.stock.availableQuantity -= valItem.quantity;
      await valItem.stock.save();
      reducedStocks.push({
        stockId: valItem.stock._id,
        quantity: valItem.quantity
      });
    }

    // 6. Compute totals
    const totalAmount = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryCharge = 0; // Fixed flat placeholder

    // 7. Create Order document
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      userId: freshUser._id,
      customerSnapshot: {
        name: freshUser.name,
        phone: freshUser.phone,
        email: freshUser.email
      },
      deliveryAddressSnapshot: {
        receiverName: foundAddress.receiverName,
        phoneNumber: foundAddress.phoneNumber,
        houseBuilding: foundAddress.houseBuilding,
        subAddressArea: foundAddress.subAddressArea,
        city: foundAddress.city,
        state: foundAddress.state,
        pincode: foundAddress.pincode,
        landmark: foundAddress.landmark || ''
      },
      totalAmount,
      deliveryCharge,
      orderStatus: 'placed',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
    });

    // 8. Create OrderItems
    const orderItemsToCreate = validatedItems.map((valItem) => ({
      orderId: order._id,
      variantId: valItem.variant._id,
      productNameSnapshot: valItem.product.productName,
      variantSnapshot: valItem.variant.displayName || `${valItem.variant.weight}${valItem.variant.unit}`,
      quantity: valItem.quantity,
      unitPrice: valItem.unitPrice,
      subtotal: valItem.subtotal
    }));

    const orderItems = await OrderItem.insertMany(orderItemsToCreate);

    // 9. Create Payment document (simulated transaction)
    const transactionId = `TXN-${Date.now()}`;
    const payment = await Payment.create({
      orderId: order._id,
      userId: freshUser._id,
      amount: totalAmount,
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'success',
      transactionId
    });

    // 10. Create Invoice document
    const invoiceNumber = generateInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      userId: freshUser._id,
      totalAmount,
      invoiceDate: new Date()
    });

    // 11. Clear Cart
    await CartItem.deleteMany({ cartId: cart._id });

    // 13. Return all created documents
    return {
      order,
      orderItems,
      payment,
      invoice
    };
  } catch (error) {
    // 12. Compensating rollback: restore reduced stock if any DB creation step failed
    console.error('Error during checkout execution. Rolling back reduced stock...', error);
    for (const reduced of reducedStocks) {
      try {
        await Stock.findByIdAndUpdate(reduced.stockId, {
          $inc: { availableQuantity: reduced.quantity }
        });
      } catch (rollbackErr) {
        console.error('Critical: Failed to restore stock during rollback:', rollbackErr);
      }
    }
    throw error;
  }
};

/**
 * Helper to fetch complete order details with OrderItems, Payment, and Invoice,
 * enforcing ownership/role security check.
 */
export const getOrderFullDetails = async (orderId, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  // Security check: only the order's owner or an admin can access full details
  const isOwner = order.userId.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    const err = new Error('Access denied.');
    err.status = 403;
    throw err;
  }

  const [orderItems, payment, invoice] = await Promise.all([
    OrderItem.find({ orderId: order._id }).lean(),
    Payment.findOne({ orderId: order._id }).lean(),
    Invoice.findOne({ orderId: order._id }).lean()
  ]);

  return {
    order,
    orderItems: orderItems || [],
    payment: payment || null,
    invoice: invoice || null
  };
};
