import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Extract variants and compute lowest price & default variant
  const variants = product?.variants || [];
  const prices = variants
    .map((v) => (typeof v.finalPrice === 'number' ? v.finalPrice : v.sellingPrice))
    .filter((p) => typeof p === 'number');
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  // First active in-stock variant (or first variant as fallback)
  const defaultVariant = variants.find((v) => v.stockStatus !== 'out_of_stock') || variants[0];
  const isAllOutOfStock = !defaultVariant || variants.every((v) => v.stockStatus === 'out_of_stock');

  // Check if any variant has an active offer
  const activeOffer = variants.find((v) => v.discountAmount > 0 && v.offerName);
  const discountBadge = activeOffer
    ? activeOffer.offerName && activeOffer.offerName.length <= 16
      ? activeOffer.offerName
      : activeOffer.discountType === 'percentage'
      ? `${activeOffer.discountValue}% OFF`
      : `₹${activeOffer.discountValue} OFF`
    : null;

  // Image source
  const imageSrc = product?.productImages && product.productImages.length > 0
    ? product.productImages[0]
    : null;

  const handleCardClick = () => {
    navigate(`/customer/product/${product._id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isAllOutOfStock || !defaultVariant) return;

    setAdding(true);
    setFeedback(null);
    const result = await addItem(defaultVariant._id, 1);
    setAdding(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Added!' });
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed' });
    }

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 2000);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Product Image & Floating Badges */}
      <div className="relative w-full aspect-square bg-[#FFF9F9] flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center bg-[#FFF9F9] text-gray-400 text-xs font-medium ${
            imageSrc ? 'hidden' : 'flex'
          }`}
        >
          No Image
        </div>

        {/* Top-Left: Discount Badge (Offer name or X% OFF / ₹X OFF) */}
        {discountBadge && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#C62828] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm z-10 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="line-clamp-1">{discountBadge}</span>
          </div>
        )}

        {/* Top-Right: Diet Badge (shown ONLY when productRange === 'diet') */}
        {product?.productRange === 'diet' && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg shadow-xs z-10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Diet</span>
          </div>
        )}

        {/* Stock badge if all out of stock */}
        {isAllOutOfStock && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-600/90 text-white text-[10px] sm:text-[11px] font-bold rounded-md">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        {/* Rating */}
        <div className="flex items-center text-xs text-gray-500 mb-1">
          {product.reviewCount > 0 ? (
            <>
              <span className="text-amber-500 font-bold mr-1">★ {product.averageRating}</span>
              <span>({product.reviewCount})</span>
            </>
          ) : (
            <span className="text-gray-400">No reviews</span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-1 group-hover:text-[#C62828] transition-colors mb-1">
          {product.productName}
        </h3>

        {/* Price & Add Button Row */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {defaultVariant && defaultVariant.discountAmount > 0 ? (
                <>
                  <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                    ₹{defaultVariant.sellingPrice}
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#C62828]">
                    ₹{defaultVariant.finalPrice}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base font-black text-[#C62828]">
                  {lowestPrice !== null ? `From ₹${lowestPrice}` : 'Unavailable'}
                </span>
              )}
            </div>
            {defaultVariant && (
              <span className="text-[11px] text-gray-400 block -mt-0.5">
                {defaultVariant.weight}{defaultVariant.unit}
              </span>
            )}
          </div>

          {/* Small red "Add" button */}
          <div className="relative">
            <button
              onClick={handleAddToCart}
              disabled={isAllOutOfStock || adding}
              type="button"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 ${
                isAllOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#C62828] hover:bg-[#8E1B1B] text-white active:scale-95'
              }`}
            >
              {isAllOutOfStock ? (
                'Out'
              ) : adding ? (
                '...'
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add</span>
                </>
              )}
            </button>

            {/* Feedback popup/toast */}
            {feedback && (
              <div
                className={`absolute -top-7 right-0 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap shadow-md z-10 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
