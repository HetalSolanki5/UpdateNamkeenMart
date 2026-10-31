import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const CustomerHome = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Account Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-[#FDECEC] text-[#C62828] flex items-center justify-center text-xl font-black">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {user?.name || 'Customer Account'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            <p className="text-xs text-gray-500">Phone: {user?.phone || 'Not provided'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 text-xs font-bold rounded-xl transition"
        >
          Logout Account
        </button>
      </div>

      {/* Account Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* My Orders */}
        <Link
          to="/customer/orders"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex items-start space-x-4"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-[#C62828] transition-colors">
              My Orders
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Track active deliveries, status history, and item breakdowns.
            </p>
          </div>
        </Link>

        {/* My Invoices */}
        <Link
          to="/customer/invoices"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex items-start space-x-4"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-[#C62828] transition-colors">
              My Invoices
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              View official tax invoices and download print-ready PDFs.
            </p>
          </div>
        </Link>

        {/* Saved Addresses */}
        <Link
          to="/customer/addresses"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex items-start space-x-4"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-[#C62828] transition-colors">
              Saved Addresses
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your home, office, and family delivery destinations.
            </p>
          </div>
        </Link>

        {/* Wishlist */}
        <Link
          to="/customer/wishlist"
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#C62828] hover:shadow-md transition group flex items-start space-x-4"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-[#C62828] transition-colors">
              Saved Wishlist
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and quick-buy your favorite saved snack packs.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CustomerHome;
