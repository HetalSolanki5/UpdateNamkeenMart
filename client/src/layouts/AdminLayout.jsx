import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * AdminLayout
 *
 * Design Spec:
 * - Enterprise-style dark grey/near-black sidebar (#18181B / #121212) with white text
 *   and brand red (#C62828) active link background with white text.
 * - Desktop: fixed left sidebar (w-64).
 * - Mobile: collapsible drawer opened via hamburger button.
 * - Top header bar: "RAMESHWAR NAMKEEN — Admin" label, admin's name, Logout button.
 * - Content area on a light background (#FFF9F9) to keep readability crisp.
 */
const AdminLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Nav item styling
  const sidebarLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-[#C62828] text-white shadow-xs font-semibold'
        : 'text-gray-300 hover:bg-[#27272A] hover:text-white'
    }`;

  // Complete list of sidebar links as defined in Phase 7 spec
  const navLinks = [
    {
      to: '/admin',
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
      to: '/admin/users',
      label: 'Users',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      to: '/admin/categories',
      label: 'Categories',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      to: '/admin/products',
      label: 'Products',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      to: '/admin/products', // Product variants managed inline under Products
      label: 'Product Variants',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      to: '/admin/stock',
      label: 'Stock',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: '/admin/orders',
      label: 'Customer Orders',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      to: '/admin/wholesale-orders',
      label: 'Wholesale Orders',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      to: '/admin/payments',
      label: 'Payments',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      to: '/admin/orders', // Links to Orders where invoices are referenced per order
      label: 'Invoices',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: '/admin/reviews',
      label: 'Reviews',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      to: '/admin/reports',
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      to: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  // Reusable Sidebar Nav List
  const SidebarNav = () => (
    <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
      {navLinks.map((link) => (
        <NavLink
          key={link.label}
          to={link.to}
          end={link.end}
          className={sidebarLinkClass}
          onClick={() => setSidebarOpen(false)}
        >
          {link.icon}
          <span className="truncate">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex text-gray-900">
      {/* ===== DESKTOP FIXED SIDEBAR ===== */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#121214] border-r border-[#27272A] fixed top-0 left-0 h-full z-30 shadow-md">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
          <Link to="/admin" className="block">
            <span className="text-base font-black text-[#C62828] tracking-wider leading-tight block">
              RAMESHWAR
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Admin Portal
            </span>
          </Link>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#27272A] text-gray-300 border border-gray-700">
            v1.0
          </span>
        </div>

        {/* Navigation list */}
        <SidebarNav />

        {/* Sidebar Footer: logged-in admin & quick logout */}
        <div className="border-t border-[#27272A] px-4 py-3 bg-[#0D0D0E]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#27272A] border border-gray-700 text-white flex items-center justify-center text-xs font-black">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs font-semibold text-[#FF6B6B] hover:text-white hover:bg-[#C62828] py-1.5 rounded-lg border border-[#C62828]/40 transition text-center"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MOBILE DRAWER ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer container */}
          <div className="relative w-64 bg-[#121214] h-full shadow-2xl flex flex-col z-10 border-r border-[#27272A]">
            <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-[#C62828] tracking-wider block">
                  RAMESHWAR
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Admin Portal
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <SidebarNav />

            <div className="border-t border-[#27272A] px-4 py-3 bg-[#0D0D0E]">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate mb-2">{user?.email}</p>
              <button
                onClick={handleLogout}
                className="w-full text-xs font-semibold text-[#FF6B6B] hover:text-white hover:bg-[#C62828] py-1.5 rounded-lg border border-[#C62828]/40 transition text-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-xs px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Header Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-[#C62828] tracking-wider uppercase">
                RAMESHWAR NAMKEEN
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Admin
              </span>
            </div>
          </div>

          {/* Admin user info & Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-medium text-gray-600">
              Welcome, <span className="font-bold text-gray-900">{user?.name || 'Admin'}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-[#C62828] hover:bg-[#FDECEC] px-3 py-1.5 rounded-lg border border-[#C62828]/30 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 bg-[#FFF9F9]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
