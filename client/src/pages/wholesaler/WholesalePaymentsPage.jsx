import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWholesalePayments } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const WholesalePaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyWholesalePayments();
        setPayments(data?.payments || []);
        setSummary(data?.summary || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch payment data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Payments</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Overview of all wholesale payments and account balance.
        </p>
      </div>

      {loading ? (
        <Loader message="Loading payment data..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Total Purchases
                </p>
                <p className="text-2xl font-black text-gray-900">
                  ₹{Number(summary.totalPurchases || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                  Paid Amount
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  ₹{Number(summary.paidAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
                  Pending Amount
                </p>
                <p className="text-2xl font-black text-amber-700">
                  ₹{Number(summary.pendingAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Payment history table */}
          {payments.length === 0 ? (
            <EmptyState message="No payments recorded yet. Payments appear after placing a wholesale order." />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Payment History</h2>
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Payment ID</th>
                      <th className="py-3.5 px-4">Order Ref</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((pay) => (
                      <tr key={pay._id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-mono text-gray-700 text-[10px]">
                          {pay._id?.slice(-8)?.toUpperCase() || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {pay.wholesaleOrder?.orderNumber ||
                            pay.order?.orderNumber ||
                            pay.invoiceNumber ||
                            '—'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-gray-900">
                          ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 uppercase">
                          {pay.method || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={pay.status} type="payment" />
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {pay.createdAt
                            ? new Date(pay.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked */}
              <div className="md:hidden divide-y divide-gray-100">
                {payments.map((pay) => (
                  <div key={pay._id} className="px-4 py-3 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-900">
                        ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <StatusBadge status={pay.status} type="payment" />
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Order:{' '}
                      {pay.wholesaleOrder?.orderNumber || pay.order?.orderNumber || '—'} ·{' '}
                      {pay.method?.toUpperCase()} ·{' '}
                      {pay.createdAt
                        ? new Date(pay.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WholesalePaymentsPage;
