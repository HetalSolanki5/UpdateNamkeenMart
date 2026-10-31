import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders } from '../../api/adminOrderApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All Order Statuses' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' }
];

const AdminOrdersPage = () => {
  // Filters state
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Data state
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounced search input (400ms)
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(val);
      setPage(1);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        orderStatus,
        paymentStatus,
        search: searchTerm,
        from: fromDate,
        to: toDate
      };

      const res = await getAdminOrders(params);
      setOrders(res?.orders || []);
      setPagination({
        totalPages: res?.totalPages || 1,
        totalResults: res?.totalResults || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customer orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, orderStatus, paymentStatus, searchTerm, fromDate, toDate]);

  const handleResetFilters = () => {
    setOrderStatus('');
    setPaymentStatus('');
    setSearchInput('');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Customer Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View, filter, and manage all retail customer orders.
          </p>
        </div>
        <div className="text-xs text-gray-500 font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs self-start">
          Total Results: <span className="text-gray-900 font-black">{pagination.totalResults}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search order #, customer, phone..."
                className="w-full text-xs px-3 py-2 pl-8 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#C62828] transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
              Order Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#C62828] bg-white transition"
            >
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#C62828] bg-white transition"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#C62828] bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#C62828] bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message="Loading customer orders..." />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-1">Error Loading Orders</p>
          <p className="text-xs mb-3">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-1.5 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          message="No orders found matching the selected filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Delivery City</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const customerName =
                    o.customerSnapshot?.name || o.userId?.name || 'Customer';
                  const customerPhone =
                    o.customerSnapshot?.phone || o.userId?.phone || '—';
                  const city =
                    o.deliveryAddressSnapshot?.city ||
                    o.shippingAddress?.city ||
                    '—';
                  const orderDate = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—';

                  return (
                    <tr key={o._id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {o.orderNumber || o._id.slice(-6)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {customerName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{customerPhone}</td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {orderDate}
                      </td>
                      <td className="py-3 px-4 font-black text-gray-900">
                        ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={o.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={o.orderStatus} type="order" />
                      </td>
                      <td className="py-3 px-4 text-gray-600">{city}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders/${o._id}`}
                          className="inline-block px-3 py-1 rounded-md text-xs font-bold text-[#C62828] bg-[#FDECEC] hover:bg-[#C62828] hover:text-white transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs">
              <span className="text-gray-500 font-medium">
                Page <span className="font-bold text-gray-800">{page}</span> of{' '}
                <span className="font-bold text-gray-800">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
