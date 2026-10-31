import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyWholesaleOrders, getMyWholesalePayments } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

/**
 * Simple time-based greeting — no external library needed.
 * Morning: 5–11, Afternoon: 12–16, Evening: 17–23/0–4
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const WholesalerDashboard = () => {
  useDocumentTitle('Wholesaler Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch recent orders (first page, limit 5 for the table) + payments in parallel
        const [ordersData, paymentsData] = await Promise.all([
          getMyWholesaleOrders(1, 5),
          getMyWholesalePayments()
        ]);

        setOrders(ordersData?.orders || []);
        setTotalOrders(ordersData?.totalResults || 0);
        setPaymentSummary(paymentsData?.summary || null);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Count orders that are not yet delivered or cancelled
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ).length;

  const summaryCards = [
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: '📦',
      bg: 'bg-[#FDECEC]',
      text: 'text-[#C62828]'
    },
    {
      label: 'Total Purchases',
      value: paymentSummary
        ? `₹${Number(paymentSummary.totalPurchases || 0).toLocaleString('en-IN')}`
        : '—',
      icon: '💰',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700'
    },
    {
      label: 'Active Orders',
      value: pendingOrdersCount,
      icon: '🕐',
      bg: 'bg-amber-50',
      text: 'text-amber-700'
    },
    {
      label: 'Outstanding Payment',
      value: paymentSummary
        ? `₹${Number(paymentSummary.pendingAmount || 0).toLocaleString('en-IN')}`
        : '—',
      icon: '⚠️',
      bg: 'bg-orange-50',
      text: 'text-orange-700'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Wholesaler'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here's a snapshot of your wholesale account.
          {user?.businessName && (
            <span className="ml-1 font-medium text-gray-700">
              ({user.businessName})
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <Loader message="Loading your dashboard..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={`${card.bg} rounded-2xl p-4 border border-white shadow-sm`}
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className={`text-xl font-black mt-0.5 ${card.text}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900">Recent Orders</h2>
              <Link
                to="/wholesaler/orders"
                className="text-xs font-bold text-[#C62828] hover:text-[#8E1B1B] underline"
              >
                View All →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm mb-3">No orders placed yet.</p>
                <Link
                  to="/wholesaler/products"
                  className="inline-block bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Browse Wholesale Products →
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {order.itemCount || '—'} items
                          </td>
                          <td className="py-3 px-4 font-extrabold text-gray-900">
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.paymentStatus} type="payment" />
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.orderStatus} type="order" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/wholesaler/orders/${order._id}`}
                              className="text-[#C62828] hover:text-[#8E1B1B] font-bold"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {orders.map((order) => (
                    <div key={order._id} className="px-4 py-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-gray-900">{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <StatusBadge status={order.orderStatus} type="order" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <StatusBadge status={order.paymentStatus} type="payment" />
                          <span className="text-xs text-gray-500">
                            {order.itemCount} items
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </span>
                          <Link
                            to={`/wholesaler/orders/${order._id}`}
                            className="text-[10px] text-[#C62828] font-bold hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WholesalerDashboard;
