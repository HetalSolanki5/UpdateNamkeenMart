import React, { useState } from 'react';

/**
 * WholesaleProductCard
 * Displays a product with all its variants, each showing wholesalePrice, retailPrice,
 * minOrderQty (MOQ), stockStatus, a quantity input, and an "Add to Wholesale Cart" button.
 *
 * @param {Object} product    - { _id, productName, category, productImages, variants: [...] }
 * @param {Function} onAddToCart - (variantData, quantity) => void
 */
const WholesaleProductCard = ({ product, onAddToCart }) => {
  // Track per-variant quantity inputs (keyed by variant _id)
  const [quantities, setQuantities] = useState(() => {
    const init = {};
    (product.variants || []).forEach((v) => {
      init[v._id] = v.minOrderQty || 1;
    });
    return init;
  });

  // Per-variant success flash state
  const [flashVariant, setFlashVariant] = useState(null);

  const handleQtyChange = (variantId, value, minOrderQty) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setQuantities((prev) => ({ ...prev, [variantId]: parsed }));
    }
  };

  const handleAddToCart = (variant) => {
    const qty = quantities[variant._id] || variant.minOrderQty || 1;
    onAddToCart(variant, product.productName, qty);

    // Show a brief "Added!" flash on the button
    setFlashVariant(variant._id);
    setTimeout(() => setFlashVariant(null), 1500);
  };

  // Use first image or a placeholder
  const imageUrl =
    product.productImages?.[0] ||
    'https://placehold.co/400x300/FDECEC/C62828?text=No+Image';

  const categoryName =
    typeof product.category === 'object'
      ? product.category?.name
      : product.category || '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative h-44 bg-[#FFF9F9] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x300/FDECEC/C62828?text=No+Image';
          }}
        />
        {/* Category Badge */}
        {categoryName && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 text-[#C62828] text-[10px] font-bold rounded-full border border-[#C62828]/20 uppercase tracking-wide">
            {categoryName}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-black text-gray-900 mb-3 leading-tight">
          {product.productName}
        </h3>

        {/* Variants */}
        <div className="space-y-4 flex-1">
          {(product.variants || []).map((variant) => {
            const qty = quantities[variant._id] || variant.minOrderQty || 1;
            const isBelowMoq = qty < (variant.minOrderQty || 1);
            const isOutOfStock = variant.stockStatus === 'out_of_stock';
            const isAdded = flashVariant === variant._id;

            return (
              <div
                key={variant._id}
                className="border border-gray-100 rounded-xl p-3 bg-gray-50/50"
              >
                {/* Variant header: display name + stock badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">
                    {variant.displayName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>

                {/* Prices */}
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-sm font-black text-[#C62828]">
                    ₹{variant.wholesalePrice}
                  </span>
                  <span className="text-[11px] text-gray-400 line-through">
                    ₹{variant.retailPrice}
                  </span>
                  <span className="text-[10px] text-gray-500">(retail)</span>
                </div>

                {/* MOQ label */}
                <p className="text-[10px] text-gray-500 mb-2">
                  MOQ: <span className="font-semibold text-gray-700">{variant.minOrderQty} units</span>
                </p>

                {/* Quantity input + Add button */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      handleQtyChange(variant._id, e.target.value, variant.minOrderQty)
                    }
                    disabled={isOutOfStock}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#C62828] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => handleAddToCart(variant)}
                    disabled={isOutOfStock || isBelowMoq}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition text-center ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : isOutOfStock || isBelowMoq
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#C62828] hover:bg-[#8E1B1B] text-white'
                    }`}
                  >
                    {isAdded ? '✓ Added!' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>

                {/* MOQ warning — shown when qty < minOrderQty */}
                {isBelowMoq && !isOutOfStock && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1.5">
                    ⚠ Minimum order is {variant.minOrderQty} units
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WholesaleProductCard;
