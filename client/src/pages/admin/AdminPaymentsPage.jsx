import React, { useState, useEffect } from 'react';
import { getAdminReports } from '../../api/adminReportApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

/**
 * Reusable summary cards component for payment breakdown (by status & method).
 * Reused inside AdminReportsPage ('payments' tab) to avoid duplicate markup.
 */
export const PaymentSummaryCards = ({ data }) => {
  if (!data) return null;

  // Extract by-status and by-method counts / amounts
  const byStatus = data.byStatus || data.statusTotals || data.status || {};
  const byMethod = data.byMethod || data.methodTotals || data.methods || {};
  const totalAmount = data.totalAmount || data.totalRevenue || data.total || 0;
  const totalCount = data.totalCount || data.count || 0;

  return (
    <div className="space-y-6">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Total Payments
          </p>
          <p className="text-2xl font-black text-gray-900">
            ₹{Number(totalAmount).toLocaleString('en-IN')}
          </p>
          {totalCount > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">{totalCount} total transactions</p>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
            Successful / Paid
          </p>
          <p className="text-2xl font-black text-emerald-800">
            ₹{Number(byStatus.success || byStatus.paid || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
            Pending / COD
          </p>
          <p className="text-2xl font-black text-amber-800">
            ₹{Number(byStatus.pending || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">
            Failed / Cancelled
          </p>
          <p className="text-2xl font-black text-red-800">
            ₹{Number(byStatus.failed || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Breakdown by Payment Method
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-semibold block uppercase text-[10px]">UPI</span>
            <span className="text-base font-black text-gray-900 mt-0.5 block">
              ₹{Number(byMethod.upi || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-semibold block uppercase text-[10px]">Cards</span>
            <span className="text-base font-black text-gray-900 mt-0.5 block">
              ₹{Number(byMethod.card || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-semibold block uppercase text-[10px]">
              Net Banking
            </span>
            <span className="text-base font-black text-gray-900 mt-0.5 block">
              ₹{Number(byMethod.netbanking || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-semibold block uppercase text-[10px]">
              Cash on Delivery (COD)
            </span>
            <span className="text-base font-black text-gray-900 mt-0.5 block">
              ₹{Number(byMethod.cod || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPaymentsPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaymentsReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminReports('payments', fromDate, toDate);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsReport();
  }, [fromDate, toDate]);

  // Check if response contains a raw list of payment objects
  const rawPayments =
    data && Array.isArray(data.payments)
      ? data.payments
      : data && Array.isArray(data.data)
      ? data.data
      : data && Array.isArray(data)
      ? data
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Payments & Transactions</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated revenue by gateway status and payment method.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-start">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
          />
          <span className="text-xs text-gray-400 font-semibold">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message="Loading payment reports..." />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-1">Error Loading Payments</p>
          <p className="text-xs mb-3">{error}</p>
          <button
            onClick={fetchPaymentsReport}
            className="px-4 py-1.5 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      ) : !data ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 text-xs">
          No payment transaction data available.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Breakdown Cards */}
          <PaymentSummaryCards data={data} />

          {/* Raw payments table if backend returns a list */}
          {rawPayments && rawPayments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Recent Payment Records
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Order Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rawPayments.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-black text-gray-900">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold uppercase text-gray-700">
                          {p.method || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={p.status} type="payment" />
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {p.transactionId || '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700">
                          {p.orderId?.orderNumber || p.orderId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
