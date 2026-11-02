import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderTracking, getOrderById } from '../../api/orderApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

// Standard 7-stage order progression steps
const DEFAULT_STEPS = [
  {
    status: 'placed',
    label: 'Order Placed',
    desc: 'We have received your order and details.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    desc: 'Order verified by Rameshwar Namkeen kitchen.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    status: 'processing',
    label: 'Cooking & Preparation',
    desc: 'Fresh batches of authentic namkeens being prepared.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    status: 'packed',
    label: 'Quality Packed',
    desc: 'Airtight packaging sealed to preserve freshness.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  {
    status: 'shipped',
    label: 'Dispatched / In Transit',
    desc: 'Handed over to delivery courier network.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    desc: 'Courier executive is on the way to your delivery address.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    )
  },
  {
    status: 'delivered',
    label: 'Delivered',
    desc: 'Package delivered safely to your doorstep.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
];

const OrderTrackingPage = () => {
  const { id } = useParams();

  const [trackingData, setTrackingData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      try {
        const [trackingRes, orderRes] = await Promise.allSettled([
          getOrderTracking(id),
          getOrderById(id)
        ]);

        if (trackingRes.status === 'fulfilled') {
          setTrackingData(trackingRes.value);
        } else if (orderRes.status === 'fulfilled' && orderRes.value?.order) {
          // Graceful fallback from order details if tracking endpoint fails
          const ord = orderRes.value.order;
          setTrackingData({
            orderId: ord._id,
            orderNumber: ord.orderNumber,
            currentStatus: ord.orderStatus,
            isCancelled: ord.orderStatus === 'cancelled',
            note: `Order is ${ord.orderStatus}.`,
            timeline: []
          });
        } else {
          throw new Error('Failed to load tracking data.');
        }

        if (orderRes.status === 'fulfilled') {
          setOrderDetails(orderRes.value);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order tracking.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Loader message="Tracking your order..." />
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <EmptyState message={error || 'Tracking details not available.'} />
      </div>
    );
  }

  const { orderNumber, currentStatus, isCancelled, note, timeline = [] } = trackingData;
  const orderObj = orderDetails?.order;
  const address = orderObj?.deliveryAddressSnapshot;

  // Build the unified timeline using either server timeline or standard DEFAULT_STEPS
  const orderStatusKey = currentStatus || 'placed';
  const currentIndex = DEFAULT_STEPS.findIndex((s) => s.status === orderStatusKey);

  const displayTimeline = isCancelled
    ? [
        { status: 'placed', label: 'Order Placed', desc: 'Order was created', state: 'done' },
        { status: 'cancelled', label: 'Order Cancelled', desc: 'Order was cancelled and inventory restored', state: 'current' }
      ]
    : DEFAULT_STEPS.map((step, idx) => {
        let state = 'upcoming';
        if (currentIndex !== -1) {
          if (idx < currentIndex) state = 'done';
          else if (idx === currentIndex) state = 'current';
        } else {
          // Check if server timeline has this status
          const serverStep = timeline.find((t) => t.status === step.status);
          if (serverStep) state = serverStep.state;
          else if (idx === 0) state = 'done';
        }

        return {
          ...step,
          state
        };
      });

  // Calculate approximate percentage progress
  const activeStepNum = currentIndex !== -1 ? currentIndex + 1 : 1;
  const progressPercent = isCancelled
    ? 100
    : Math.min(100, Math.round(((activeStepNum - 1) / (DEFAULT_STEPS.length - 1)) * 100));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/customer/orders" className="hover:text-[#C62828]">&larr; My Orders</Link>
            <span>/</span>
            <Link to={`/customer/orders/${id}`} className="hover:text-[#C62828]">#{orderNumber}</Link>
            <span>/</span>
            <span>Live Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Track Order #{orderNumber}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status updates from our kitchen and delivery logistics team.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/customer/orders/${id}`}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-[#C62828] text-gray-700 hover:text-[#C62828] text-xs font-bold rounded-xl transition shadow-xs"
          >
            Order Details
          </Link>
          <Link
            to={`/customer/invoices/${id}`}
            className="px-4 py-2 bg-[#FDECEC] hover:bg-[#ffdada] text-[#C62828] text-xs font-bold rounded-xl transition shadow-xs"
          >
            View Invoice
          </Link>
        </div>
      </div>

      {/* Cancelled Banner if applicable */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs">
          <span className="text-base font-bold text-red-600">⚠</span>
          <div>
            <p className="font-bold text-sm">This order was cancelled</p>
            <p className="mt-0.5 text-red-700">
              {note || 'This order was cancelled. Any reserved or allocated inventory has been restored.'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        {/* Top Status & Estimate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C62828] block mb-1">
              Current Shipment Status
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-gray-900 uppercase">
                {currentStatus?.replace(/_/g, ' ')}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                isCancelled
                  ? 'bg-red-100 text-red-700'
                  : currentStatus === 'delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isCancelled ? 'Cancelled' : currentStatus === 'delivered' ? 'Completed' : 'On Track'}
              </span>
            </div>
            {orderObj?.createdAt && (
              <span className="text-xs text-gray-400 block mt-1">
                Ordered on {new Date(orderObj.createdAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 block">Expected Delivery</span>
            <span className="text-base font-bold text-gray-800">
              {currentStatus === 'delivered'
                ? 'Delivered to recipient'
                : 'Within 2–4 Business Days'}
            </span>
            <span className="text-[11px] text-gray-400 block">Express Delivery via Ground Logistics</span>
          </div>
        </div>

        {/* Horizontal Progress Bar (Desktop) */}
        {!isCancelled && (
          <div className="py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
              <span>Order Placed</span>
              <span>Overall Progress ({progressPercent}%)</span>
              <span>Doorstep Delivery</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#C62828] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Detailed Timeline Steps */}
        <div className="pt-4 relative">
          <div className="space-y-6 sm:space-y-8 pl-4 sm:pl-8 relative before:absolute before:inset-0 before:left-[19px] sm:before:left-[35px] before:w-0.5 before:bg-gray-200 before:z-0">
            {displayTimeline.map((step, idx) => {
              const isDone = step.state === 'done';
              const isCurrent = step.state === 'current';
              const isUpcoming = step.state === 'upcoming';

              return (
                <div key={idx} className="relative z-10 flex items-start space-x-4 group">
                  {/* Step Marker */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all shadow-xs ${
                      isDone
                        ? 'bg-[#C62828] text-white'
                        : isCurrent
                        ? isCancelled
                          ? 'bg-red-600 text-white ring-4 ring-red-100'
                          : 'bg-[#C62828] text-white ring-4 ring-[#FDECEC] animate-pulse'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      '●'
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="pt-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm sm:text-base font-bold capitalize ${
                          isCurrent
                            ? 'text-[#C62828]'
                            : isDone
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'text-emerald-700 bg-emerald-50'
                            : isCurrent
                            ? 'text-[#C62828] bg-[#FDECEC]'
                            : 'text-gray-400'
                        }`}
                      >
                        {isDone ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.desc || (isDone ? 'Step completed.' : isCurrent ? 'Under active processing.' : 'Pending upcoming step.')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery Destination & Summary Snippet */}
      {address && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-semibold">Delivery Destination</span>
              <h4 className="font-bold text-gray-900 text-sm">{address.receiverName || 'Customer'}</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {[address.houseBuilding, address.subAddressArea, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {address.phoneNumber && (
                <span className="text-xs text-gray-400 block mt-0.5">Contact: {address.phoneNumber}</span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <span className="text-xs text-gray-400 block font-semibold">Payment</span>
            <span className="text-sm font-black text-gray-900">₹{orderObj?.totalAmount}</span>
            <span className="text-xs text-emerald-600 block uppercase font-bold mt-0.5">
              {orderObj?.paymentStatus} ({orderDetails?.payment?.method?.toUpperCase() || 'COD'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
