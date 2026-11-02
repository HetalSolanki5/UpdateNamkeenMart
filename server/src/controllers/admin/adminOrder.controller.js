import mongoose from 'mongoose';
import { Order, OrderItem, WholesaleOrder, WholesaleOrderItem, Payment } from '../../models/index.js';

/**
 * @desc    Get paginated customer orders for admin with optional filters
 * @route   GET /api/admin/orders
 * @access  Private (Admin only)
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, search, from, to, page = 1, limit = 10 } = req.query;

    const query = {};

    if (orderStatus && orderStatus.trim() !== '') {
      query.orderStatus = orderStatus.trim();
    }

    if (paymentStatus && paymentStatus.trim() !== '') {
      query.paymentStatus = paymentStatus.trim();
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { orderNumber: searchRegex },
        { 'customerSnapshot.name': searchRegex },
        { 'customerSnapshot.phone': searchRegex },
        { 'customerSnapshot.email': searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalResults] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      orders,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum) || 0,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer order details by ID for admin
 * @route   GET /api/admin/orders/:id
 * @access  Private (Admin only)
 */
export const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(id).populate('userId', 'name email phone').lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [orderItems, payment] = await Promise.all([
      OrderItem.find({ orderId: order._id }).lean(),
      Payment.findOne({ orderId: order._id }).lean()
    ]);

    return res.status(200).json({
      order,
      orderItems: orderItems || [],
      payment: payment || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated wholesale orders for admin
 * @route   GET /api/admin/wholesale-orders
 * @access  Private (Admin only)
 */
export const getAdminWholesaleOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, search, from, to, page = 1, limit = 10 } = req.query;

    const query = {};

    if (orderStatus && orderStatus.trim() !== '') {
      query.orderStatus = orderStatus.trim();
    }

    if (paymentStatus && paymentStatus.trim() !== '') {
      query.paymentStatus = paymentStatus.trim();
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    if (search && search.trim() !== '') {
      query.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalResults] = await Promise.all([
      WholesaleOrder.find(query)
        .populate('wholesalerId', 'name businessName gstNumber phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WholesaleOrder.countDocuments(query)
    ]);

    return res.status(200).json({
      orders,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum) || 0,
      totalResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single wholesale order details by ID for admin
 * @route   GET /api/admin/wholesale-orders/:id
 * @access  Private (Admin only)
 */
export const getAdminWholesaleOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Wholesale order not found' });
    }

    const order = await WholesaleOrder.findById(id)
      .populate('wholesalerId', 'name businessName gstNumber phone email')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Wholesale order not found' });
    }

    const orderItems = await WholesaleOrderItem.find({ wholesaleOrderId: order._id }).lean();

    return res.status(200).json({
      order,
      orderItems: orderItems || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update wholesale order status by admin
 * @route   PUT /api/admin/wholesale-orders/:id/status
 * @access  Private (Admin only)
 */
export const updateAdminWholesaleOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Wholesale order not found' });
    }

    const order = await WholesaleOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Wholesale order not found' });
    }

    order.orderStatus = status;
    await order.save();

    return res.status(200).json({
      message: 'Wholesale order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

