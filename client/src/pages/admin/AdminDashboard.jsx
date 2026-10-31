import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../../api/adminApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

/**
 * AdminDashboard
 *
 * Requirements:
 * - Table-first design (no flashy chart-heavy widgets).
 * - Call getDashboardSummary() on mount.
 * - Summary cards: Total Customers, Total Wholesalers, Total Products, Total Orders,
 *   Pending Orders, Low Stock Products, This Month's Revenue (using currentMonthRevenue).
 * - Recent Customer Orders: Order ID, Customer, Amount, Status badge.
 * - Recent Wholesale Orders: Order ID, Business, Amount, Status badge.
 * - Low Stock Products: Product, Variant, Available Qty, Threshold (warning background for out of stock).
 * - Recent Payments: Amount, Method, Status badge, Date.
 * - Empty state inline message ("No data yet.") if any list is empty.
 */
const AdminDashboard = () => {
  useDocumentTitle('Admin Dashboard');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading admin dashboard summary..." />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-2">Unable to load dashboard</p>
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#C62828] text-white font-semibold rounded-lg text-xs hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalCustomers = 0,
    totalWholesalers = 0,
    totalProducts = 0,
    totalOrders = 0,
    pendingOrders = 0,
    lowStockProductsCount = 0,
    currentMonthRevenue = 0,
    recentCustomerOrders = [],
    recentWholesaleOrders = [],
    lowStockProducts = [],
    recentPayments = []
  } = data || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Admin Overview Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational summary across catalog, users, pending fulfillment, and recent payments.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Summary Stat Cards (Clean, table-first metric grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Total Customers */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Total Customers
          </span>
          <p className="text-xl font-black text-gray-900 mt-1">{totalCustomers}</p>
          <Link to="/admin/users" className="text-[10px] text-[#C62828] hover:underline font-semibold mt-1 block">
            View users →
          </Link>
        </div>

        {/* Total Wholesalers */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Wholesalers
          </span>
          <p className="text-xl font-black text-gray-900 mt-1">{totalWholesalers}</p>
          <Link to="/admin/users" className="text-[10px] text-[#C62828] hover:underline font-semibold mt-1 block">
            Manage approvals →
          </Link>
        </div>

        {/* Total Products */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Total Products
          </span>
          <p className="text-xl font-black text-gray-900 mt-1">{totalProducts}</p>
          <span className="text-[10px] text-gray-400 font-medium mt-1 block">Active catalog</span>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Total Orders
          </span>
          <p className="text-xl font-black text-gray-900 mt-1">{totalOrders}</p>
          <span className="text-[10px] text-gray-400 font-medium mt-1 block">All-time count</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
            Pending Orders
          </span>
          <p className="text-xl font-black text-amber-900 mt-1">{pendingOrders}</p>
          <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Needs fulfillment</span>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white border border-red-200 rounded-xl p-3.5 shadow-2xs bg-red-50/20">
          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wide block">
            Low Stock Items
          </span>
          <p className="text-xl font-black text-red-900 mt-1">{lowStockProductsCount}</p>
          <span className="text-[10px] text-red-700 font-semibold mt-1 block">At/below threshold</span>
        </div>

        {/* Current Month Revenue */}
        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs bg-emerald-50/20 col-span-2 sm:col-span-3 lg:col-span-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
            This Month's Revenue
          </span>
          <p className="text-xl font-black text-emerald-900 mt-1">
            ₹{Number(currentMonthRevenue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Current calendar month</span>
        </div>
      </div>

      {/* Grid of Clean Tables: Recent Customer Orders & Recent Wholesale Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Recent Customer Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Customer Orders</h2>
              <p className="text-[11px] text-gray-500">Retail customer purchases</p>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{recentCustomerOrders.length} latest</span>
          </div>

          {recentCustomerOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 italic">No data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentCustomerOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {ord.orderNumber || ord._id?.substring(ord._id.length - 8)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="font-semibold block truncate max-w-[140px]">
                          {ord.customerSnapshot?.name || ord.userId?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                          {ord.customerSnapshot?.phone || ord.userId?.email || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Recent Wholesale Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Wholesale Orders</h2>
              <p className="text-[11px] text-gray-500">B2B bulk orders</p>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{recentWholesaleOrders.length} latest</span>
          </div>

          {recentWholesaleOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 italic">No data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Business</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentWholesaleOrders.map((word) => (
                    <tr key={word._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {word.orderNumber || word._id?.substring(word._id.length - 8)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="font-semibold block truncate max-w-[140px]">
                          {word.wholesalerId?.businessName || word.wholesalerId?.name || 'Wholesaler'}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                          {word.wholesalerId?.gstNumber ? `GST: ${word.wholesalerId.gstNumber}` : word.wholesalerId?.email || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ₹{Number(word.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={word.orderStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Clean Tables: Low Stock Products & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Low Stock Products */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Low Stock Products</h2>
              <p className="text-[11px] text-gray-500">Inventory levels requiring restock</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              {lowStockProducts.length} items
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 italic">No data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">Variant</th>
                    <th className="py-2.5 px-4 text-center">Available Qty</th>
                    <th className="py-2.5 px-4 text-right">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStockProducts.map((stk) => {
                    const isOutOfStock = (stk.availableQuantity ?? 0) <= 0;
                    return (
                      <tr
                        key={stk._id}
                        className={`transition ${isOutOfStock ? 'bg-red-50/60' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {stk.variantId?.productId?.productName || 'Product'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {stk.variantId?.displayName || (stk.variantId?.weight ? `${stk.variantId.weight}${stk.variantId.unit}` : 'Variant')}
                          <span className="block text-[10px] text-gray-400 font-mono">
                            SKU: {stk.variantId?.sku || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {stk.availableQuantity ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-500">
                          {stk.lowStockThreshold ?? 10}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Recent Payments */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Payments</h2>
              <p className="text-[11px] text-gray-500">Completed and pending transactions</p>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{recentPayments.length} latest</span>
          </div>

          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 italic">No data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-gray-700">
                        {pay.method || 'Online'}
                        {pay.transactionId && (
                          <span className="block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                            {pay.transactionId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={pay.status} type="payment" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
