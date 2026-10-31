import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const ProductCard = ({ product, onWishlistToggle, isWishlisted = false }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Extract variants and compute lowest price & default variant
  const variants = product?.variants || [];
  const prices = variants.map((v) => v.sellingPrice).filter((p) => typeof p === 'number');
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  // First active in-stock variant
  const defaultVariant = variants.find((v) => v.stockStatus !== 'out_of_stock');
  const isAllOutOfStock = !defaultVariant || variants.length === 0;

  // Image source
  const imageSrc = product?.productImages && product.productImages.length > 0
    ? product.productImages[0]
    : null;

  const handleCardClick = () => {
    navigate(`/customer/product/${product._id}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product._id);
    }
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
      className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Product Image */}
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
          className={`w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs font-medium ${
            imageSrc ? 'hidden' : 'flex'
          }`}
        >
          No Image
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          type="button"
          aria-label="Wishlist"
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition cursor-pointer text-[#C62828]"
        >
          {isWishlisted ? (
            <svg className="w-5 h-5 fill-[#C62828]" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 stroke-[#C62828] fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>

        {/* Stock badge if all out of stock */}
        {isAllOutOfStock && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-600/90 text-white text-[11px] font-bold rounded">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
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

        {/* Price */}
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="text-sm sm:text-base font-bold text-[#C62828]">
            {lowestPrice !== null ? `From ₹${lowestPrice}` : 'Price unavailable'}
          </span>
          {defaultVariant && (
            <span className="text-[11px] text-gray-500">
              {defaultVariant.weight}{defaultVariant.unit}
            </span>
          )}
        </div>

        {/* Add to Cart button */}
        <div className="mt-3 relative">
          <button
            onClick={handleAddToCart}
            disabled={isAllOutOfStock || adding}
            type="button"
            className={`w-full py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition shadow-sm ${
              isAllOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#C62828] hover:bg-[#8E1B1B] text-white active:scale-95'
            }`}
          >
            {isAllOutOfStock
              ? 'Out of Stock'
              : adding
              ? 'Adding...'
              : 'Add to Cart'}
          </button>

          {/* Feedback popup/toast */}
          {feedback && (
            <div
              className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap shadow-md ${
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
  );
};

export default ProductCard;
