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

/**
 * Get all admin offers with optional status, page, and limit query parameters
 * GET /api/admin/offers?status=&page=&limit=
 * @param {Object} params - { status: 'all' | 'active' | 'upcoming' | 'expired' | 'inactive', page: number, limit: number }
 * @returns {Promise<{ offers: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getAdminOffers = async (params = {}) => {
  const url = buildUrlWithParams('/admin/offers', params);
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Create a new offer (Product Discount / Cart Threshold / Loyalty Customer)
 * POST /api/admin/offers
 * @param {Object} data
 * @returns {Promise<{ message: string, offer: Object }>}
 */
export const createOffer = async (data) => {
  const response = await axiosClient.post('/admin/offers', data);
  return response.data;
};

/**
 * Update an existing offer by ID
 * PUT /api/admin/offers/:id
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<{ message: string, offer: Object }>}
 */
export const updateOffer = async (id, data) => {
  const response = await axiosClient.put(`/admin/offers/${id}`, data);
  return response.data;
};

/**
 * Delete an offer by ID
 * DELETE /api/admin/offers/:id
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export const deleteOffer = async (id) => {
  const response = await axiosClient.delete(`/admin/offers/${id}`);
  return response.data;
};

/**
 * Toggle an offer's isActive status
 * PUT /api/admin/offers/:id/active
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<{ message: string, offer: Object }>}
 */
export const toggleOfferActive = async (id, isActive) => {
  const response = await axiosClient.put(`/admin/offers/${id}/active`, { isActive });
  return response.data;
};
