import axiosClient from './axiosClient.js';

/**
 * Helper to build clean query string skipping null, undefined, or empty string values.
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

// ==========================================
// Customer Orders (Admin endpoints)
// ==========================================

/**
 * Fetch paginated customer orders for admin.
 * GET /api/admin/orders?orderStatus=&paymentStatus=&search=&from=&to=&page=&limit=
 * @param {Object} params - { orderStatus, paymentStatus, search, from, to, page, limit }
 * @returns {Promise<{ orders: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getAdminOrders = async (params = {}) => {
  const url = buildUrlWithParams('/admin/orders', params);
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Fetch single customer order details by ID for admin.
 * GET /api/admin/orders/:id
 * @param {string} id - Order ID
 * @returns {Promise<{ order: Object, orderItems: Array, payment: Object, invoice: Object }>}
 */
export const getAdminOrderById = async (id) => {
  const response = await axiosClient.get(`/admin/orders/${id}`);
  return response.data;
};

/**
 * Update customer order status.
 * PUT /api/orders/:id/status body: { status }
 * (Reuses the existing Phase 5A route)
 * @param {string} id - Order ID
 * @param {string} status - New order status string
 * @returns {Promise<{ message: string, order: Object }>}
 */
export const updateOrderStatus = async (id, status) => {
  const response = await axiosClient.put(`/orders/${id}/status`, { status });
  return response.data;
};

// ==========================================
// Wholesale Orders (Admin endpoints)
// ==========================================

/**
 * Fetch paginated wholesale orders for admin.
 * GET /api/admin/wholesale-orders?orderStatus=&paymentStatus=&search=&from=&to=&page=&limit=
 * @param {Object} params - { orderStatus, paymentStatus, search, from, to, page, limit }
 * @returns {Promise<{ orders: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getAdminWholesaleOrders = async (params = {}) => {
  const url = buildUrlWithParams('/admin/wholesale-orders', params);
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Fetch single wholesale order details by ID for admin.
 * GET /api/admin/wholesale-orders/:id
 * @param {string} id - Wholesale Order ID
 * @returns {Promise<{ order: Object, orderItems: Array, payment: Object, invoice: Object }>}
 */
export const getAdminWholesaleOrderById = async (id) => {
  const response = await axiosClient.get(`/admin/wholesale-orders/${id}`);
  return response.data;
};

/**
 * Update wholesale order status.
 * Attempts /api/admin/wholesale-orders/:id/status and falls back to /api/wholesale/orders/:id/status if 404.
 * @param {string} id - Wholesale Order ID
 * @param {string} status - New wholesale order status string
 * @returns {Promise<{ message: string, order: Object }>}
 */
export const updateWholesaleOrderStatus = async (id, status) => {
  try {
    const response = await axiosClient.put(`/admin/wholesale-orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const fallbackResponse = await axiosClient.put(`/wholesale/orders/${id}/status`, { status });
      return fallbackResponse.data;
    }
    throw error;
  }
};
