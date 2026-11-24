import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/orderApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const MyOrdersPage = () => {
  useDocumentTitle('My Orders');
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
        const data = await getMyOrders(page, 8);
        setOrders(data?.orders || []);
        setPagination({
          totalPages: data?.totalPages || 1,
          totalResults: data?.totalResults || 0
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'paid' || s === 'success') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'pending' || s === 'confirmed' || s === 'processing' || s === 'packed' || s === 'placed') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track your order history, delivery status, and tax invoices.
          </p>
        </div>
        <Link
          to="/customer/shop"
          className="text-xs font-bold text-[#C62828] hover:text-[#8E1B1B] underline self-start sm:self-auto"
        >
          &larr; Explore Catalogue
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading your order history..." />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          message="No orders placed yet. Start exploring our traditional namkeens!"
          actionLabel="Go to Shop"
          onAction={() => navigate('/customer/shop')}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items Summary</th>
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
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">
                      <span className="font-medium">{order.summary}</span>
                      <span className="text-gray-400 block text-[11px]">({order.itemCount} items)</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      ₹{order.totalAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/customer/orders/${order._id}`}
                        className="text-[#C62828] hover:text-[#8E1B1B] font-bold"
                      >
                        Details
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/customer/orders/${order._id}/tracking`}
                        className="text-gray-600 hover:text-black font-semibold"
                      >
                        Track
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to={`/customer/invoices/${order._id}`}
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

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 line-clamp-1">{order.summary}</p>
                    <p className="text-[11px] text-gray-400">{order.itemCount} item(s)</p>
                  </div>
                  <span className="text-sm font-black text-gray-900">₹{order.totalAmount}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="space-x-1.5">
                    <span className="text-gray-400 text-[10px]">Payment:</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${getStatusBadge(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="space-x-3 font-bold text-xs">
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="text-[#C62828] hover:underline"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/customer/orders/${order._id}/tracking`}
                      className="text-gray-600 hover:text-black"
                    >
                      Track
                    </Link>
                    <Link
                      to={`/customer/invoices/${order._id}`}
                      className="text-gray-600 hover:text-black"
                    >
                      Invoice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 font-medium px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-xs font-semibold disabled:opacity-40"
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

export default MyOrdersPage;
