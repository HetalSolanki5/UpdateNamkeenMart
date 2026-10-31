import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWholesaleInvoices } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const WholesaleInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyWholesaleInvoices();
        setInvoices(data?.invoices || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoices.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Wholesale Invoices</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View and download invoices for your wholesale purchases.
          </p>
        </div>
        <Link
          to="/wholesaler/orders"
          className="text-xs font-bold text-[#C62828] hover:underline"
        >
          ← View Orders
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading invoices..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState message="No invoices yet. Invoices are generated after you place a wholesale order." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Order No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {inv.order?.orderNumber || inv.wholesaleOrder?.orderNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-black text-gray-900">
                    ₹{inv.totalAmount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={inv.paymentStatus} type="payment" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {(inv.order?._id || inv.wholesaleOrder?._id || inv.orderId) ? (
                      <Link
                        to={`/wholesaler/invoices/${inv.order?._id || inv.wholesaleOrder?._id || inv.orderId}`}
                        className="px-3 py-1.5 bg-[#FDECEC] text-[#C62828] hover:bg-[#C62828] hover:text-white rounded text-xs font-bold transition inline-block"
                      >
                        View Invoice
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WholesaleInvoicesPage;
