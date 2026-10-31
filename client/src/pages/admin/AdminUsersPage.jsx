import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  getUsers,
  toggleUserActive,
  updateWholesalerStatus,
  createAdminAccount
} from '../../api/adminApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import FormInput from '../../components/FormInput.jsx';

/**
 * AdminUsersPage
 *
 * Requirements:
 * - Tabs: Customers / Wholesalers / Admins (controls `role` query param).
 * - Search input (debounced ~400ms).
 * - Wholesaler filter dropdown (All / Pending / Approved / Rejected / Inactive) on Wholesalers tab.
 * - Responsive table (stacked cards on mobile): Name, Email, Phone, (Business Name + GST if wholesaler),
 *   Status (Active/Inactive badge), (Wholesaler Approval badge if wholesaler), Joined Date, Actions.
 * - Actions:
 *   - "Activate"/"Deactivate" button with confirm step.
 *     If target user is currently logged-in admin, disable action with tooltip "You cannot deactivate your own account."
 *   - Wholesaler approval actions ("Approve", "Reject", "Set Inactive", "Re-approve").
 * - Pagination controls.
 * - "Create Admin Account" modal/section on Admins tab with client-side password validation
 *   (min 8 chars, upper, lower, number, special char) matching backend.
 * - Loading, empty ("No users found."), and error states.
 */
const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();

  // Tab state: 'customer' | 'wholesaler' | 'admin'
  const [activeTab, setActiveTab] = useState('customer');

  // Query filters
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [wholesalerStatus, setWholesalerStatus] = useState('');
  const [page, setPage] = useState(1);

  // List data state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // "Create Admin Account" modal state (available on 'admin' tab)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [adminFormErrors, setAdminFormErrors] = useState({});
  const [createAdminSubmitting, setCreateAdminSubmitting] = useState(false);
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');
  const [createAdminGeneralError, setCreateAdminGeneralError] = useState('');

  // 400ms search input debouncing
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch users when tab, search, wholesaler filter, or page changes
  const fetchUsersList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        role: activeTab,
        search: searchTerm,
        page,
        limit: 10
      };

      if (activeTab === 'wholesaler' && wholesalerStatus) {
        params.wholesalerStatus = wholesalerStatus;
      }

      const res = await getUsers(params);
      setUsers(res?.users || []);
      setPagination({
        totalPages: res?.totalPages || 1,
        totalResults: res?.total || res?.totalResults || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [activeTab, searchTerm, wholesalerStatus, page]);

  // Tab switch handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setWholesalerStatus('');
  };

  // Toggle user active / inactive status
  const handleToggleActive = async (targetUser) => {
    // Self-deactivation guard: Admin cannot deactivate their own logged-in account
    if (targetUser._id === currentAdmin?._id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }

    const actionText = targetUser.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} user "${targetUser.name}" (${targetUser.email})?`
    );
    if (!confirmed) return;

    setActionLoadingId(targetUser._id);
    try {
      await toggleUserActive(targetUser._id, !targetUser.isActive);
      // Refresh list to update status
      await fetchUsersList();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionText} user.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Wholesaler approval status update handler
  const handleUpdateWholesalerApproval = async (targetUser, newStatus) => {
    const actionLabel =
      newStatus === 'approved'
        ? 'approve'
        : newStatus === 'rejected'
        ? 'reject'
        : newStatus === 'inactive'
        ? 'mark as inactive'
        : newStatus;

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} wholesaler "${targetUser.businessName || targetUser.name}"?`
    );
    if (!confirmed) return;

    setActionLoadingId(targetUser._id);
    try {
      await updateWholesalerStatus(targetUser._id, newStatus);
      await fetchUsersList();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update wholesaler status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Validation rules for admin creation matching backend validator
  const validateAdminForm = () => {
    const errors = {};
    if (!adminFormData.name.trim() || adminFormData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminFormData.email.trim() || !emailRegex.test(adminFormData.email.trim())) {
      errors.email = 'Valid email is required.';
    }

    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!adminFormData.phone.trim() || !phoneRegex.test(adminFormData.phone.trim())) {
      errors.phone = 'Valid 10-digit Indian mobile number required.';
    }

    // Min 8 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!adminFormData.password || !passwordRegex.test(adminFormData.password)) {
      errors.password =
        'Password must be 8+ chars and contain uppercase, lowercase, number, and special character.';
    }

    if (adminFormData.confirmPassword !== adminFormData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminFormSubmit = async (e) => {
    e.preventDefault();
    setCreateAdminGeneralError('');
    setCreateAdminSuccess('');

    if (!validateAdminForm()) return;

    setCreateAdminSubmitting(true);
    try {
      await createAdminAccount(adminFormData);
      setCreateAdminSuccess('Admin account created successfully!');
      setAdminFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setAdminFormErrors({});
      // Refresh admins list
      await fetchUsersList();
      setTimeout(() => {
        setShowCreateAdminModal(false);
        setCreateAdminSuccess('');
      }, 1500);
    } catch (err) {
      setCreateAdminGeneralError(err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setCreateAdminSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage customer accounts, wholesaler B2B approval workflows, and administrator access.
          </p>
        </div>

        {/* Create Admin button visible only on Admins tab */}
        {activeTab === 'admin' && (
          <button
            onClick={() => {
              setAdminFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
              });
              setAdminFormErrors({});
              setCreateAdminGeneralError('');
              setCreateAdminSuccess('');
              setShowCreateAdminModal(true);
            }}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Admin Account
          </button>
        )}
      </div>

      {/* Role Tabs */}
      <div className="flex items-center border-b border-gray-200 gap-2">
        <button
          onClick={() => handleTabChange('customer')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'customer'
              ? 'border-[#C62828] text-[#C62828]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => handleTabChange('wholesaler')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'wholesaler'
              ? 'border-[#C62828] text-[#C62828]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Wholesalers
        </button>
        <button
          onClick={() => handleTabChange('admin')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'admin'
              ? 'border-[#C62828] text-[#C62828]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Admins
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
        {/* Search input with 400ms debounce */}
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
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
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={`Search ${activeTab}s by name or email...`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C62828] focus:border-[#C62828]"
          />
        </div>

        {/* Wholesaler status filter dropdown (only on Wholesalers tab) */}
        {activeTab === 'wholesaler' && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <select
              value={wholesalerStatus}
              onChange={(e) => {
                setWholesalerStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C62828]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message={`Loading ${activeTab} accounts...`} />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-800">No users found</h3>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm || wholesalerStatus
              ? 'Try adjusting your search query or filter parameters.'
              : `There are currently no ${activeTab}s registered in the system.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    {activeTab === 'wholesaler' && (
                      <th className="py-3 px-4">Business & GST</th>
                    )}
                    <th className="py-3 px-4">Account Status</th>
                    {activeTab === 'wholesaler' && (
                      <th className="py-3 px-4">Approval</th>
                    )}
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    // Check if target is current logged-in admin (self-deactivation protection)
                    const isSelf = u._id === currentAdmin?._id;
                    const isRowBusy = actionLoadingId === u._id;

                    return (
                      <tr key={u._id} className="hover:bg-gray-50/60 transition">
                        {/* Name + Self badge */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{u.name}</span>
                          {isSelf && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              You (Current Session)
                            </span>
                          )}
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3 px-4 text-gray-700">
                          <span className="block font-medium">{u.email}</span>
                          <span className="text-[11px] text-gray-400 block">{u.phone}</span>
                        </td>

                        {/* Business Name & GST for wholesalers */}
                        {activeTab === 'wholesaler' && (
                          <td className="py-3 px-4 text-gray-700">
                            <span className="font-semibold block">{u.businessName || '—'}</span>
                            <span className="text-[11px] text-gray-400 block font-mono">
                              {u.gstNumber ? `GST: ${u.gstNumber}` : 'No GST provided'}
                            </span>
                          </td>
                        )}

                        {/* Active / Inactive status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                        </td>

                        {/* Wholesaler Approval status */}
                        {activeTab === 'wholesaler' && (
                          <td className="py-3 px-4">
                            <StatusBadge status={u.wholesalerStatus || 'pending'} />
                          </td>
                        )}

                        {/* Joined Date */}
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>

                        {/* Actions column */}
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {/* Wholesaler approval action buttons */}
                          {activeTab === 'wholesaler' && (
                            <span className="inline-flex items-center gap-1.5 mr-2">
                              {/* Pending state: show Approve and Reject */}
                              {u.wholesalerStatus === 'pending' && (
                                <>
                                  <button
                                    disabled={isRowBusy}
                                    onClick={() => handleUpdateWholesalerApproval(u, 'approved')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    disabled={isRowBusy}
                                    onClick={() => handleUpdateWholesalerApproval(u, 'rejected')}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Approved state: show Set Inactive */}
                              {u.wholesalerStatus === 'approved' && (
                                <button
                                  disabled={isRowBusy}
                                  onClick={() => handleUpdateWholesalerApproval(u, 'inactive')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                                >
                                  Set Inactive
                                </button>
                              )}

                              {/* Rejected or Inactive state: show Re-approve */}
                              {(u.wholesalerStatus === 'rejected' || u.wholesalerStatus === 'inactive') && (
                                <button
                                  disabled={isRowBusy}
                                  onClick={() => handleUpdateWholesalerApproval(u, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                                >
                                  Re-approve
                                </button>
                              )}
                            </span>
                          )}

                          {/* Activate / Deactivate button */}
                          {isSelf ? (
                            <button
                              disabled
                              title="You cannot deactivate your own account."
                              className="px-2.5 py-1 rounded text-[11px] font-bold border border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              disabled={isRowBusy}
                              onClick={() => handleToggleActive(u)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                                u.isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              } disabled:opacity-50`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => {
              const isSelf = u._id === currentAdmin?._id;
              const isRowBusy = actionLoadingId === u._id;

              return (
                <div key={u._id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{u.name}</span>
                      <span className="text-xs text-gray-500 block">{u.email}</span>
                      <span className="text-[11px] text-gray-400 block">{u.phone}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                      {activeTab === 'wholesaler' && (
                        <StatusBadge status={u.wholesalerStatus || 'pending'} />
                      )}
                    </div>
                  </div>

                  {activeTab === 'wholesaler' && (
                    <div className="text-xs p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-800 block">
                        {u.businessName || 'Business: —'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        {u.gstNumber ? `GST: ${u.gstNumber}` : 'No GST provided'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                    <span>
                      Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                    {isSelf && (
                      <span className="text-blue-600 font-bold">Your Account</span>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeTab === 'wholesaler' && (
                      <>
                        {u.wholesalerStatus === 'pending' && (
                          <>
                            <button
                              disabled={isRowBusy}
                              onClick={() => handleUpdateWholesalerApproval(u, 'approved')}
                              className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold text-center"
                            >
                              Approve
                            </button>
                            <button
                              disabled={isRowBusy}
                              onClick={() => handleUpdateWholesalerApproval(u, 'rejected')}
                              className="flex-1 py-1.5 bg-red-600 text-white rounded text-xs font-bold text-center"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {u.wholesalerStatus === 'approved' && (
                          <button
                            disabled={isRowBusy}
                            onClick={() => handleUpdateWholesalerApproval(u, 'inactive')}
                            className="flex-1 py-1.5 bg-amber-500 text-white rounded text-xs font-bold text-center"
                          >
                            Set Inactive
                          </button>
                        )}
                        {(u.wholesalerStatus === 'rejected' || u.wholesalerStatus === 'inactive') && (
                          <button
                            disabled={isRowBusy}
                            onClick={() => handleUpdateWholesalerApproval(u, 'approved')}
                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold text-center"
                          >
                            Re-approve
                          </button>
                        )}
                      </>
                    )}

                    {isSelf ? (
                      <button
                        disabled
                        title="You cannot deactivate your own account."
                        className="flex-1 py-1.5 rounded text-xs font-bold border border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed text-center"
                      >
                        Cannot Deactivate Self
                      </button>
                    ) : (
                      <button
                        disabled={isRowBusy}
                        onClick={() => handleToggleActive(u)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border text-center transition ${
                          u.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Showing page <span className="font-bold text-gray-800">{page}</span> of{' '}
                <span className="font-bold text-gray-800">{pagination.totalPages}</span> (
                {pagination.totalResults} users)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Create Admin Modal ===== */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !createAdminSubmitting && setShowCreateAdminModal(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-900">Create New Administrator</h2>
              <button
                disabled={createAdminSubmitting}
                onClick={() => setShowCreateAdminModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createAdminSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                {createAdminSuccess}
              </div>
            )}

            {createAdminGeneralError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                {createAdminGeneralError}
              </div>
            )}

            <form onSubmit={handleAdminFormSubmit} className="space-y-3">
              <FormInput
                label="Full Name *"
                type="text"
                placeholder="Admin Name"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                error={adminFormErrors.name}
              />

              <FormInput
                label="Email Address *"
                type="email"
                placeholder="admin@rameshwar.com"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                error={adminFormErrors.email}
              />

              <FormInput
                label="Phone Number (10 digits) *"
                type="tel"
                placeholder="9876543210"
                value={adminFormData.phone}
                onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                error={adminFormErrors.phone}
              />

              <FormInput
                label="Password *"
                type="password"
                placeholder="••••••••"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                error={adminFormErrors.password}
              />
              <p className="text-[10px] text-gray-400 -mt-2 mb-2">
                Min 8 characters, with uppercase, lowercase, number, and special character.
              </p>

              <FormInput
                label="Confirm Password *"
                type="password"
                placeholder="••••••••"
                value={adminFormData.confirmPassword}
                onChange={(e) => setAdminFormData({ ...adminFormData, confirmPassword: e.target.value })}
                error={adminFormErrors.confirmPassword}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={createAdminSubmitting}
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminSubmitting}
                  className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 shadow-xs"
                >
                  {createAdminSubmitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
