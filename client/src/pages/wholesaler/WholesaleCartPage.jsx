import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWholesaleCart } from '../../context/WholesaleCartContext.jsx';
import { placeWholesaleOrder } from '../../api/wholesaleApi.js';
import EmptyState from '../../components/EmptyState.jsx';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', description: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', description: 'All major Indian banks' },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay on delivery (COD)' }
];

const WholesaleCartPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useWholesaleCart();

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Cart is invalid if any item is below its MOQ
  const hasAnyBelowMoq = items.some((item) => item.quantity < item.minOrderQty);
  const canPlaceOrder = items.length > 0 && !hasAnyBelowMoq;

  /**
   * Place the wholesale order via the backend.
   * On success: clear the cart and navigate to the new order's detail page.
   * On error: show the backend's error message and keep the cart intact so the
   * wholesaler can adjust quantities and retry.
   */
  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;

    setPlacing(true);
    setOrderError(null);

    // Shape items as { variantId, quantity } for the backend
    const orderItems = items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));

    try {
      const result = await placeWholesaleOrder(orderItems, paymentMethod);
      // Success: clear the frontend cart and go to the new order's detail page
      clearCart();
      const newOrderId = result?.order?._id;
      if (newOrderId) {
        navigate(`/wholesaler/orders/${newOrderId}`);
      } else {
        navigate('/wholesaler/orders');
      }
    } catch (err) {
      // Keep cart intact on error — wholesaler can fix quantities and retry
      setOrderError(
        err.response?.data?.message ||
          'Failed to place order. Please check quantities and try again.'
      );
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          message="Your wholesale cart is empty. Add products from the catalogue."
          actionLabel="Browse Wholesale Products"
          onAction={() => navigate('/wholesaler/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Wholesale Cart</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review your order before submitting.
          </p>
        </div>
        <Link
          to="/wholesaler/products"
          className="text-xs font-bold text-[#C62828] hover:underline"
        >
          ← Continue Browsing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-3">
          {/* MOQ global warning */}
          {hasAnyBelowMoq && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
              ⚠️ Some items are below their minimum order quantity. Fix them before placing your order.
            </div>
          )}

          {/* Error from API */}
          {orderError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-800">
              <strong>Order failed:</strong> {orderError}
            </div>
          )}

          {/* Item rows */}
          {items.map((item) => {
            const belowMoq = item.quantity < item.minOrderQty;
            const rowTotal = item.wholesalePrice * item.quantity;

            return (
              <div
                key={item.variantId}
                className={`bg-white rounded-xl border shadow-sm p-4 space-y-2 ${
                  belowMoq ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">{item.displayName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₹{item.wholesalePrice} per unit ·{' '}
                      <span className="font-medium">MOQ: {item.minOrderQty}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">
                      ₹{rowTotal.toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-medium mt-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) updateQuantity(item.variantId, v);
                    }}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-[#C62828]"
                  />
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition"
                  >
                    +
                  </button>
                  {/* MOQ warning badge */}
                  {belowMoq && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      Below min. order of {item.minOrderQty}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary + payment */}
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-bold text-gray-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#C62828] text-base">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3">
              Payment Method
            </h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    paymentMethod === method.id
                      ? 'border-[#C62828] bg-[#FDECEC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="mt-0.5 accent-[#C62828]"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{method.label}</p>
                    <p className="text-[10px] text-gray-500">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Simulated payment notice — same honest note as Phase 5B customer checkout */}
            <p className="text-[10px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              ℹ️ Payment is simulated for this project. No real transaction will be processed.
            </p>

            {/* Place Order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder || placing}
              className={`w-full py-3 rounded-xl text-sm font-black transition shadow-sm ${
                canPlaceOrder && !placing
                  ? 'bg-[#C62828] hover:bg-[#8E1B1B] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {placing ? 'Placing Order...' : 'Place Wholesale Order'}
            </button>

            {/* Disabled reason hint */}
            {!canPlaceOrder && items.length > 0 && (
              <p className="text-[10px] text-red-600 text-center font-medium">
                Fix items below minimum order quantity to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleCartPage;
