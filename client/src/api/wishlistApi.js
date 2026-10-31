import axiosClient from './axiosClient.js';

/**
 * Fetch customer's wishlist items
 * @returns {Promise<{ wishlist: Array }>}
 */
export const getWishlist = async () => {
  const response = await axiosClient.get('/wishlist');
  // Normalize both { wishlist: [...] } and { items: [...] } if needed
  const items = response.data.wishlist || response.data.items || [];
  return { items, ...response.data };
};

/**
 * Add product to wishlist
 * @param {string} productId
 * @returns {Promise<Object>}
 */
export const addToWishlist = async (productId) => {
  const response = await axiosClient.post('/wishlist', { productId });
  return response.data;
};

/**
 * Remove product from wishlist
 * @param {string} productId
 * @returns {Promise<Object>}
 */
export const removeFromWishlist = async (productId) => {
  const response = await axiosClient.delete(`/wishlist/${productId}`);
  return response.data;
};
