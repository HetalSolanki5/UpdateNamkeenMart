import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { getAddresses, addAddress } from '../../api/addressApi.js';
import { placeOrder, initiateCheckout, verifyPayment } from '../../api/orderApi.js';
import AddressCard from '../../components/AddressCard.jsx';
import AddressForm from '../../components/AddressForm.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';

const STEPS = [
  { id: 1, label: 'Delivery Address' },
  { id: 2, label: 'Order Summary' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Confirmation' }
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Payment method: "upi" | "card" | "netbanking" | "cod"
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState(null);
  const [placedOrderData, setPlacedOrderData] = useState(null);

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddr = async () => {
      setLoadingAddresses(true);
      try {
        const data = await getAddresses();
        const addrList = data?.addresses || [];
        setAddresses(addrList);

        // Auto-select default or first address
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
          setSelectedAddressId(defaultAddr._id);
        } else {
          setShowAddForm(true);
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddr();
  }, []);

  // Handle adding new address during checkout
  const handleCreateAddress = async (formData) => {
    setSavingAddress(true);
    try {
      const res = await addAddress(formData);
      const updatedList = res?.addresses || [];
      setAddresses(updatedList);
      const newAddr = updatedList[updatedList.length - 1];
      if (newAddr) {
        setSelectedAddressId(newAddr._id);
      }
      setShowAddForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Place order handler (Phase 5D-B: COD direct instant order vs Online Razorpay widget flow)
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setPlaceOrderError('Please select a delivery address.');
      setCurrentStep(1);
      return;
    }

    setPlacing(true);
    setPlaceOrderError(null);

    // Case A: Cash on Delivery (COD) — instant simulated checkout
    if (paymentMethod === 'cod') {
      try {
        const result = await placeOrder(selectedAddressId, 'cod');
        setPlacedOrderData(result);
        setCurrentStep(4);
        await refreshCart();
      } catch (err) {
        setPlaceOrderError(
          err.response?.data?.message || 'Failed to place order. Please check stock or try again.'
        );
      } finally {
        setPlacing(false);
      }
      return;
    }

    // Case B: Online Payment (UPI, Card, Net Banking) via official Razorpay Checkout widget
    try {
      const response = await initiateCheckout(selectedAddressId, paymentMethod);

      // Verify window.Razorpay is loaded from https://checkout.razorpay.com/v1/checkout.js
      if (!window.Razorpay) {
        setPlaceOrderError('Razorpay checkout SDK failed to load. Please check your internet connection.');
        setPlacing(false);
        return;
      }

      /**
       * NOTE ON UPI QR CODE:
       * Razorpay's standard checkout popup automatically renders UPI (with QR code to scan
       * via GPay, PhonePe, Paytm, BHIM, or any UPI app), Cards, and Net Banking tabs.
       * No separate custom QR code canvas or external component is required — it is fully
       * integrated inside this widget.
       */
      const options = {
        key: response.keyId,
        amount: response.amount * 100, // in paise
        currency: response.currency || 'INR',
        name: 'Rameshwar Namkeen',
        description: 'Order Payment',
        order_id: response.razorpayOrderId,
        handler: async function (razorpayResponse) {
          // razorpayResponse contains: razorpay_order_id, razorpay_payment_id, razorpay_signature
          try {
            const verificationResult = await verifyPayment(selectedAddressId, razorpayResponse);
            setPlacedOrderData(verificationResult);
            setCurrentStep(4);
            await refreshCart();
          } catch (verifyErr) {
            // Distinguish post-payment verification failure vs pre-order validation failure
            const errMsg = verifyErr.response?.data?.message;
            if (verifyErr.response?.status === 400 && errMsg?.includes('Invalid payment signature')) {
              setPlaceOrderError('Payment verification failed: invalid signature. Please contact support.');
            } else {
              setPlaceOrderError(
                errMsg || 'Payment was received but order verification failed. Please contact support with your payment reference.'
              );
            }
          } finally {
            setPlacing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#C62828' // brand red
        },
        modal: {
          ondismiss: function () {
            // User closed the popup without paying — neutral notice, stay on Step 3, do NOT create an order
            setPlacing(false);
            setPlaceOrderError('Payment was cancelled. You can try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failureResponse) {
        setPlacing(false);
        setPlaceOrderError(
          failureResponse?.error?.description || 'Payment transaction failed. Please try again or choose another method.'
        );
      });
      rzp.open();
    } catch (err) {
      setPlacing(false);
      setPlaceOrderError(
        err.response?.data?.message || 'Failed to initiate payment. Please check stock or try again.'
      );
    }
  };

  // Guard: if cart is empty and not on confirmation step, show empty state
  if ((!cart?.items || cart.items.length === 0) && currentStep !== 4) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <EmptyState
          message="Your cart is empty. Add products before proceeding to checkout."
          actionLabel="Explore Catalogue"
          onAction={() => navigate('/customer/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-[#C62828] z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${isCompleted
                      ? 'bg-[#C62828] text-white'
                      : isCurrent
                        ? 'bg-[#C62828] text-white ring-4 ring-[#FDECEC]'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${isCurrent ? 'text-[#C62828]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Delivery Address */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 1: Select Delivery Address</h2>
              <p className="text-xs text-gray-500">Choose where you want your fresh namkeen delivered.</p>
            </div>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-[#FDECEC] text-[#C62828] hover:bg-[#8E1B1B] hover:text-white text-xs font-bold rounded-lg transition"
              >
                + Add New Address
              </button>
            )}
          </div>

          {loadingAddresses ? (
            <Loader message="Loading saved addresses..." />
          ) : showAddForm ? (
            <AddressForm
              onSubmit={handleCreateAddress}
              onCancel={addresses.length > 0 ? () => setShowAddForm(false) : null}
              submitting={savingAddress}
            />
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No delivery address saved yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#C62828] text-white text-xs font-bold rounded-lg"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr._id}
                  address={addr}
                  selected={selectedAddressId === addr._id}
                  onSelect={setSelectedAddressId}
                />
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-gray-100">
            <Link
              to="/customer/cart"
              className="text-xs font-semibold text-gray-600 hover:text-black"
            >
              &larr; Back to Cart
            </Link>
            <button
              disabled={!selectedAddressId || showAddForm}
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white font-bold text-sm rounded-xl transition disabled:opacity-40"
            >
              Next: Order Summary &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Order Summary */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Step 2: Review Order Summary</h2>
            <p className="text-xs text-gray-500">Verify items and amounts before choosing payment method.</p>
          </div>

          {/* Items list */}
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
            {cart?.items?.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{item.product?.productName}</h4>
                  <p className="text-xs text-gray-500">
                    Pack: {item.variant?.weight}{item.variant?.unit} &times; {item.quantity} qty
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">₹{item.variant?.sellingPrice} each</span>
                  <span className="text-sm font-black text-gray-900">₹{item.subtotal}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="p-4 bg-[#FFF9F9] rounded-xl border border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-gray-900">₹{cart?.subtotal}</span>
            </div>
            {cart?.cartOfferName && cart?.cartDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold text-xs bg-emerald-50 p-2 rounded-lg">
                <span>Bulk Discount ({cart.cartOfferName}):</span>
                <span>-₹{cart.cartDiscountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-semibold text-emerald-600">
                {cart?.deliveryCharge === 0 ? 'FREE' : `₹${cart?.deliveryCharge}`}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-black text-gray-900">
              <span>Total Payable</span>
              <span className="text-[#C62828] text-xl">₹{cart?.total}</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-gray-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-gray-600 hover:text-black"
            >
              &larr; Back to Address
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white font-bold text-sm rounded-xl transition"
            >
              Next: Payment &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Options */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Step 3: Select Payment Method</h2>
            <p className="text-xs text-gray-500">Choose how you would like to complete your order.</p>
          </div>

          {/* Payment Method Options (4 equal-width bordered boxes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm, BHIM' },
              { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
              { id: 'netbanking', label: 'Net Banking', desc: 'All major Indian banks' },
              { id: 'cod', label: 'Cash on Delivery', desc: 'Pay cash upon delivery' }
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === option.id
                    ? 'border-[#C62828] bg-[#FDECEC] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={paymentMethod === option.id}
                  onChange={() => setPaymentMethod(option.id)}
                  className="mt-1 text-[#C62828] focus:ring-[#C62828]"
                />
                <div className="ml-3">
                  <span className={`font-bold text-sm block ${paymentMethod === option.id ? 'text-[#8E1B1B]' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500">{option.desc}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Disclaimer / Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <p className="font-bold mb-0.5">
              {paymentMethod === 'cod' ? 'Note on Cash on Delivery:' : 'Razorpay Sandbox Mode:'}
            </p>
            <p>
              {paymentMethod === 'cod'
                ? 'Pay cash upon delivery. Your order is confirmed immediately upon clicking Place Order.'
                : 'UPI QR code scanning, test cards, and net banking are powered via the official Razorpay test mode widget. No real money is deducted.'}
            </p>
          </div>

          {/* Error Message if Stock or Order Placement fails */}
          {placeOrderError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
              {placeOrderError}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-gray-100">
            <button
              disabled={placing}
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-gray-600 hover:text-black"
            >
              &larr; Back to Summary
            </button>
            <button
              disabled={placing}
              onClick={handlePlaceOrder}
              className="px-8 py-3 bg-[#C62828] hover:bg-[#8E1B1B] text-white font-black text-sm rounded-xl transition shadow-md disabled:opacity-50"
            >
              {placing ? 'Placing Order...' : `Place Order (₹${cart?.total})`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Order Confirmation */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 shadow-sm text-center space-y-6">
          {placedOrderData?.order ? (
            <>
              {/* Green checkmark */}
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black shadow-inner">
                ✓
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  ORDER PLACED SUCCESSFULLY
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Thank you! Your delicious namkeen order has been recorded and is being prepared.
                </p>
              </div>

              {/* Order details summary */}
              <div className="max-w-lg mx-auto bg-[#FFF9F9] p-5 rounded-xl border border-gray-100 text-left text-xs space-y-2 text-gray-700">
                <div className="flex justify-between pb-1.5 border-b border-gray-200">
                  <span className="font-bold text-gray-500">Order Number:</span>
                  <span className="font-extrabold text-[#C62828] text-sm">
                    {placedOrderData.order.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Customer Name:</span>
                  <span className="font-semibold">{placedOrderData.order.customerSnapshot?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Contact Phone:</span>
                  <span>{placedOrderData.order.customerSnapshot?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Total Amount:</span>
                  <span className="font-black text-gray-900 text-sm">
                    ₹{placedOrderData.order.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Payment Status:</span>
                  <span className="font-bold uppercase text-emerald-700">
                    {placedOrderData.order.paymentStatus}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-500 block mb-0.5">Shipping Address:</span>
                  <p className="text-gray-600 leading-relaxed">
                    {placedOrderData.order.deliveryAddressSnapshot?.houseBuilding},{' '}
                    {placedOrderData.order.deliveryAddressSnapshot?.subAddressArea},{' '}
                    {placedOrderData.order.deliveryAddressSnapshot?.city},{' '}
                    {placedOrderData.order.deliveryAddressSnapshot?.state} -{' '}
                    {placedOrderData.order.deliveryAddressSnapshot?.pincode}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  to={`/customer/orders/${placedOrderData.order._id}/tracking`}
                  className="px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  TRACK ORDER
                </Link>
                <Link
                  to={`/customer/orders/${placedOrderData.order._id}`}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-black text-xs font-bold rounded-xl transition"
                >
                  VIEW ORDER DETAILS
                </Link>
                <Link
                  to="/customer/shop"
                  className="px-5 py-2.5 bg-[#FDECEC] text-[#C62828] hover:bg-[#8E1B1B] hover:text-white text-xs font-bold rounded-xl transition"
                >
                  CONTINUE SHOPPING
                </Link>
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-sm text-gray-600 mb-4">
                No recent order to confirm in active session.
              </p>
              <Link
                to="/customer/orders"
                className="px-5 py-2 bg-[#C62828] text-white text-xs font-bold rounded-lg"
              >
                Go to My Orders
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
