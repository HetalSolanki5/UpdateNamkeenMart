import axiosClient from './axiosClient.js';

/**
 * Fetch all delivery addresses for the logged-in customer
 * @returns {Promise<{ addresses: Array }>}
 */
export const getAddresses = async () => {
  const response = await axiosClient.get('/users/addresses');
  return response.data;
};

/**
 * Add a new delivery address
 * @param {Object} data Address fields
 * @returns {Promise<{ message: string, addresses: Array }>}
 */
export const addAddress = async (data) => {
  const response = await axiosClient.post('/users/addresses', data);
  return response.data;
};

/**
 * Update an existing delivery address
 * @param {string} id Address subdocument ID
 * @param {Object} data Updated address fields
 * @returns {Promise<{ message: string, addresses: Array }>}
 */
export const updateAddress = async (id, data) => {
  const response = await axiosClient.put(`/users/addresses/${id}`, data);
  return response.data;
};

/**
 * Delete a delivery address
 * @param {string} id Address subdocument ID
 * @returns {Promise<{ message: string, addresses: Array }>}
 */
export const deleteAddress = async (id) => {
  const response = await axiosClient.delete(`/users/addresses/${id}`);
  return response.data;
};

/**
 * Set an address as the default delivery address
 * @param {string} id Address subdocument ID
 * @returns {Promise<{ message: string, addresses: Array }>}
 */
export const setDefaultAddress = async (id) => {
  const response = await axiosClient.put(`/users/addresses/${id}/default`);
  return response.data;
};
