import React from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const CustomerLayout = () => {
  const { user, logoutUser } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `font-medium transition-colors px-3 py-1.5 rounded-md ${
      isActive
        ? 'bg-[#8E1B1B] text-white'
        : 'text-white/90 hover:text-white hover:bg-[#8E1B1B]/50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
      isActive ? 'text-[#C62828]' : 'text-gray-600 hover:text-[#C62828]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F9]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#C62828] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/customer" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
              RAMESHWAR NAMKEEN
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/customer" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/customer/shop" className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/customer/wishlist" className={navLinkClass}>
              Wishlist
            </NavLink>
            <NavLink to="/customer/cart" className={navLinkClass}>
              <span className="relative inline-flex items-center">
                Cart
                {cartCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-white text-[#C62828] rounded-full">
                    {cartCount}
                  </span>
                )}
              </span>
            </NavLink>
          </nav>

          {/* User info & Logout */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-white/80 block">Welcome,</span>
              <span className="text-sm font-semibold text-white block">
                {user?.name || 'Customer'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-white text-[#C62828] hover:bg-gray-100 font-semibold px-3 py-1.5 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16 shadow-lg">
        <NavLink to="/customer" end className={mobileNavLinkClass}>
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </NavLink>
        <NavLink to="/customer/shop" className={mobileNavLinkClass}>
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Shop
        </NavLink>
        <NavLink to="/customer/wishlist" className={mobileNavLinkClass}>
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Wishlist
        </NavLink>
        <NavLink to="/customer/cart" className={mobileNavLinkClass}>
          <div className="relative inline-flex flex-col items-center">
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#C62828] text-white text-[10px] font-bold rounded-full">
                {cartCount}
              </span>
            )}
            Cart
          </div>
        </NavLink>
        <NavLink to="/customer" className={mobileNavLinkClass}>
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account
        </NavLink>
      </nav>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-600 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-[#C62828] text-base mb-1">RAMESHWAR NAMKEEN</p>
          <p className="text-gray-500 mb-2">Authentic Taste of Gujarat</p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Rameshwar Namkeen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
