
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Place New Order
export const placeOrder = async (userId, orderData, items) => {
    if (!userId || !items || items.length === 0) {
        throw new Error('User and order items are required');
    }

    const session = await mongoose.startSession();

    try {
        let createdOrder;

        await session.withTransaction(async () => {
            let totalAmount = 0;

            // Check product stock and calculate total
            for (const item of items) {
                const product = await Product.findById(item.productId)
                    .session(session);

                if (!product) {
                    throw new Error('Product not found');
                }

                if (product.stock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for ${product.name}`
                    );
                }

                totalAmount += product.price * item.quantity;
            }

            const discountAmount = orderData.discountAmount || 0;

            if (discountAmount < 0 || discountAmount > totalAmount) {
                throw new Error('Invalid discount amount');
            }

            // Create order
            const [order] = await Order.create(
                [{
                    orderNumber: `ORD-${Date.now()}`,
                    userId,
                    customerSnapshot: orderData.customerSnapshot,
                    deliveryAddressSnapshot: orderData.deliveryAddressSnapshot,
                    totalAmount: totalAmount - discountAmount,
                    discountAmount,
                    appliedOfferName: orderData.appliedOfferName || '',
                    orderStatus: 'Pending',
                    paymentStatus: 'Pending'
                }],
                { session }
            );

            // Save order items and reduce stock
            for (const item of items) {
                const product = await Product.findById(item.productId)
                    .session(session);

                product.stock -= item.quantity;
                await product.save({ session });

                await OrderItem.create(
                    [{
                        orderId: order._id,
                        productId: product._id,
                        quantity: item.quantity,
                        price: product.price
                    }],
                    { session }
                );
            }

            createdOrder = order;
        });

        return createdOrder;
    } finally {
        await session.endSession();
    }
};


// Get All Orders
export const getAllOrders = async () => {
    return await Order.find()
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });
};


// Get Order By ID
export const getOrderById = async (orderId) => {
    const order = await Order.findById(orderId)
        .populate('userId', 'name email phone');

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};


// Get Orders By User
export const getOrdersByUser = async (userId) => {
    return await Order.find({ userId })
        .sort({ createdAt: -1 });
};


// Update Order Status
export const updateStatus = async (orderId, status) => {
    const allowedStatuses = [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled'
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid order status');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.orderStatus === 'Cancelled') {
        throw new Error('Cancelled order cannot be updated');
    }

    order.orderStatus = status;

    await order.save();

    return order;
};


// Cancel Order and Restore Stock
export const cancelOrderAndRestoreStock = async (orderId) => {
    const session = await mongoose.startSession();

    try {
        let cancelledOrder;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.orderStatus === 'Cancelled') {
                throw new Error('Order is already cancelled');
            }

            if (order.orderStatus === 'Delivered') {
                throw new Error('Delivered order cannot be cancelled');
            }

            const orderItems = await OrderItem.find({
                orderId
            }).session(session);

            // Restore product stock
            for (const item of orderItems) {
                const product = await Product.findById(
                    item.productId
                ).session(session);

                if (product) {
                    product.stock += item.quantity;
                    await product.save({ session });
                }
            }

            order.orderStatus = 'Cancelled';

            await order.save({ session });

            cancelledOrder = order;
        });

        return cancelledOrder;
    } finally {
        await session.endSession();
    }
};


// Get Order Items
export const getOrderItems = async (orderId) => {
    return await OrderItem.find({ orderId })
        .populate('productId');
};


// Default Export
const orderService = {
    placeOrder,
    getAllOrders,
    getOrderById,
    getOrdersByUser,
    updateStatus,
    cancelOrderAndRestoreStock,
    getOrderItems
};

export default orderService;
