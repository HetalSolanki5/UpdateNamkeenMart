import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, loading, refreshCart, updateItem, removeItem, clearCartItems } = useCart();
  const [itemErrors, setItemErrors] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryCharge = cart?.deliveryCharge || 0;
  const total = cart?.total || 0;

  // Quantity stepper handler
  const handleQuantityChange = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setUpdatingId(itemId);
    setItemErrors((prev) => ({ ...prev, [itemId]: null }));

    const res = await updateItem(itemId, newQty);
    setUpdatingId(null);

    if (!res.success) {
      setItemErrors((prev) => ({ ...prev, [itemId]: res.error }));
      setTimeout(() => {
        setItemErrors((prev) => ({ ...prev, [itemId]: null }));
      }, 3000);
    }
  };

  // Remove single item handler
  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    await removeItem(itemId);
    setUpdatingId(null);
  };

  // Clear all items handler
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCartItems();
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length > 0) {
      navigate('/customer/checkout');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Loader message="Loading your shopping cart..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your selected namkeens before placing your order.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            type="button"
            className="text-xs text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
          >
            Clear Entire Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          message="Your cart is empty."
          actionLabel="Continue Shopping"
          onAction={() => navigate('/customer/shop')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product || {};
              const variant = item.variant || {};
              const imageSrc = product.productImages?.[0] || null;
              const hasError = itemErrors[item._id];
              const isUpdating = updatingId === item._id;

              return (
                <div
                  key={item._id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Product Details & Thumbnail */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFF9F9] rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">No Image</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <Link
                          to={`/customer/product/${product._id}`}
                          className="font-bold text-gray-800 text-sm sm:text-base hover:text-[#C62828] transition-colors line-clamp-1"
                        >
                          {product.productName}
                        </Link>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          • {variant.weight}{variant.unit}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#C62828] mt-1">
                        ₹{variant.sellingPrice} each
                      </div>
                      {hasError && (
                        <div className="text-xs text-red-600 font-bold mt-1">
                          {hasError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-gray-200 rounded-full px-1 py-0.5 bg-white shadow-xs">
                      <button
                        type="button"
                        disabled={item.quantity <= 1 || isUpdating}
                        onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="px-2.5 text-xs sm:text-sm font-bold text-gray-800 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[4.5rem]">
                      <span className="text-sm sm:text-base font-black text-gray-900 block">
                        ₹{item.subtotal}
                      </span>
                    </div>

                    {/* Remove Icon */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item._id)}
                      disabled={isUpdating}
                      title="Remove Item"
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-800">₹{subtotal}</span>
              </div>
              {cart?.cartOfferName && cart?.cartDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold text-xs bg-emerald-50 p-2 rounded-lg">
                  <span>Bulk Discount ({cart.cartOfferName}):</span>
                  <span>-₹{cart.cartDiscountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-emerald-600">
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Total Payable</span>
              <span className="text-2xl font-black text-[#C62828]">₹{total}</span>
            </div>

            {/* Proceed to Checkout button */}
            <div className="pt-2">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 bg-[#C62828] hover:bg-[#8E1B1B] text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer active:scale-98"
              >
                Proceed to Checkout
              </button>
            </div>

            {/* Continue shopping link */}
            <div className="text-center pt-2">
              <Link
                to="/customer/shop"
                className="text-xs font-semibold text-gray-600 hover:text-[#C62828] transition"
              >
                &larr; Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
