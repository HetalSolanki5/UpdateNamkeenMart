import React from 'react';

const EmptyState = ({ message, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="w-16 h-16 mb-4 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#C62828]">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-700 text-base font-medium mb-4 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#C62828] hover:bg-[#8E1B1B] text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
