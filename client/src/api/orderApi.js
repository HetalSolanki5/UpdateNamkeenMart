import axiosClient from './axiosClient.js';

/**
 * Place a new order from cart (Legacy / Phase 5B / direct COD reference)
 * @param {string} addressId Selected delivery address ID
 * @param {string} paymentMethod "upi" | "card" | "netbanking" | "cod"
 * @returns {Promise<Object>} Created order, orderItems, payment, invoice
 */
export const placeOrder = async (addressId, paymentMethod) => {
  const response = await axiosClient.post('/orders', {
    addressId,
    paymentMethod
  });
  return response.data;
};

/**
 * Phase 5D-A/B: Step 1 - Initiate checkout
 * For COD: directly creates the order and returns { order, orderItems, payment, invoice }.
 * For UPI/Card/NetBanking: creates a Razorpay order and returns { razorpayOrderId, amount, currency, keyId, addressId }.
 * @param {string} addressId
 * @param {string} paymentMethod "upi" | "card" | "netbanking" | "cod"
 * @returns {Promise<Object>}
 */
export const initiateCheckout = async (addressId, paymentMethod) => {
  const response = await axiosClient.post('/orders/initiate', {
    addressId,
    paymentMethod
  });
  return response.data;
};

/**
 * Phase 5D-A/B: Step 2 - Verify Razorpay payment signature & create the order
 * @param {string} addressId
 * @param {Object} razorpayData { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<Object>} Created order, orderItems, payment, invoice
 */
export const verifyPayment = async (addressId, razorpayData) => {
  const response = await axiosClient.post('/orders/verify', {
    addressId,
    razorpay_order_id: razorpayData.razorpay_order_id,
    razorpay_payment_id: razorpayData.razorpay_payment_id,
    razorpay_signature: razorpayData.razorpay_signature
  });
  return response.data;
};

/**
 * Get paginated orders list for logged-in customer
 * @param {number} page Current page number
 * @param {number} limit Items per page
 * @returns {Promise<{ orders: Array, page: number, totalPages: number, totalResults: number }>}
 */
export const getMyOrders = async (page = 1, limit = 10) => {
  const response = await axiosClient.get('/orders', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Get full order details by ID
 * @param {string} id Order ID
 * @returns {Promise<{ order: Object, orderItems: Array, payment: Object, invoice: Object }>}
 */
export const getOrderById = async (id) => {
  const response = await axiosClient.get(`/orders/${id}`);
  return response.data;
};

/**
 * Get visual tracking steps for an order
 * @param {string} id Order ID
 * @returns {Promise<{ orderId: string, orderNumber: string, currentStatus: string, isCancelled: boolean, timeline: Array }>}
 */
export const getOrderTracking = async (id) => {
  const response = await axiosClient.get(`/orders/${id}/tracking`);
  return response.data;
};
