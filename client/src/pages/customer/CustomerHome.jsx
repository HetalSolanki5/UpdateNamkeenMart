import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyOrders } from '../../api/orderApi.js';
import { getWishlist } from '../../api/wishlistApi.js';
import { getAddresses } from '../../api/addressApi.js';
import { useCart } from '../../context/CartContext.jsx';

const CustomerHome = () => {
  const { user, logoutUser } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: 0,
    addressCount: 0,
    recentOrders: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      try {
        const [ordersRes, wishRes, addrRes] = await Promise.allSettled([
          getMyOrders(1, 4),
          getWishlist(),
          getAddresses()
        ]);

        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value?.orders || [] : [];
        const totalOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.totalResults || orders.length) : 0;
        
        const wishItems = wishRes.status === 'fulfilled' ? (wishRes.value?.items || wishRes.value?.wishlist || []) : [];
        const addrList = addrRes.status === 'fulfilled' ? (addrRes.value?.addresses || []) : [];

        setStats({
          totalOrders,
          wishlistCount: wishItems.length,
          addressCount: addrList.length,
          recentOrders: orders
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center text-2xl font-black shadow-xs">
            {user?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                Customer Dashboard
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              {getTimeGreeting()}, {user?.name || 'Customer'}!
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/customer/shop"
            className="flex-1 sm:flex-initial text-center px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Browse Shop &rarr;
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-[#C62828] text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">My Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#C62828] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {loadingStats ? '...' : stats.totalOrders}
          </div>
          <Link to="/customer/orders" className="text-[11px] font-semibold text-[#C62828] hover:underline mt-1 inline-block">
            View all orders &rarr;
          </Link>
        </div>

        {/* Cart Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">In Cart</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#C62828] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {cart?.items?.length || 0}
          </div>
          <Link to="/customer/cart" className="text-[11px] font-semibold text-[#C62828] hover:underline mt-1 inline-block">
            Proceed to checkout &rarr;
          </Link>
        </div>

        {/* Wishlist Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Wishlist</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#C62828] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {loadingStats ? '...' : stats.wishlistCount}
          </div>
          <Link to="/customer/wishlist" className="text-[11px] font-semibold text-[#C62828] hover:underline mt-1 inline-block">
            View saved items &rarr;
          </Link>
        </div>

        {/* Addresses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Addresses</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#C62828] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900">
            {loadingStats ? '...' : stats.addressCount}
          </div>
          <Link to="/customer/addresses" className="text-[11px] font-semibold text-[#C62828] hover:underline mt-1 inline-block">
            Manage delivery &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-500">Track and view your latest purchases</p>
          </div>
          <Link
            to="/customer/orders"
            className="text-xs font-bold text-[#C62828] hover:text-[#8E1B1B] hover:underline"
          >
            View All ({stats.totalOrders})
          </Link>
        </div>

        {loadingStats ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading recent orders...</div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">You haven't placed any orders yet.</p>
            <Link
              to="/customer/shop"
              className="mt-3 inline-block px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition"
            >
              Start Shopping Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.map((order) => (
              <div key={order._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      Order #{order.orderNumber || order._id?.substring(0, 8)}
                    </span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} item(s)
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-sm font-black text-[#C62828]">
                    ₹{order.totalAmount}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/customer/orders/${order._id}/tracking`}
                      className="px-3 py-1.5 text-xs font-bold text-[#C62828] bg-[#FDECEC] hover:bg-[#ffd9d9] rounded-lg transition"
                    >
                      Track
                    </Link>
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Catalogue & Shop */}
        <Link
          to="/customer/shop"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex flex-col"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#C62828] transition-colors">
            Fresh Catalogue
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Explore authentic Gujarati namkeens, sev, and snacks.
          </p>
        </Link>

        {/* My Invoices */}
        <Link
          to="/customer/invoices"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex flex-col"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#C62828] transition-colors">
            Tax Invoices
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Download print-ready official PDF invoices.
          </p>
        </Link>

        {/* Saved Addresses */}
        <Link
          to="/customer/addresses"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex flex-col"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#C62828] transition-colors">
            Delivery Addresses
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Manage your home and work delivery locations.
          </p>
        </Link>

        {/* Wishlist */}
        <Link
          to="/customer/wishlist"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex flex-col"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#C62828] transition-colors">
            Saved Wishlist
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Quick-buy and review your favorite namkeens.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default CustomerHome;
