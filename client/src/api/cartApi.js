import axiosClient from './axiosClient.js';

/**
 * Fetch customer's cart
 * @returns {Promise<{ items: Array, subtotal: number, deliveryCharge: number, total: number }>}
 */
export const getCart = async () => {
  const response = await axiosClient.get('/cart');
  return response.data;
};

/**
 * Add an item with variantId and quantity to cart
 * @param {string} variantId
 * @param {number} quantity
 * @returns {Promise<Object>}
 */
export const addToCart = async (variantId, quantity = 1) => {
  const response = await axiosClient.post('/cart', { variantId, quantity });
  return response.data;
};

/**
 * Update quantity for a cart item
 * @param {string} itemId
 * @param {number} quantity
 * @returns {Promise<Object>}
 */
export const updateCartItem = async (itemId, quantity) => {
  const response = await axiosClient.put(`/cart/${itemId}`, { quantity });
  return response.data;
};

/**
 * Remove an item from cart
 * @param {string} itemId
 * @returns {Promise<Object>}
 */
export const removeCartItem = async (itemId) => {
  const response = await axiosClient.delete(`/cart/${itemId}`);
  return response.data;
};

/**
 * Clear all items from cart
 * @returns {Promise<Object>}
 */
export const clearCart = async () => {
  const response = await axiosClient.delete('/cart');
  return response.data;
};
