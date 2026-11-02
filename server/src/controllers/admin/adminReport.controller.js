import {
  Order,
  OrderItem,
  Product,
  Stock,
  User,
  WholesaleOrder,
  Payment
} from '../../models/index.js';

/**
 * @desc    Generate analytics and business reports for admin
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
export const getAdminReports = async (req, res, next) => {
  try {
    const { type = 'sales', from, to } = req.query;

    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = toDate;
      }
    }

    // 1. Sales Report
    if (type === 'sales') {
      const matchStage = { orderStatus: { $ne: 'cancelled' }, ...dateFilter };
      const [orderStats, monthlyStats] = await Promise.all([
        Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalOrders: { $sum: 1 }
            }
          }
        ]),
        Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      const totalRevenue = orderStats[0]?.totalRevenue || 0;
      const totalOrders = orderStats[0]?.totalOrders || 0;
      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      return res.status(200).json({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        monthly: monthlyStats.map((m) => ({ month: m._id, revenue: m.revenue, orders: m.orders }))
      });
    }

    // 2. Orders Report
    if (type === 'orders') {
      const orders = await Order.find(dateFilter)
        .populate('userId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return res.status(200).json({
        totalOrders: orders.length,
        orders
      });
    }

    // 3. Products Report
    if (type === 'products') {
      const topProducts = await OrderItem.aggregate([
        {
          $group: {
            _id: '$productNameSnapshot',
            soldQuantity: { $sum: '$quantity' },
            revenue: { $sum: '$subtotal' }
          }
        },
        { $sort: { soldQuantity: -1 } },
        { $limit: 10 }
      ]);

      return res.status(200).json({
        topProducts: topProducts.map((p) => ({
          productName: p._id,
          soldQuantity: p.soldQuantity,
          revenue: p.revenue
        }))
      });
    }

    // 4. Stock Report
    if (type === 'stock') {
      const stocks = await Stock.find()
        .populate({
          path: 'variantId',
          select: 'displayName weight unit sku productId',
          populate: {
            path: 'productId',
            select: 'productName'
          }
        })
        .lean();

      return res.status(200).json({
        stocks
      });
    }

    // 5. Customers Report
    if (type === 'customers') {
      const totalCustomers = await User.countDocuments({ role: 'customer' });
      const topCustomers = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
      ]);

      return res.status(200).json({
        totalCustomers,
        topCustomers: topCustomers.map((c) => ({
          name: c.user?.name || 'Customer',
          email: c.user?.email || '',
          phone: c.user?.phone || '',
          totalOrders: c.totalOrders,
          totalSpent: c.totalSpent
        }))
      });
    }

    // 6. Wholesalers Report
    if (type === 'wholesalers') {
      const [totalWholesalers, statusCounts, topWholesalers] = await Promise.all([
        User.countDocuments({ role: 'wholesaler' }),
        User.aggregate([
          { $match: { role: 'wholesaler' } },
          { $group: { _id: '$wholesalerStatus', count: { $sum: 1 } } }
        ]),
        WholesaleOrder.aggregate([
          { $match: { orderStatus: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: '$wholesalerId',
              totalOrders: { $sum: 1 },
              totalPurchases: { $sum: '$totalAmount' }
            }
          },
          { $sort: { totalPurchases: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'wholesaler'
            }
          },
          { $unwind: { path: '$wholesaler', preserveNullAndEmptyArrays: true } }
        ])
      ]);

      const byStatus = {};
      statusCounts.forEach((s) => {
        byStatus[s._id] = s.count;
      });

      return res.status(200).json({
        totalWholesalers,
        byStatus,
        topWholesalers: topWholesalers.map((w) => ({
          name: w.wholesaler?.name || 'Wholesaler',
          businessName: w.wholesaler?.businessName || '',
          gstNumber: w.wholesaler?.gstNumber || '',
          totalOrders: w.totalOrders,
          totalPurchases: w.totalPurchases
        }))
      });
    }

    // 7. Payments Report
    if (type === 'payments') {
      const payments = await Payment.find(dateFilter).sort({ createdAt: -1 }).lean();

      const byStatus = {};
      const byMethod = {};
      let totalAmount = 0;

      for (const p of payments) {
        const amt = p.amount || 0;
        totalAmount += amt;

        const s = p.status || 'pending';
        byStatus[s] = (byStatus[s] || 0) + amt;

        const m = p.method || 'cod';
        byMethod[m] = (byMethod[m] || 0) + amt;
      }

      return res.status(200).json({
        totalAmount,
        totalCount: payments.length,
        byStatus,
        byMethod,
        payments
      });
    }

    // 8. Revenue Report
    if (type === 'revenue') {
      const monthly = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' }, ...dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const totalRevenue = monthly.reduce((sum, m) => sum + (m.revenue || 0), 0);

      return res.status(200).json({
        totalRevenue,
        monthly: monthly.map((m) => ({ month: m._id, revenue: m.revenue }))
      });
    }

    return res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

