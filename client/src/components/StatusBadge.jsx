import React from 'react';

/**
 * Reusable colored status pill component.
 * Used across wholesaler pages (and later admin pages) to show status at a glance.
 *
 * @param {string} status  - The raw status string (e.g. "pending", "delivered", "paid")
 * @param {string} type    - "order" | "payment" — reserved for future type-specific overrides
 */
const StatusBadge = ({ status, type }) => {
  const s = (status || '').toLowerCase().replace(/_/g, ' ');

  // Determine badge colour class based on status value
  let colorClass = 'bg-gray-100 text-gray-600 border-gray-200'; // default / unknown

  if (
    s === 'delivered' ||
    s === 'paid' ||
    s === 'success' ||
    s === 'active' ||
    s === 'approved'
  ) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    s === 'pending' ||
    s === 'processing' ||
    s === 'packed' ||
    s === 'confirmed' ||
    s === 'placed'
  ) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'shipped') {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (
    s === 'cancelled' ||
    s === 'failed' ||
    s === 'rejected' ||
    s === 'inactive'
  ) {
    colorClass = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${colorClass}`}
    >
      {s}
    </span>
  );
};

export default StatusBadge;
