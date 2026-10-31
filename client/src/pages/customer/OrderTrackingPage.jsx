import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderTracking } from '../../api/orderApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const OrderTrackingPage = () => {
  const { id } = useParams();

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrderTracking(id);
        setTrackingData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch order tracking.');
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/customer/orders" className="hover:text-[#C62828]">&larr; My Orders</Link>
            <span>/</span>
            <Link to={`/customer/orders/${id}`} className="hover:text-[#C62828]">{orderNumber}</Link>
            <span>/</span>
            <span>Tracking</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Track Order #{orderNumber}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status updates from our kitchen and delivery team.
          </p>
        </div>

        <Link
          to={`/customer/orders/${id}`}
          className="text-xs font-bold text-[#C62828] hover:underline self-start sm:self-auto"
        >
          View Full Order Details &rarr;
        </Link>
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

      {/* Tracking Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Current Status</span>
            <span className="text-lg font-black text-gray-900 uppercase">
              {currentStatus?.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs font-medium text-gray-500 max-w-xs text-right">
            {note}
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="pt-6 relative">
          <div className="space-y-8 pl-4 sm:pl-8 relative before:absolute before:inset-0 before:left-[19px] sm:before:left-[35px] before:w-0.5 before:bg-gray-200 before:z-0">
            {timeline.map((step, idx) => {
              const isDone = step.state === 'done';
              const isCurrent = step.state === 'current';
              const isUpcoming = step.state === 'upcoming';

              return (
                <div key={idx} className="relative z-10 flex items-start space-x-4">
                  {/* Step Marker */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      isDone
                        ? 'bg-[#C62828] text-white shadow-sm'
                        : isCurrent
                        ? isCancelled
                          ? 'bg-red-600 text-white ring-4 ring-red-100'
                          : 'bg-[#C62828] text-white ring-4 ring-[#FDECEC] animate-pulse'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isDone ? '✓' : isCurrent ? '●' : idx + 1}
                  </div>

                  {/* Step Content */}
                  <div className="pt-1">
                    <h4
                      className={`text-sm font-bold capitalize ${
                        isCurrent
                          ? 'text-[#C62828]'
                          : isDone
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label || step.status?.replace('_', ' ')}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isDone
                        ? 'Step completed'
                        : isCurrent
                        ? isCancelled
                          ? 'Order stopped & cancelled'
                          : 'In progress currently'
                        : 'Upcoming step'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
