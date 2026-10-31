import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWholesaleOrderById } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const WholesaleOrderDetailPage = () => {
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
        const data = await getWholesaleOrderById(id);
        setOrderData(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Wholesale order not found.');
        } else if (err.response?.status === 403) {
          setError('Access denied. You can only view your own orders.');
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
      <div className="max-w-4xl mx-auto py-12">
        <Loader message="Loading order details..." />
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <EmptyState
          message={error || 'Order details unavailable.'}
          actionLabel="Back to My Orders"
          onAction={() => navigate('/wholesaler/orders')}
        />
      </div>
    );
  }

  const { order, orderItems = [], payment, invoice } = orderData;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb + header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <Link to="/wholesaler/orders" className="hover:text-[#C62828]">← My Orders</Link>
          <span>/</span>
          <span>{order.orderNumber}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/wholesaler/orders/${order._id}/tracking`}
              className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition"
            >
              Track Order
            </Link>
            <Link
              to={`/wholesaler/invoices/${order._id}`}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-black text-xs font-bold rounded-lg transition"
            >
              View Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Status highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Order Status</span>
          <StatusBadge status={order.orderStatus} type="order" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Payment Status</span>
          <StatusBadge status={order.paymentStatus} type="payment" />
          {payment?.method && (
            <span className="text-[10px] text-gray-500 block mt-0.5">
              via {payment.method.toUpperCase()}
            </span>
          )}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Total Amount</span>
          <span className="text-base font-black text-gray-900">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main grid: items + sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Items list */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            Items Ordered ({orderItems.length})
          </h3>
          <div className="divide-y divide-gray-100">
            {orderItems.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.productNameSnapshot}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × ₹{item.wholesaleUnitPrice}
                  </p>
                </div>
                <span className="text-sm font-black text-gray-900">
                  ₹{item.subtotal?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
          {/* Pricing breakdown */}
          <div className="pt-3 border-t border-gray-100 text-xs space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-emerald-600">
                {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-[#C62828] text-base">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar: invoice info */}
        <div className="space-y-4">
          {invoice && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-xs space-y-2">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Invoice Info
              </h3>
              <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
              <p>
                <strong>Date:</strong>{' '}
                {invoice.invoiceDate
                  ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN')
                  : '—'}
              </p>
              <Link
                to={`/wholesaler/invoices/${order._id}`}
                className="inline-block mt-1 text-[#C62828] font-bold hover:underline"
              >
                Open Full Invoice →
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
              Quick Actions
            </h3>
            <Link
              to={`/wholesaler/orders/${order._id}/tracking`}
              className="block w-full text-center py-2 text-xs font-bold text-[#C62828] border border-[#C62828]/30 rounded-lg hover:bg-[#FDECEC] transition"
            >
              Track This Order
            </Link>
            <Link
              to={`/wholesaler/invoices/${order._id}`}
              className="block w-full text-center py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              View / Download Invoice
            </Link>
            <Link
              to="/wholesaler/orders"
              className="block w-full text-center py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              ← Back to All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleOrderDetailPage;
