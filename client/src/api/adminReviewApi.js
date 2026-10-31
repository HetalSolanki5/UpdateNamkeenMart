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
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Fetch paginated reviews for admin.
 * GET /api/admin/reviews?isApproved=&page=&limit=
 * @param {Object} params - { isApproved, page, limit }
 * @returns {Promise<{ reviews: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getAdminReviews = async (params = {}) => {
  const url = buildUrlWithParams('/admin/reviews', params);
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Approve a review.
 * PUT /api/admin/reviews/:id/approve
 * @param {string} id - Review ID
 * @returns {Promise<{ review: Object }>}
 */
export const approveReview = async (id) => {
  const response = await axiosClient.put(`/admin/reviews/${id}/approve`);
  return response.data;
};

/**
 * Hide an approved review.
 * PUT /api/admin/reviews/:id/hide
 * @param {string} id - Review ID
 * @returns {Promise<{ review: Object }>}
 */
export const hideReview = async (id) => {
  const response = await axiosClient.put(`/admin/reviews/${id}/hide`);
  return response.data;
};

/**
 * Delete a review.
 * DELETE /api/admin/reviews/:id
 * @param {string} id - Review ID
 * @returns {Promise<{ message: string }>}
 */
export const deleteReview = async (id) => {
  const response = await axiosClient.delete(`/admin/reviews/${id}`);
  return response.data;
};
