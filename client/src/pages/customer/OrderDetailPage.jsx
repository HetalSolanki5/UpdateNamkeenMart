import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById } from '../../api/orderApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrderById(id);
        setOrderData(data);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access denied. You can only view orders placed by your account.');
        } else if (err.response?.status === 404) {
          setError('Order not found.');
        } else {
          setError(err.response?.data?.message || 'Failed to load order details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Loader message="Loading order details..." />
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <EmptyState
          message={error || 'Order details unavailable.'}
          actionLabel="Back to My Orders"
          onAction={() => navigate('/customer/orders')}
        />
      </div>
    );
  }

  const { order, orderItems = [], payment, invoice } = orderData;
  const addr = order.deliveryAddressSnapshot || {};

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/customer/orders" className="hover:text-[#C62828]">&larr; My Orders</Link>
            <span>/</span>
            <span>{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <Link
            to={`/customer/orders/${order._id}/tracking`}
            className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            Track Order
          </Link>
          <Link
            to={`/customer/invoices/${order._id}`}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-black text-xs font-bold rounded-lg transition"
          >
            View Invoice
          </Link>
        </div>
      </div>

      {/* Status Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">
            Order Status
          </span>
          <span className="text-sm font-black uppercase text-[#C62828]">
            {order.orderStatus.replace('_', ' ')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">
            Payment Status
          </span>
          <span
            className={`text-sm font-black uppercase ${
              order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {order.paymentStatus} ({payment?.method?.toUpperCase() || 'N/A'})
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">
            Total Amount
          </span>
          <span className="text-sm font-black text-gray-900">
            ₹{order.totalAmount}
          </span>
        </div>
      </div>

      {/* Main Grid: Items + Delivery Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ordered Items Table */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            Items Ordered ({orderItems.length})
          </h3>

          <div className="divide-y divide-gray-100">
            {orderItems.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {item.productNameSnapshot}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {item.variantSnapshot} &times; {item.quantity} qty
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">₹{item.unitPrice} each</span>
                  <span className="text-sm font-bold text-gray-900">₹{item.subtotal}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-3 border-t border-gray-100 text-xs space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ₹{order.totalAmount + (order.cartDiscountAmount || 0) - (order.deliveryCharge || 0)}
              </span>
            </div>

            {order.appliedCartOfferName && order.cartDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Bulk Order Discount ({order.appliedCartOfferName}):</span>
                <span>-₹{order.cartDiscountAmount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-emerald-600">
                {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Paid / Payable:</span>
              <span className="text-[#C62828] text-base">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Customer Snapshot */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 mb-3">
              Delivery Details
            </h3>
            <div className="text-xs text-gray-600 space-y-1.5">
              <p className="font-bold text-gray-800 text-sm">{addr.receiverName}</p>
              <p className="text-gray-700">Phone: {addr.phoneNumber}</p>
              <p className="pt-1 text-gray-600 leading-relaxed">
                {addr.houseBuilding}, {addr.subAddressArea}
                {addr.landmark ? `, Landmark: ${addr.landmark}` : ''}
              </p>
              <p>
                {addr.city}, {addr.state} - <span className="font-semibold text-gray-800">{addr.pincode}</span>
              </p>
            </div>
          </div>

          {/* Invoice Snapshot */}
          {invoice && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-xs text-gray-600 space-y-2">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Tax Invoice Info
              </h3>
              <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
              <Link
                to={`/customer/invoices/${order._id}`}
                className="inline-block mt-1 text-[#C62828] font-bold hover:underline"
              >
                Open Full Tax Invoice &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
