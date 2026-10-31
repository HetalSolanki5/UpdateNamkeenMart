import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useWholesaleCart } from '../context/WholesaleCartContext.jsx';

/**
 * WholesalerLayout
 *
 * Approval-status gating:
 * - Before rendering the full layout + <Outlet />, we check user.wholesalerStatus.
 * - If NOT "approved", we show a full-screen status page instead of the portal.
 *   This avoids calling the API at all for unapproved users, giving instant feedback.
 *   All API calls still defensively handle the 403 response that the backend returns
 *   for unapproved accounts (the backend's requireApprovedWholesaler middleware).
 *
 * Layout:
 * - Desktop: fixed left sidebar (w-64) + main content area.
 * - Mobile: collapsed sidebar, opened via a hamburger button as a slide-over drawer.
 */
const WholesalerLayout = () => {
  const { user, logoutUser } = useAuth();
  const { cartCount } = useWholesaleCart();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // --- Approval-status gate ---
  // Show a blocking screen for wholesalers who are not yet approved.
  // This prevents accessing the portal UI and avoids wasted API calls.
  if (user && user.wholesalerStatus !== 'approved') {
    const isPending = user.wholesalerStatus === 'pending';
    const isRejected = user.wholesalerStatus === 'rejected';

    return (
      <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <p className="text-2xl font-black text-[#C62828] tracking-wider mb-8">
            RAMESHWAR NAMKEEN
          </p>

          {/* Status message box */}
          <div
            className={`rounded-2xl p-6 border mb-6 ${
              isPending
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="text-3xl mb-3">{isPending ? '⏳' : '❌'}</div>
            <h2 className="text-lg font-black mb-2">
              {isPending
                ? 'Account Awaiting Approval'
                : isRejected
                ? 'Application Not Approved'
                : 'Account Inactive'}
            </h2>
            <p className="text-sm leading-relaxed">
              {isPending
                ? 'Your wholesaler account is waiting for admin approval. You will be able to place wholesale orders once approved.'
                : isRejected
                ? 'Your wholesaler account application was not approved. Please contact admin for details.'
                : 'Your wholesaler account is inactive. Please contact admin.'}
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Logged in as <span className="font-semibold">{user.email}</span>
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white font-semibold rounded-lg transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // --- Sidebar nav link classes ---
  const sidebarLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#C62828] text-white'
        : 'text-gray-700 hover:bg-[#FDECEC] hover:text-[#C62828]'
    }`;

  // --- Sidebar nav links definition ---
  const navLinks = [
    {
      to: '/wholesaler',
      end: true,
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      to: '/wholesaler/products',
      label: 'Wholesale Products',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      to: '/wholesaler/cart',
      label: 'Wholesale Cart',
      badge: cartCount > 0 ? cartCount : null,
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      to: '/wholesaler/orders',
      label: 'My Orders',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      to: '/wholesaler/invoices',
      label: 'Invoices',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: '/wholesaler/payments',
      label: 'Payments',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      to: '/wholesaler/reports',
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      to: '/wholesaler/profile',
      label: 'Profile / Settings',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  // Reusable sidebar nav list
  const SidebarNav = () => (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={sidebarLinkClass}
          onClick={() => setSidebarOpen(false)} // close mobile drawer on nav
        >
          {link.icon}
          <span className="flex-1">{link.label}</span>
          {/* Cart count badge */}
          {link.badge !== null && link.badge !== undefined && (
            <span className="ml-auto bg-white text-[#C62828] text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {link.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex">
      {/* ===== DESKTOP FIXED SIDEBAR ===== */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-30 shadow-sm">
        {/* Sidebar header: logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link to="/wholesaler" className="block">
            <span className="text-base font-black text-[#C62828] tracking-wider leading-tight block">
              RAMESHWAR
            </span>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
              Wholesale Portal
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <SidebarNav />

        {/* Sidebar footer: user info + logout */}
        <div className="border-t border-gray-100 px-4 py-4">
          <p className="text-xs font-bold text-gray-800 truncate">{user?.name}</p>
          <p className="text-[10px] text-gray-400 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] py-1.5 rounded-lg border border-[#C62828]/30 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MOBILE SLIDE-OVER DRAWER ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-[#C62828] tracking-wider block">RAMESHWAR</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Wholesale Portal
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <SidebarNav />

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-4">
              <p className="text-xs font-bold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate mb-2">{user?.email}</p>
              <button
                onClick={handleLogout}
                className="w-full text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] py-1.5 rounded-lg border border-[#C62828]/30 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-xs px-4 lg:px-6 h-14 flex items-center justify-between">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Open sidebar menu"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand name — center on mobile, left on desktop */}
          <span className="lg:hidden text-sm font-black text-[#C62828] tracking-wider">
            RAMESHWAR NAMKEEN
          </span>

          {/* Wholesaler name (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-gray-400">Wholesale Portal</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-800">
              {user?.businessName || user?.name || 'Wholesaler'}
            </span>
          </div>

          {/* Logout button + cart badge (top bar) */}
          <div className="flex items-center gap-3">
            {/* Cart link with badge — visible on all sizes */}
            <Link
              to="/wholesaler/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              title="Wholesale Cart"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C62828] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="hidden lg:block text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] px-3 py-1.5 rounded-lg border border-[#C62828]/30 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WholesalerLayout;
