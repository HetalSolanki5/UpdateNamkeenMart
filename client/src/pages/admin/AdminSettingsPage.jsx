import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * AdminSettingsPage
 * Simple placeholder showing the logged-in admin's profile info and logout.
 * Keeps strict adherence to not inventing backend settings that do not exist.
 */
const AdminSettingsPage = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">Admin Settings & Profile</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Your active administrator credentials and session details.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] text-[#C62828] border-2 border-[#C62828] flex items-center justify-center font-black text-xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Administrator'}</h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#FDECEC] text-[#C62828] border border-[#C62828]/20 uppercase">
              Role: {user?.role || 'admin'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Full Name</span>
            <span className="text-gray-800 font-semibold text-sm mt-0.5 block">{user?.name || '—'}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Email Address</span>
            <span className="text-gray-800 font-semibold text-sm mt-0.5 block">{user?.email || '—'}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Contact Phone</span>
            <span className="text-gray-800 font-semibold text-sm mt-0.5 block">{user?.phone || '—'}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-400 block font-medium">Account Status</span>
            <span className="text-emerald-700 font-semibold text-sm mt-0.5 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Administrator
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            To create new administrators, visit the <span className="text-gray-700 font-semibold">Users → Admins</span> tab.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
