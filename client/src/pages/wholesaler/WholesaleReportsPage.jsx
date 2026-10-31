import React, { useState, useEffect, useCallback } from 'react';
import { getWholesaleReports } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';

const REPORT_TYPES = [
  { id: 'purchase-summary', label: 'Purchase Summary' },
  { id: 'order-history', label: 'Order History' },
  { id: 'product-wise', label: 'Product-wise Purchases' },
  { id: 'payment-history', label: 'Payment History' }
];

/**
 * Simple CSS bar chart — no external library.
 * Renders a basic proportional bar chart using divs.
 * @param {Array} data - [{ label, value }]
 * @param {string} valuePrefix - e.g. "₹"
 */
const SimpleCssBarChart = ({ data, valuePrefix = '' }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-5">
        Visual Overview
      </h3>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const pct = Math.round(((Number(item.value) || 0) / maxValue) * 100);
          return (
            <div key={idx} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 shrink-0 text-[10px] text-gray-600 font-medium truncate text-right">
                {item.label}
              </div>
              {/* Bar */}
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C62828] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* Value */}
              <div className="w-20 text-[11px] font-black text-gray-900 shrink-0">
                {valuePrefix}{Number(item.value || 0).toLocaleString('en-IN')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Render the report data as a generic table.
 * Handles the various shapes different report types may return.
 */
const ReportTable = ({ reportType, data }) => {
  if (!data) return null;

  // Normalise to an array of rows for rendering
  let rows = [];
  let columns = [];

  if (Array.isArray(data)) {
    rows = data;
    columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  } else if (data.data && Array.isArray(data.data)) {
    rows = data.data;
    columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  } else if (typeof data === 'object') {
    // Flatten top-level object keys into a single-row display
    rows = [data];
    columns = Object.keys(data);
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
        No data available for this report and date range.
      </div>
    );
  }

  // Format a cell value nicely
  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col} className="py-3 px-4">
                  {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/70 transition">
                {columns.map((col) => (
                  <td key={col} className="py-3 px-4 text-gray-700 font-medium">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WholesaleReportsPage = () => {
  const [activeTab, setActiveTab] = useState('purchase-summary');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const data = await getWholesaleReports(activeTab, fromDate, toDate);
      setReportData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fromDate, toDate]);

  // Fetch on mount and on tab/date changes
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Build chart data only for "purchase-summary" and "order-history"
  const buildChartData = () => {
    if (!reportData) return null;
    if (activeTab !== 'purchase-summary' && activeTab !== 'order-history') return null;

    const raw = Array.isArray(reportData)
      ? reportData
      : Array.isArray(reportData?.data)
      ? reportData.data
      : null;

    if (!raw || raw.length === 0) return null;

    // Try to extract label+value pairs from common field names
    return raw.map((row) => ({
      label:
        row.month ||
        row.date ||
        row.period ||
        row.orderNumber ||
        row._id ||
        'Item',
      value:
        row.totalAmount ||
        row.amount ||
        row.totalPurchases ||
        row.count ||
        row.value ||
        0
    }));
  };

  const chartData = buildChartData();

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Wholesale Reports</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Analyse your purchase activity, orders, products, and payment trends.
        </p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto">
          {REPORT_TYPES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#C62828] text-[#C62828] bg-[#FDECEC]/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C62828]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C62828]"
          />
        </div>
        <button
          onClick={fetchReport}
          className="px-4 py-1.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition"
        >
          Apply
        </button>
        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate('');
              setToDate('');
            }}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Report content */}
      {loading ? (
        <Loader message="Generating report..." />
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
          {error}
        </div>
      ) : (
        <>
          <ReportTable reportType={activeTab} data={reportData} />

          {/* Bar chart for purchase-summary or order-history */}
          {chartData && chartData.length > 0 && (
            <SimpleCssBarChart
              data={chartData.slice(0, 10)}
              valuePrefix={
                activeTab === 'purchase-summary' || activeTab === 'order-history'
                  ? '₹'
                  : ''
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default WholesaleReportsPage;
