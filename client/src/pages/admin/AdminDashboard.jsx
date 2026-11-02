import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardSummary } from '../../api/adminApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

// Modular Sub-components
import StatCard from '../../components/admin/StatCard.jsx';
import BarChartCard from '../../components/admin/BarChartCard.jsx';
import StatusBreakdownList from '../../components/admin/StatusBreakdownList.jsx';

/**
 * Time-based greeting matching WholesalerDashboard pattern:
 * Morning: 5–11, Afternoon: 12–16, Evening: 17–23/0–4
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Formats current date: e.g. "Sunday, 1 November 2026"
 */
const getFormattedDate = () => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AdminDashboard = () => {
  useDocumentTitle('Admin Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Navigate to users search or orders search
    navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };

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

  // Admin user initials / avatar
  const adminName = user?.name || 'Administrator';
  const adminInitial = adminName.charAt(0).toUpperCase();

  // Combine orders for status breakdown analysis
  const combinedRecentOrders = [...recentCustomerOrders, ...recentWholesaleOrders];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* =========================================================================
          1. TOP SECTION - "Overview" Header with Greeting & Search & Profile
         ========================================================================= */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {getGreeting()}, {adminName.split(' ')[0]}
          </h1>
          <p className="text-xs font-medium text-gray-500 mt-1">
            {getFormattedDate()} &bull; Here is your store summary today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828] transition"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Top Quick Action to Product Management */}
          <Link
            to="/admin/products"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Products & Prices</span>
          </Link>

          {/* Refresh Action */}
          <button
            onClick={fetchDashboard}
            title="Refresh Dashboard"
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Admin Avatar Initial */}
          <div
            title={`Signed in as ${adminName}`}
            className="w-9 h-9 rounded-xl bg-[#C62828] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 cursor-default"
          >
            {adminInitial}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. STAT CARDS ROW (4 Brand-styled Rounded Cards)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue (Red Accent) */}
        <StatCard
          title="Total Revenue"
          value={`₹${Number(currentMonthRevenue || 0).toLocaleString('en-IN')}`}
          sublabel="Current month gross"
          theme="red"
          badgeText="Live"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Card 2: Total Orders (Dark/Neutral Accent) */}
        <StatCard
          title="Total Orders"
          value={totalOrders}
          sublabel={`Customers: ${totalCustomers} · Wholesalers: ${totalWholesalers}`}
          theme="dark"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        {/* Card 3: Pending Orders (Amber Accent) */}
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          sublabel="Requires warehouse action"
          theme="amber"
          badgeText={pendingOrders > 0 ? 'Action Needed' : 'Clear'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Card 4: Low Stock Alerts (Darker Red Warning Accent) */}
        <StatCard
          title="Low Stock Alerts"
          value={lowStockProductsCount}
          sublabel="Variants at or below threshold"
          theme="warningRed"
          badgeText={lowStockProductsCount > 0 ? 'Alert' : 'Nominal'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* =========================================================================
          3. CHARTS / VISUAL ROW (Bar Chart + Status Breakdown List Side-by-Side)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Orders Overview (Chart.js Bar Chart) */}
        <BarChartCard
          customerCount={recentCustomerOrders.length}
          wholesaleCount={recentWholesaleOrders.length}
          totalOrders={totalOrders}
        />

        {/* Panel B: Status Breakdown Panel (HTML/CSS Horizontal Progress Bars) */}
        <StatusBreakdownList orders={combinedRecentOrders} />
      </div>

      {/* =========================================================================
          4. EXISTING DATA TABLES (Restyled to Rounded Cards with Subtle Shadow)
         ========================================================================= */}

      {/* Grid: Recent Customer Orders & Recent Wholesale Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Recent Customer Orders */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Customer Orders</h2>
              <p className="text-[11px] text-gray-500">Latest retail orders placed by consumers</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-[#C62828] hover:text-[#8E1B1B] transition flex items-center gap-1"
            >
              View all <span>&rarr;</span>
            </Link>
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
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        <Link to={`/admin/orders/${ord._id}`} className="hover:text-[#C62828] hover:underline">
                          {ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {ord.customerSnapshot?.name || ord.userId?.name || 'Walk-in Customer'}
                        <span className="block text-[10px] text-gray-400">
                          {ord.customerSnapshot?.phone || ord.userId?.phone || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={ord.orderStatus} type="order" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Recent Wholesale Orders */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Wholesale Orders</h2>
              <p className="text-[11px] text-gray-500">Latest bulk B2B purchase requests</p>
            </div>
            <Link
              to="/admin/wholesale-orders"
              className="text-xs font-semibold text-[#C62828] hover:text-[#8E1B1B] transition flex items-center gap-1"
            >
              View all <span>&rarr;</span>
            </Link>
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
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        <Link to={`/admin/wholesale-orders/${word._id}`} className="hover:text-[#C62828] hover:underline">
                          {word.orderNumber || word._id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {word.wholesalerId?.businessName || word.wholesalerId?.name || 'Wholesale Partner'}
                        {word.wholesalerId?.gstNumber && (
                          <span className="block text-[10px] text-gray-400 font-mono">
                            GST: {word.wholesalerId.gstNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{Number(word.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={word.orderStatus} type="order" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Low Stock Products & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Low Stock Products */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Low Stock Inventory</h2>
              <p className="text-[11px] text-gray-500">Products currently below reorder threshold</p>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-[#C62828] hover:text-[#8E1B1B] transition flex items-center gap-1"
            >
              Update Stock & Prices <span>&rarr;</span>
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 italic">No low stock items. All inventories healthy.</div>
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
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
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
