import mongoose from 'mongoose';
import { Order, OrderItem, Stock } from '../models/index.js';
import { createOrderFromCart, getOrderFullDetails, initiateRazorpayOrder, verifyAndCreateOrder } from '../services/order.service.js';

const STATUS_SEQUENCE = [
  'placed',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered'
];

// @desc    Checkout and place order from cart
// @route   POST /api/orders
// @access  Private (Customer only)
export const checkoutOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Valid delivery addressId is required.' });
    }

    const allowedPaymentMethods = ['upi', 'card', 'netbanking', 'cod'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid payment method. Allowed options: upi, card, netbanking, cod.'
      });
    }

    const result = await createOrderFromCart(req.user, { addressId, paymentMethod });

    return res.status(201).json({
      message: 'Order placed successfully',
      ...result
    });
  } catch (error) {
    const errorDetails = error?.error?.description || error?.message || 'Internal Server Error';
    return res.status(error.status || error.statusCode || 500).json({
      message: errorDetails
    });
  }
};

// @desc    Initiate checkout — COD: creates order immediately; Online: creates a Razorpay order
// @route   POST /api/orders/initiate
// @access  Private (Customer only)
export const initiateCheckout = async (req, res, next) => {
  try {
    const { addressId, paymentMethod } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Valid delivery addressId is required.' });
    }

    const allowedPaymentMethods = ['upi', 'card', 'netbanking', 'cod'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid payment method. Allowed options: upi, card, netbanking, cod.'
      });
    }

    // COD: create the order immediately (unchanged behavior from Phase 5A)
    if (paymentMethod === 'cod') {
      const result = await createOrderFromCart(req.user, { addressId, paymentMethod });
      return res.status(201).json({
        message: 'Order placed successfully',
        ...result
      });
    }

    // Online payment (upi / card / netbanking): do NOT create the order yet.
    // Instead, create a Razorpay order and return its ID to the frontend so it
    // can open the Razorpay checkout popup. The order is created only after the
    // customer completes payment and the signature is verified via /verify.
    const razorpayData = await initiateRazorpayOrder(req.user, { addressId });

    return res.status(200).json({
      razorpayOrderId: razorpayData.razorpayOrderId,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      // keyId is the PUBLIC Razorpay key — safe to expose to the frontend.
      // The secret key never leaves the server and is never included in any response.
      keyId: process.env.RAZORPAY_KEY_ID,
      addressId: razorpayData.addressId
    });
  } catch (error) {
    const errorDetails = error?.error?.description || error?.message || 'Internal Server Error';
    return res.status(error.status || error.statusCode || 500).json({
      message: errorDetails
    });
  }
};

// @desc    Verify Razorpay payment signature and create the order
// @route   POST /api/orders/verify
// @access  Private (Customer only)
export const verifyPayment = async (req, res, next) => {
  try {
    const { addressId, paymentMethod = 'online', razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Valid delivery addressId is required.' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.'
      });
    }

    // Verify signature and create order — returns same shape as createOrderFromCart
    const result = await verifyAndCreateOrder(req.user, {
      addressId,
      paymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    // Return 201 with the same shape the frontend's CheckoutPage success handler expects
    return res.status(201).json({
      message: 'Order placed successfully',
      ...result
    });
  } catch (error) {
    const errorDetails = error?.error?.description || error?.message || 'Internal Server Error';
    return res.status(error.status || error.statusCode || 500).json({
      message: errorDetails
    });
  }
};

// @desc    Get order history for logged-in customer
// @route   GET /api/orders
// @access  Private (Customer only)
export const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const totalResults = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalResults / limit) || 0;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        orders: [],
        page,
        totalPages: 0,
        totalResults: 0
      });
    }

    // Fetch order items to build summary & count
    const orderIds = orders.map((o) => o._id);
    const allItems = await OrderItem.find({ orderId: { $in: orderIds } }).lean();

    const itemsByOrder = new Map();
    for (const item of allItems) {
      const oid = item.orderId.toString();
      if (!itemsByOrder.has(oid)) {
        itemsByOrder.set(oid, []);
      }
      itemsByOrder.get(oid).push(item);
    }

    const formattedOrders = orders.map((order) => {
      const items = itemsByOrder.get(order._id.toString()) || [];
      const itemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
      const firstItemName = items[0]?.productNameSnapshot || 'Namkeen Item';
      const summary =
        items.length > 1
          ? `${firstItemName} and ${items.length - 1} more`
          : firstItemName;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryCharge: order.deliveryCharge,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount,
        summary
      };
    });

    return res.status(200).json({
      orders: formattedOrders,
      page,
      totalPages,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete order details by ID
// @route   GET /api/orders/:id
// @access  Private (Owner or Admin)
export const getOrderById = async (req, res, next) => {
  try {
    const result = await getOrderFullDetails(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    const errorDetails = error?.error?.description || error?.message || 'Internal Server Error';
    return res.status(error.status || error.statusCode || 500).json({
      message: errorDetails
    });
  }
};

// @desc    Get order tracking timeline
// @route   GET /api/orders/:id/tracking
// @access  Private (Owner or Admin)
export const getOrderTracking = async (req, res, next) => {
  try {
    const { order } = await getOrderFullDetails(req.params.id, req.user);

    const isCancelled = order.orderStatus === 'cancelled';

    let timeline = [];

    if (isCancelled) {
      timeline = [
        { status: 'placed', label: 'Order Placed', state: 'done' },
        { status: 'cancelled', label: 'Order Cancelled', state: 'current' }
      ];
    } else {
      const currentIndex = STATUS_SEQUENCE.indexOf(order.orderStatus);

      timeline = STATUS_SEQUENCE.map((statusKey, index) => {
        let state = 'upcoming';
        if (index < currentIndex) {
          state = 'done';
        } else if (index === currentIndex) {
          state = 'current';
        }

        const label = statusKey
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          status: statusKey,
          label,
          state
        };
      });
    }

    return res.status(200).json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      currentStatus: order.orderStatus,
      isCancelled,
      note: isCancelled
        ? 'This order was cancelled. Stock has been returned to inventory.'
        : `Order is currently ${order.orderStatus}.`,
      timeline
    });
  } catch (error) {
    const errorDetails = error?.error?.description || error?.message || 'Internal Server Error';
    return res.status(error.status || error.statusCode || 500).json({
      message: errorDetails
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const validStatuses = [...STATUS_SEQUENCE, 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update a cancelled order.' });
    }

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({ message: 'Order has already been delivered.' });
    }

    // Validate legal next step forward or cancelled
    if (status !== 'cancelled') {
      const currentIndex = STATUS_SEQUENCE.indexOf(order.orderStatus);
      const nextIndex = STATUS_SEQUENCE.indexOf(status);

      if (nextIndex <= currentIndex) {
        return res.status(400).json({
          message: `Cannot move status backwards from ${order.orderStatus} to ${status}.`
        });
      }
    }

    // If status becomes "cancelled", restore stock for each order item
    if (status === 'cancelled') {
      const orderItems = await OrderItem.find({ orderId: order._id });
      for (const item of orderItems) {
        if (item.variantId) {
          await Stock.findOneAndUpdate(
            { variantId: item.variantId },
            { $inc: { availableQuantity: item.quantity } }
          );
        }
      }
    }

    order.orderStatus = status;

    // If order is delivered, mark COD payment as paid
    if (status === 'delivered' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    return res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};
