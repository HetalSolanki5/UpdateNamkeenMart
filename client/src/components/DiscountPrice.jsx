import React from 'react';

/**
 * DiscountPrice
 * Shared sub-component for rendering original sellingPrice with strikethrough,
 * final discounted price, and offer badge.
 * Reused in ProductCard and ProductDetailPage.
 */
const DiscountPrice = ({
  sellingPrice,
  finalPrice,
  discountAmount = 0,
  offerName = '',
  discountType = '',
  discountValue = 0,
  size = 'md'
}) => {
  const isLarge = size === 'lg';
  const hasDiscount = discountAmount > 0 && typeof finalPrice === 'number';

  const badgeText = offerName
    ? offerName
    : discountType === 'percentage'
    ? `${discountValue}% OFF`
    : `₹${discountValue} OFF`;

  return (
    <div>
      {hasDiscount && (
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-[#C62828] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md inline-flex items-center gap-1 shadow-xs">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{badgeText}</span>
          </span>
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <span
          className={`font-black text-[#C62828] ${
            isLarge ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
          }`}
        >
          ₹{hasDiscount ? finalPrice : sellingPrice}
        </span>
        {hasDiscount && (
          <span
            className={`font-semibold text-gray-400 line-through ${
              isLarge ? 'text-sm sm:text-base' : 'text-xs'
            }`}
          >
            ₹{sellingPrice}
          </span>
        )}
      </div>
    </div>
  );
};

export default DiscountPrice;
