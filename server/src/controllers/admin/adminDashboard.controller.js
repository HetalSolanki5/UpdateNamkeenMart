import {
  User,
  Product,
  Variant,
  Stock,
  Order,
  WholesaleOrder,
  Payment
} from '../../models/index.js';
import { computeStockStatus } from '../product.controller.js';

/**
 * @desc    Get complete admin dashboard summary
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    // Current month start date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel aggregate queries for metrics
    const [
      totalCustomers,
      totalWholesalers,
      totalProducts,
      totalOrders,
      pendingOrders,
      stocks,
      revenueResult,
      recentCustomerOrders,
      recentWholesaleOrders,
      recentPayments
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'wholesaler' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed', 'processing', 'packed'] } }),
      Stock.find()
        .populate({
          path: 'variantId',
          select: 'displayName weight unit sku productId',
          populate: {
            path: 'productId',
            select: 'productName'
          }
        })
        .lean(),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            orderStatus: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]),
      Order.find()
        .populate('userId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      WholesaleOrder.find()
        .populate('wholesalerId', 'name businessName gstNumber phone email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Compute low stock products
    const lowStockList = [];
    for (const stk of stocks) {
      const status = computeStockStatus(stk);
      if (status === 'low_stock' || status === 'out_of_stock') {
        lowStockList.push({
          ...stk,
          stockStatus: status
        });
      }
    }

    const currentMonthRevenue = revenueResult[0]?.totalRevenue || 0;

    return res.status(200).json({
      totalCustomers,
      totalWholesalers,
      totalProducts,
      totalOrders,
      pendingOrders,
      lowStockProductsCount: lowStockList.length,
      currentMonthRevenue,
      recentCustomerOrders,
      recentWholesaleOrders,
      lowStockProducts: lowStockList.slice(0, 5),
      recentPayments
    });
  } catch (error) {
    next(error);
  }
};

