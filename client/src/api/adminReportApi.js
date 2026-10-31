import axiosClient from './axiosClient.js';

/**
 * Fetch admin reports for a specific type and optional date range.
 * GET /api/admin/reports?type=sales|orders|products|stock|customers|wholesalers|payments|revenue&from=&to=
 * @param {string} type - 'sales' | 'orders' | 'products' | 'stock' | 'customers' | 'wholesalers' | 'payments' | 'revenue'
 * @param {string} [from=''] - Optional start date (YYYY-MM-DD or ISO)
 * @param {string} [to=''] - Optional end date (YYYY-MM-DD or ISO)
 * @returns {Promise<Object>} Report payload whose shape varies by report type
 */
export const getAdminReports = async (type, from = '', to = '') => {
  const params = { type };
  if (from && from.trim() !== '') params.from = from.trim();
  if (to && to.trim() !== '') params.to = to.trim();

  const response = await axiosClient.get('/admin/reports', { params });
  return response.data;
};
