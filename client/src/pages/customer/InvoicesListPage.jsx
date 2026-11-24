import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyInvoices } from '../../api/invoiceApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyInvoices();
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
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Invoices
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Download or view tax invoices for all completed purchases.
          </p>
        </div>
        <Link
          to="/customer/orders"
          className="text-xs font-bold text-[#C62828] hover:text-[#8E1B1B] underline"
        >
          &larr; View Orders
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading invoices..." />
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState message="No invoices generated yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Order No</th>
                <th className="py-3.5 px-4">Invoice Date</th>
                <th className="py-3.5 px-4">Total Amount</th>
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
                    {inv.order?.orderNumber || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-black text-gray-900">
                    ₹{inv.totalAmount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.order?._id ? (
                      <Link
                        to={`/customer/invoices/${inv.order._id}`}
                        className="px-3 py-1 bg-[#FDECEC] text-[#C62828] hover:bg-[#8E1B1B] hover:text-white rounded text-xs font-bold transition inline-block"
                      >
                        View Invoice
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unavailable</span>
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

export default InvoicesListPage;
