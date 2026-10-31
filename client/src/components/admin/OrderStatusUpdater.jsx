import React from 'react';
import StatusBadge from '../StatusBadge.jsx';

/**
 * Valid next statuses mapping:
 * - Customer orders: placed -> confirmed -> processing -> packed -> shipped -> out_for_delivery -> delivered
 * - Wholesale orders: pending -> confirmed -> processing -> packed -> shipped -> delivered (no out_for_delivery)
 * Cancellation is allowed from any non-terminal state.
 */
const CUSTOMER_STATUS_FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

const WHOLESALE_STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

/**
 * Human friendly labels for order statuses
 */
const STATUS_LABELS = {
  placed: 'Placed',
  pending: 'Pending',
  confirmed: 'Confirm Order',
  processing: 'Mark Processing',
  packed: 'Mark Packed',
  shipped: 'Ship Order',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Mark Delivered',
  cancelled: 'Cancel Order'
};

/**
 * OrderStatusUpdater
 *
 * @param {string} currentStatus - Current order status string
 * @param {string} orderType - 'customer' | 'wholesale'
 * @param {Function} onUpdate - callback when a status update is chosen: (newStatus) => void
 * @param {boolean} updating - loading boolean during request
 */
const OrderStatusUpdater = ({
  currentStatus = '',
  orderType = 'customer',
  onUpdate,
  updating = false
}) => {
  const normStatus = (currentStatus || '').toLowerCase();
  const flowMap = orderType === 'wholesale' ? WHOLESALE_STATUS_FLOW : CUSTOMER_STATUS_FLOW;
  const allowedNext = flowMap[normStatus] || [];

  const handleStatusClick = (nextStatus) => {
    if (updating) return;

    if (nextStatus === 'cancelled') {
      const confirmed = window.confirm('Cancelling will restore stock. Are you sure?');
      if (!confirmed) return;
    }

    if (onUpdate) {
      onUpdate(nextStatus);
    }
  };

  const isCompleted = normStatus === 'delivered';
  const isCancelled = normStatus === 'cancelled';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Status display */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Order Status:
          </span>
          <StatusBadge status={normStatus} type="order" />
        </div>

        {/* Action buttons / Terminal message */}
        <div className="flex flex-wrap items-center gap-2">
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              This order is complete.
            </span>
          )}

          {isCancelled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-200">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              This order was cancelled.
            </span>
          )}

          {!isCompleted && !isCancelled && allowedNext.length === 0 && (
            <span className="text-xs text-gray-500 italic">No further actions available.</span>
          )}

          {!isCompleted && !isCancelled && (
            <>
              {/* Forward progress buttons */}
              {allowedNext
                .filter((st) => st !== 'cancelled')
                .map((nextSt) => (
                  <button
                    key={nextSt}
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusClick(nextSt)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C62828] text-white hover:bg-[#8E1B1B] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
                  >
                    {updating && (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    )}
                    {STATUS_LABELS[nextSt] || nextSt}
                  </button>
                ))}

              {/* Separated Cancel button */}
              {allowedNext.includes('cancelled') && (
                <button
                  key="cancelled"
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusClick('cancelled')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
                >
                  Cancel Order
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusUpdater;
