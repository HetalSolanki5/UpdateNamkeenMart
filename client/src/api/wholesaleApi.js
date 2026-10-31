import axiosClient from './axiosClient.js';

/**
 * Fetch wholesale products with optional filters.
 * GET /api/wholesale/products?search=&category=&sort=&page=&limit=
 * @param {Object} params - { search, category, sort, page, limit }
 * @returns {Promise<{ products: Array, page, totalPages, totalResults }>}
 */
export const getWholesaleProducts = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/wholesale/products?${queryString}` : '/wholesale/products';
  const response = await axiosClient.get(url);
  return response.data;
};

/**
 * Place a new wholesale order.
 * POST /api/wholesale/orders
 * @param {Array} items - [{ variantId, quantity }]
 * @param {string} paymentMethod - "upi" | "card" | "netbanking" | "cod"
 * @returns {Promise<{ message, order, orderItems, payment, invoice }>}
 */
export const placeWholesaleOrder = async (items, paymentMethod) => {
  const response = await axiosClient.post('/wholesale/orders', { items, paymentMethod });
  return response.data;
};

/**
 * Fetch paginated wholesale orders for the logged-in wholesaler.
 * GET /api/wholesale/orders?page=&limit=
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ orders: Array, page, totalPages, totalResults }>}
 */
export const getMyWholesaleOrders = async (page = 1, limit = 10) => {
  const response = await axiosClient.get('/wholesale/orders', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Fetch a single wholesale order by ID.
 * GET /api/wholesale/orders/:id
 * @param {string} id - Order ID
 * @returns {Promise<{ order, orderItems, payment, invoice }>}
 */
export const getWholesaleOrderById = async (id) => {
  const response = await axiosClient.get(`/wholesale/orders/${id}`);
  return response.data;
};

/**
 * Fetch tracking timeline for a wholesale order.
 * GET /api/wholesale/orders/:id/tracking
 * @param {string} id - Order ID
 * @returns {Promise<{ orderId, orderNumber, orderStatus, timeline: [{ step, state }] }>}
 */
export const getWholesaleOrderTracking = async (id) => {
  const response = await axiosClient.get(`/wholesale/orders/${id}/tracking`);
  return response.data;
};

/**
 * Fetch all invoices for the logged-in wholesaler.
 * GET /api/wholesale/invoices
 * @returns {Promise<{ invoices: Array }>}
 */
export const getMyWholesaleInvoices = async () => {
  const response = await axiosClient.get('/wholesale/invoices');
  return response.data;
};

/**
 * Fetch full invoice JSON for a specific order.
 * GET /api/wholesale/invoices/:orderId
 * @param {string} orderId
 * @returns {Promise<Object>} Full invoice data
 */
export const getWholesaleInvoiceJson = async (orderId) => {
  const response = await axiosClient.get(`/wholesale/invoices/${orderId}`);
  return response.data;
};

/**
 * Download the wholesale invoice PDF.
 * Uses blob-download pattern (same as customer invoiceApi.js from Phase 5B).
 * GET /api/wholesale/invoices/:orderId/pdf -> PDF file
 * @param {string} orderId
 * @param {string} invoiceNumber - Used as the downloaded filename
 */
export const downloadWholesaleInvoicePdf = async (orderId, invoiceNumber = 'invoice') => {
  const response = await axiosClient.get(`/wholesale/invoices/${orderId}/pdf`, {
    responseType: 'blob'
  });

  // Create a temporary Blob URL and trigger browser download
  const file = new Blob([response.data], { type: 'application/pdf' });
  const fileURL = window.URL.createObjectURL(file);

  const link = document.createElement('a');
  link.href = fileURL;
  link.setAttribute('download', `wholesale-invoice-${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();

  // Clean up temporary link and object URL
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(fileURL);
};

/**
 * Fetch all payments for the logged-in wholesaler.
 * GET /api/wholesale/payments
 * @returns {Promise<{ payments: Array, summary: { totalPurchases, paidAmount, pendingAmount } }>}
 */
export const getMyWholesalePayments = async () => {
  const response = await axiosClient.get('/wholesale/payments');
  return response.data;
};

/**
 * Fetch wholesale reports for a given type and optional date range.
 * GET /api/wholesale/reports?type=&from=&to=
 * @param {string} type - "purchase-summary" | "order-history" | "product-wise" | "payment-history"
 * @param {string} from - ISO date string (optional)
 * @param {string} to   - ISO date string (optional)
 * @returns {Promise<Object>} Report data
 */
export const getWholesaleReports = async (type, from = '', to = '') => {
  const response = await axiosClient.get('/wholesale/reports', {
    params: { type, from, to }
  });
  return response.data;
};
