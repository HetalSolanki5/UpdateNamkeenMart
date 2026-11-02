import React from 'react';

/**
 * StatusBreakdownList
 *
 * Horizontal progress-bar list:
 * - Computes counts of each orderStatus from recent customer & wholesale orders.
 * - Colors each bar by status using brand-safe colors:
 *     green: delivered (#639922)
 *     amber: confirmed, processing, packed, shipped, out_for_delivery (#BA7517)
 *     red: cancelled (#C62828)
 *     grey: placed, pending (#6B7280)
 * - Sorted by count descending.
 * - Displays label, horizontal bar with percentage width, and count/percentage.
 * - Transparent footnote: "Based on recent orders".
 */
const STATUS_COLORS = {
  delivered: 'bg-[#639922]',
  confirmed: 'bg-[#BA7517]',
  processing: 'bg-[#BA7517]',
  packed: 'bg-[#BA7517]',
  shipped: 'bg-[#BA7517]',
  out_for_delivery: 'bg-[#BA7517]',
  cancelled: 'bg-[#C62828]',
  placed: 'bg-gray-500',
  pending: 'bg-gray-400'
};

const formatStatusLabel = (status = '') => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const StatusBreakdownList = ({ orders = [] }) => {
  // Aggregate status counts
  const countsMap = {};
  for (const o of orders) {
    const s = (o.orderStatus || 'pending').toLowerCase();
    countsMap[s] = (countsMap[s] || 0) + 1;
  }

  const total = orders.length;

  // Convert to array and sort descending by count
  const items = Object.entries(countsMap)
    .map(([status, count]) => ({
      status,
      label: formatStatusLabel(status),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      colorClass: STATUS_COLORS[status] || 'bg-gray-400'
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Status Breakdown</h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
            Pipeline Health
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Lifecycle progression across recent incoming customer & wholesale orders.
        </p>
      </div>

      <div className="min-h-56 flex flex-col justify-center">
        {items.length === 0 ? (
          <div className="text-center text-xs text-gray-400 font-medium py-8">
            Not enough data yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{item.label}</span>
                  <span className="font-medium text-gray-500 text-[11px]">
                    <strong className="text-gray-900 font-bold">{item.count}</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.colorClass}`}
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span>* Based on recent orders</span>
        <span className="font-medium text-gray-600">{total} orders analyzed</span>
      </div>
    </div>
  );
};

export default StatusBreakdownList;

