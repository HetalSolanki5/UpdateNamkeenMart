import axiosClient from './axiosClient.js';

/**
 * Helper to build clean query string skipping null, undefined, or empty string values.
 * Follows the exact pattern from catalogApi.js.
 * @param {string} baseUrl
 * @param {Object} params
 * @returns {string}
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Controlled Admin Creation (POST /api/admin/users/admins)
 * @param {Object} data - { name, email, phone, password, confirmPassword }
 * @returns {Promise<{ message: string, user: Object }>}
 */
export const createAdminAccount = async (data) => {
  const response = await axiosClient.post('/admin/users/admins', data);
  return response.data;
};

/**
 * Get paginated users with optional role, search, wholesalerStatus filters
 * GET /api/admin/users?role=&search=&wholesalerStatus=&page=&limit=
 * @param {Object} params
 * @returns {Promise<{ users: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getUsers = async (params = {}) => {
  const url = buildUrlWithParams('/admin/users', params);
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Get single user details by ID (GET /api/admin/users/:id)
 * @param {string} id
 * @returns {Promise<{ user: Object }>}
 */
export const getUserById = async (id) => {
  const response = await axiosClient.get(`/admin/users/${id}`);
  return response.data;
};

/**
 * Toggle user active/inactive status (PUT /api/admin/users/:id/active)
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<{ message: string, user: Object }>}
 */
export const toggleUserActive = async (id, isActive) => {
  const response = await axiosClient.put(`/admin/users/${id}/active`, { isActive });
  return response.data;
};

/**
 * Update wholesaler approval status (PUT /api/admin/users/:id/wholesaler-status)
 * @param {string} id
 * @param {string} status - 'pending' | 'approved' | 'rejected' | 'inactive'
 * @returns {Promise<{ message: string, user: Object }>}
 */
export const updateWholesalerStatus = async (id, status) => {
  const response = await axiosClient.put(`/admin/users/${id}/wholesaler-status`, {
    wholesalerStatus: status
  });
  return response.data;
};

/**
 * Get admin dashboard summary (GET /api/admin/dashboard)
 * @returns {Promise<{
 *   totalCustomers: number,
 *   totalWholesalers: number,
 *   totalProducts: number,
 *   totalOrders: number,
 *   pendingOrders: number,
 *   lowStockProductsCount: number,
 *   currentMonthRevenue: number,
 *   recentCustomerOrders: Array,
 *   recentWholesaleOrders: Array,
 *   lowStockProducts: Array,
 *   recentPayments: Array
 * }>}
 */
export const getDashboardSummary = async () => {
  const response = await axiosClient.get('/admin/dashboard');
  return response.data;
};

/**
 * Get audit logs with optional module filter and pagination (GET /api/admin/audit-logs)
 * @param {Object} params - { module, page, limit }
 * @returns {Promise<{ auditLogs: Array, logs: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getAuditLogs = async (params = {}) => {
  const url = buildUrlWithParams('/admin/audit-logs', params);
  const response = await axiosClient.get(url);
  return response.data;
};
