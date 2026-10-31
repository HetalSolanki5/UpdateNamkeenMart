import axiosClient from './axiosClient.js';

/**
 * Fetch all invoices for the customer
 * @returns {Promise<{ invoices: Array }>}
 */
export const getMyInvoices = async () => {
  const response = await axiosClient.get('/invoices');
  return response.data;
};

/**
 * Fetch invoice JSON data by orderId
 * @param {string} orderId
 * @returns {Promise<{ invoice: Object }>}
 */
export const getInvoiceJson = async (orderId) => {
  const response = await axiosClient.get(`/invoices/${orderId}`);
  return response.data;
};

/**
 * Get direct backend PDF URL for reference
 * @param {string} orderId
 * @returns {string} URL
 */
export const getInvoicePdfUrl = (orderId) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/invoices/${orderId}/pdf`;
};

/**
 * Download invoice PDF by fetching blob with Authorization token and triggering browser download
 * @param {string} orderId Order ID
 * @param {string} invoiceNumber Optional invoice number for filename
 */
export const downloadInvoicePdf = async (orderId, invoiceNumber = 'invoice') => {
  const response = await axiosClient.get(`/invoices/${orderId}/pdf`, {
    responseType: 'blob'
  });

  // Create a Blob from the PDF Stream
  const file = new Blob([response.data], { type: 'application/pdf' });
  const fileURL = window.URL.createObjectURL(file);

  // Trigger download with temporary link
  const link = document.createElement('a');
  link.href = fileURL;
  link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();

  // Clean up
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(fileURL);
};
