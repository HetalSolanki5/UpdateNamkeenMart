import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAdminWholesaleOrderById,
  updateWholesaleOrderStatus
} from '../../api/adminOrderApi.js';
import OrderStatusUpdater from '../../components/admin/OrderStatusUpdater.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Loader from '../../components/Loader.jsx';

const AdminWholesaleOrderDetailPage = () => {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminWholesaleOrderById(id);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wholesale order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    setFeedback(null);
    try {
      await updateWholesaleOrderStatus(id, newStatus);
      setFeedback({
        type: 'success',
        message: `Wholesale order status successfully updated to "${newStatus.replace(/_/g, ' ')}".`
      });
      // Refresh order data
      const refreshed = await getAdminWholesaleOrderById(id);
      setData(refreshed);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update wholesale order status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <Loader message="Loading wholesale order details..." />;
  }

  if (error || !data || !data.order) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          to="/admin/wholesale-orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C62828] hover:underline"
        >
          ← Back to Wholesale Orders
        </Link>
        <div className="p-8 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold text-base mb-1">Wholesale Order Not Found</p>
          <p className="text-xs mb-4">{error || 'Unable to retrieve order details.'}</p>
          <button
            onClick={fetchOrderDetail}
            className="px-4 py-2 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { order, orderItems = [], payment, invoice } = data;
  const wholesaler = order.wholesalerId || order.userId || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top navigation & title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            to="/admin/wholesale-orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#C62828] hover:underline mb-1"
          >
            ← Back to Wholesale Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-900">
              Wholesale Order #{order.orderNumber || order._id}
            </h1>
            <StatusBadge status={order.orderStatus} type="order" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Placed on{' '}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '—'}
          </p>
        </div>

        {/* Invoice reference badge */}
        {invoice && (
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 self-start">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Invoice #{invoice.invoiceNumber || invoice._id}
            </span>
          </div>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Order Status Updater Component (orderType="wholesale") */}
      <OrderStatusUpdater
        currentStatus={order.orderStatus}
        orderType="wholesale"
        onUpdate={handleStatusUpdate}
        updating={updatingStatus}
      />

      {/* Wholesaler business snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Business Profile */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Wholesaler / Business Profile
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Business / Company Name</span>
              <span className="text-gray-900 font-black text-sm">
                {wholesaler.businessName || wholesaler.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Contact Person</span>
              <span className="text-gray-800 font-semibold">{wholesaler.name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Email Address</span>
              <span className="text-gray-800 font-medium">{wholesaler.email || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Phone Number</span>
              <span className="text-gray-800 font-medium">{wholesaler.phone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Tax and Compliance */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Tax & Wholesale Credentials
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">GST Number</span>
              <span className="text-gray-900 font-mono font-bold text-sm">
                {wholesaler.gstNumber || 'Unregistered / Not Provided'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">PAN Number</span>
              <span className="text-gray-800 font-mono font-semibold">
                {wholesaler.panNumber || '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Wholesaler Approval Status</span>
              <div className="mt-1">
                <StatusBadge status={wholesaler.wholesalerStatus || 'approved'} type="wholesaler" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wholesale Items List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Wholesale Order Items ({orderItems.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Item / Variant</th>
                <th className="py-2.5 px-3 text-center">Unit Bulk Price</th>
                <th className="py-2.5 px-3 text-center">Qty (Packs)</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderItems.map((item, idx) => {
                const title =
                  item.productNameSnapshot ||
                  item.variantSnapshot?.productName ||
                  item.productId?.productName ||
                  'Bulk Namkeen Pack';
                const weight =
                  item.weightSnapshot ||
                  (item.variantSnapshot?.weightInGrams
                    ? `${item.variantSnapshot.weightInGrams}g`
                    : '');
                const price = item.pricePerUnit || item.price || 0;
                const lineTotal = item.totalPrice || price * (item.quantity || 1);

                return (
                  <tr key={item._id || idx}>
                    <td className="py-3 px-3">
                      <p className="font-bold text-gray-900">{title}</p>
                      {weight && <p className="text-[11px] text-gray-500">{weight}</p>}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-700">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-gray-900">
                      ₹{Number(lineTotal).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-end gap-1.5 text-xs">
          <div className="flex justify-between w-64 text-gray-600">
            <span>Delivery / Freight Charge:</span>
            <span className="font-semibold">
              ₹{Number(order.deliveryCharge || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black text-gray-900 pt-1 border-t border-gray-100">
            <span>Total Wholesale Amount:</span>
            <span className="text-[#C62828]">
              ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Payment details snapshot */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Payment Information
        </h2>
        {payment ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Method</span>
              <span className="text-gray-800 font-bold uppercase">{payment.method || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Payment Status</span>
              <div className="mt-1">
                <StatusBadge status={payment.status || order.paymentStatus} type="payment" />
              </div>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Amount</span>
              <span className="text-gray-900 font-black">
                ₹{Number(payment.amount || order.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Transaction ID</span>
              <span className="text-gray-600 font-mono text-[11px]">
                {payment.transactionId || 'N/A (Credit/COD)'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Payment Status</span>
              <div className="mt-1">
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
            </div>
            <p className="text-gray-500 italic text-xs">
              No detailed payment transaction record logged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWholesaleOrderDetailPage;
