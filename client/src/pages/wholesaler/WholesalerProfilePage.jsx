import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

/**
 * WholesalerProfilePage
 * Read-only display of the wholesaler's account info from AuthContext.
 * No edit endpoint is in scope for Phase 6B — editing is intentionally excluded.
 */
const WholesalerProfilePage = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const ProfileRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0 gap-1">
        <span className="sm:w-40 text-[11px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
          {label}
        </span>
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Profile & Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Your wholesaler account information. Contact admin to make changes.
        </p>
      </div>

      {/* Account info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#C62828] text-xl font-black shrink-0">
            {(user?.name || 'W')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="mt-1">
              <StatusBadge status={user?.wholesalerStatus} />
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div>
          <ProfileRow label="Full Name" value={user?.name} />
          <ProfileRow label="Email" value={user?.email} />
          <ProfileRow label="Phone" value={user?.phone} />
          <ProfileRow label="Business Name" value={user?.businessName} />
          <ProfileRow label="GST Number" value={user?.gstNumber} />
          <ProfileRow label="Account Status" value={user?.wholesalerStatus?.toUpperCase()} />
          <ProfileRow label="Role" value={user?.role?.toUpperCase()} />
        </div>
      </div>

      {/* Addresses (if any stored on the user object) */}
      {user?.addresses && user.addresses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 mb-4">Saved Addresses</h2>
          <div className="space-y-3">
            {user.addresses.map((addr, idx) => (
              <div
                key={addr._id || idx}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-xs text-gray-700 space-y-0.5"
              >
                <p className="font-bold text-gray-900 text-sm">
                  {addr.receiverName}
                  {addr.isDefault && (
                    <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </p>
                <p>Phone: {addr.phoneNumber}</p>
                <p>{addr.houseBuilding}, {addr.subAddressArea}</p>
                {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note about editing */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        <strong>Note:</strong> Profile editing is not available in this phase. To update your
        business name, GST number, or other details, please contact the administrator.
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Account Actions</h2>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-sm rounded-lg transition"
        >
          Logout from Wholesale Portal
        </button>
      </div>
    </div>
  );
};

export default WholesalerProfilePage;
