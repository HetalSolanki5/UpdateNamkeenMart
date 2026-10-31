import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyWholesaleOrders } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const WholesaleOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyWholesaleOrders(page, 8);
        setOrders(data?.orders || []);
        setPagination({
          totalPages: data?.totalPages || 1,
          totalResults: data?.totalResults || 0
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch wholesale orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-gray-900">My Wholesale Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View, track, and manage your bulk orders.
          </p>
        </div>
        <Link
          to="/wholesaler/products"
          className="text-xs font-bold text-[#C62828] hover:underline self-start"
        >
          ← Browse Products
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading your wholesale orders..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          message="No wholesale orders placed yet. Start by browsing our products."
          actionLabel="Browse Wholesale Products"
          onAction={() => navigate('/wholesaler/products')}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {order.itemCount || '—'} items
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.paymentStatus} type="payment" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.orderStatus} type="order" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <Link
                        to={`/wholesaler/orders/${order._id}`}
                        className="text-[#C62828] hover:text-[#8E1B1B] font-bold"
                      >
                        View
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/wholesaler/orders/${order._id}/tracking`}
                        className="text-gray-600 hover:text-black font-semibold"
                      >
                        Track
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/wholesaler/invoices/${order._id}`}
                        className="text-gray-600 hover:text-black font-semibold"
                      >
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-black text-gray-900">{order.orderNumber}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <StatusBadge status={order.orderStatus} type="order" />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.paymentStatus} type="payment" />
                    <span className="text-gray-500">{order.itemCount} items</span>
                  </div>
                  <span className="font-black text-gray-900">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-bold pt-1 border-t border-gray-100">
                  <Link to={`/wholesaler/orders/${order._id}`} className="text-[#C62828]">
                    View
                  </Link>
                  <Link to={`/wholesaler/orders/${order._id}/tracking`} className="text-gray-600">
                    Track
                  </Link>
                  <Link to={`/wholesaler/invoices/${order._id}`} className="text-gray-600">
                    Invoice
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 font-medium px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WholesaleOrdersPage;
