import axiosClient from './axiosClient.js';

/**
 * Fetch all active categories
 * @returns {Promise<{ categories: Array }>}
 */
export const getCategories = async () => {
  const response = await axiosClient.get('/categories');
  return response.data;
};

/**
 * Fetch products list with dynamic query parameters
 * Skips empty, null, or undefined parameters
 * @param {Object} params
 * @returns {Promise<{ products: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getProducts = async (params = {}) => {
  // Build URLSearchParams only from valid values
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
  const url = queryString ? `/products?${queryString}` : '/products';
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Fetch a single product by ID
 * @param {string} id
 * @returns {Promise<{ product: Object }>}
 */
export const getProductById = async (id) => {
  const response = await axiosClient.get(`/products/${id}`);
  return response.data;
};
