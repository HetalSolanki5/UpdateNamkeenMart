import React, { useState, useEffect } from 'react';
import { getAdminReports } from '../../api/adminReportApi.js';
import { PaymentSummaryCards } from './AdminPaymentsPage.jsx';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const REPORT_TABS = [
  { id: 'sales', label: 'Sales' },
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'stock', label: 'Stock' },
  { id: 'customers', label: 'Customers' },
  { id: 'wholesalers', label: 'Wholesalers' },
  { id: 'payments', label: 'Payments' },
  { id: 'revenue', label: 'Revenue' }
];

/**
 * Lightweight, div-based CSS bar chart for products and revenue.
 * Avoids heavy external charting libraries to keep bundle fast & predictable.
 */
const SimpleCssBarChart = ({ data = [], valuePrefix = '', labelKey = 'label', valueKey = 'value' }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
        Visual Comparison
      </h3>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const val = Number(item[valueKey]) || 0;
          const pct = Math.round((val / maxValue) * 100);
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium text-gray-700 truncate text-right">
                {item[labelKey] || `Item ${idx + 1}`}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C62828] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-24 text-xs font-black text-gray-900 shrink-0 text-right">
                {valuePrefix}
                {val.toLocaleString('en-IN')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminReports(activeTab, fromDate, toDate);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${activeTab} report.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, fromDate, toDate]);

  // ----------------------------------------------------
  // Tab-Specific Render Helpers
  // ----------------------------------------------------

  // 1. Sales Tab: Summary cards (Revenue, Orders, AOV)
  const renderSalesTab = () => {
    const totalRev = data?.totalRevenue ?? data?.revenue ?? data?.totalSales ?? 0;
    const totalOrders = data?.totalOrders ?? data?.orderCount ?? data?.orders ?? 0;
    const aov =
      data?.averageOrderValue ??
      data?.aov ??
      (totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-black text-gray-900">
              ₹{Number(totalRev).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Total Orders
            </p>
            <p className="text-2xl font-black text-gray-900">
              {Number(totalOrders).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Average Order Value (AOV)
            </p>
            <p className="text-2xl font-black text-[#C62828]">
              ₹{Number(aov).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 2. Orders Tab: Simple table of orders or status breakdown
  const renderOrdersTab = () => {
    const orderList = Array.isArray(data?.orders)
      ? data.orders
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    if (orderList.length === 0) {
      return (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 text-xs">
          No orders data recorded for this period.
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderList.map((o, idx) => (
                <tr key={o._id || idx} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">
                    {o.orderNumber || o._id?.slice?.(-6) || `ORD-${idx + 1}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-4 font-black text-gray-900">
                    ₹{Number(o.totalAmount || o.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.orderStatus || o.status} type="order" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.paymentStatus} type="payment" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. Products Tab: Top products table + CSS bar chart
  const renderProductsTab = () => {
    const products = Array.isArray(data?.topProducts)
      ? data.topProducts
      : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data)
      ? data
      : [];

    if (products.length === 0) {
      return (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 text-xs">
          No product performance data available for this range.
        </div>
      );
    }

    const chartData = products.slice(0, 8).map((p) => ({
      label: p.productName || p.name || p.title || 'Product',
      value: p.soldQuantity || p.quantity || p.totalQuantity || p.revenue || 0
    }));

    return (
      <div className="space-y-6">
        <SimpleCssBarChart
          data={chartData}
          labelKey="label"
          valueKey="value"
          valuePrefix=""
        />

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Top Selling Products
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {p.productName || p.name || 'Namkeen Item'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      {p.soldQuantity || p.quantity || p.totalQuantity || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#C62828]">
                      ₹{Number(p.revenue || p.totalRevenue || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 4. Stock Tab: Low/Out-of-stock items
  const renderStockTab = () => {
    const stockItems = Array.isArray(data?.stock)
      ? data.stock
      : Array.isArray(data?.lowStock)
      ? data.lowStock
      : Array.isArray(data)
      ? data
      : [];

    if (stockItems.length === 0) {
      return (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-emerald-700 text-xs font-bold">
          All inventory items are currently well-stocked. No low stock alerts!
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Product / Variant</th>
                <th className="py-3 px-4 text-center">Available Qty</th>
                <th className="py-3 px-4 text-center">Reserved Qty</th>
                <th className="py-3 px-4 text-center">Low Stock Threshold</th>
                <th className="py-3 px-4 text-right">Inventory Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockItems.map((s, idx) => {
                const name =
                  s.variantId?.productId?.productName ||
                  s.productName ||
                  s.variantName ||
                  'Namkeen Variant';
                const available = Number(s.availableQuantity ?? s.quantity ?? 0);
                const threshold = Number(s.lowStockThreshold ?? 10);
                const isOut = available <= 0;

                return (
                  <tr
                    key={s._id || idx}
                    className={`transition ${isOut ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 font-bold text-gray-900">{name}</td>
                    <td className="py-3 px-4 text-center font-black text-gray-900">
                      {available}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {s.reservedQuantity ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{threshold}</td>
                    <td className="py-3 px-4 text-right">
                      {isOut ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                          Out of Stock
                        </span>
                      ) : available <= threshold ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          Adequate
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 5. Customers Tab: Summary numbers + Top-10 customer table
  const renderCustomersTab = () => {
    const totalCustomers = data?.totalCustomers ?? data?.count ?? 0;
    const topCustomers = Array.isArray(data?.topCustomers)
      ? data.topCustomers
      : Array.isArray(data?.customers)
      ? data.customers
      : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Registered Customers
            </p>
            <p className="text-2xl font-black text-gray-900">
              {Number(totalCustomers).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Top Spenders Listed
            </p>
            <p className="text-2xl font-black text-[#C62828]">{topCustomers.length}</p>
          </div>
        </div>

        {topCustomers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Top Customers by Purchases
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Orders Placed</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topCustomers.map((c, idx) => (
                    <tr key={c._id || idx} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {c.name || c.customerName || 'Customer'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{c.email || c.phone || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {c.orderCount || c.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">
                        ₹{Number(c.totalSpent || c.spent || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 6. Wholesalers Tab: Status breakdown + Top-10 wholesaler table
  const renderWholesalersTab = () => {
    const totalWholesalers = data?.totalWholesalers ?? data?.count ?? 0;
    const byStatus = data?.byStatus || data?.statusCounts || {};
    const topWholesalers = Array.isArray(data?.topWholesalers)
      ? data.topWholesalers
      : Array.isArray(data?.wholesalers)
      ? data.wholesalers
      : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Total Wholesalers
            </p>
            <p className="text-2xl font-black text-gray-900">
              {Number(totalWholesalers).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
              Approved
            </p>
            <p className="text-2xl font-black text-emerald-800">
              {Number(byStatus.approved || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
              Pending Approval
            </p>
            <p className="text-2xl font-black text-amber-800">
              {Number(byStatus.pending || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">
              Rejected / Inactive
            </p>
            <p className="text-2xl font-black text-red-800">
              {Number((byStatus.rejected || 0) + (byStatus.inactive || 0)).toLocaleString(
                'en-IN'
              )}
            </p>
          </div>
        </div>

        {topWholesalers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Top B2B Wholesale Accounts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Business / Wholesaler</th>
                    <th className="py-3 px-4">GST Number</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Total Bulk Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topWholesalers.map((w, idx) => (
                    <tr key={w._id || idx} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {w.businessName || w.name || 'Wholesaler'}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{w.gstNumber || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {w.orderCount || w.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900">
                        ₹{Number(w.totalPurchases || w.spent || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 7. Payments Tab: Reuses PaymentSummaryCards
  const renderPaymentsTab = () => {
    return <PaymentSummaryCards data={data} />;
  };

  // 8. Revenue Tab: Div-based monthly bar representation
  const renderRevenueTab = () => {
    const monthlyList = Array.isArray(data?.monthly)
      ? data.monthly
      : Array.isArray(data?.revenueByMonth)
      ? data.revenueByMonth
      : Array.isArray(data)
      ? data
      : [];

    const totalRev =
      data?.totalRevenue ||
      monthlyList.reduce((acc, m) => acc + (Number(m.revenue || m.amount || 0) || 0), 0);

    const chartData = monthlyList.map((m) => ({
      label: m.month || m.name || m._id || 'Period',
      value: m.revenue || m.amount || m.total || 0
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Overall Revenue for Selected Range
            </p>
            <p className="text-3xl font-black text-[#C62828]">
              ₹{Number(totalRev).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <SimpleCssBarChart
            data={chartData}
            labelKey="label"
            valueKey="value"
            valuePrefix="₹"
          />
        ) : (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 text-xs">
            No monthly revenue breakdown available for the selected dates.
          </div>
        )}
      </div>
    );
  };

  // Map active tab to render function
  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return renderSalesTab();
      case 'orders':
        return renderOrdersTab();
      case 'products':
        return renderProductsTab();
      case 'stock':
        return renderStockTab();
      case 'customers':
        return renderCustomersTab();
      case 'wholesalers':
        return renderWholesalersTab();
      case 'payments':
        return renderPaymentsTab();
      case 'revenue':
        return renderRevenueTab();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Analytics & Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time business performance across sales, products, customers, and financials.
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

      {/* 8 Tab Navigation Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-[#C62828] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message={`Generating ${activeTab} report...`} />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-1">Failed to Load Report</p>
          <p className="text-xs mb-3">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-1.5 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      ) : !data ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 text-xs">
          No data available for this report type.
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default AdminReportsPage;
