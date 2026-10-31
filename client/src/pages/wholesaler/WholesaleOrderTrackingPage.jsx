import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWholesaleOrderTracking } from '../../api/wholesaleApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

/**
 * WholesaleOrderTrackingPage
 *
 * Uses the same visual timeline pattern as the customer OrderTrackingPage,
 * but the wholesale order status enum is:
 *   pending → confirmed → processing → packed → shipped → delivered | cancelled
 * (No "out_for_delivery" step — this is NOT the same as the customer order enum.)
 * The actual steps are driven by what the tracking endpoint returns.
 */
const WholesaleOrderTrackingPage = () => {
  const { id } = useParams();

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWholesaleOrderTracking(id);
        setTrackingData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tracking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Loader message="Tracking your wholesale order..." />
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <EmptyState message={error || 'Tracking details not available.'} />
      </div>
    );
  }

  const { orderNumber, orderStatus, timeline = [] } = trackingData;

  // Check if cancelled from the status or from the timeline
  const isCancelled = orderStatus === 'cancelled' ||
    timeline.some((s) => s.state === 'current' && s.step?.toLowerCase() === 'cancelled');

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <Link to="/wholesaler/orders" className="hover:text-[#C62828]">← My Orders</Link>
          <span>/</span>
          <Link to={`/wholesaler/orders/${id}`} className="hover:text-[#C62828]">{orderNumber}</Link>
          <span>/</span>
          <span>Tracking</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Track Order #{orderNumber}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status updates from our processing team.
            </p>
          </div>
          <Link
            to={`/wholesaler/orders/${id}`}
            className="text-xs font-bold text-[#C62828] hover:underline self-start sm:self-auto"
          >
            View Full Order →
          </Link>
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs">
          <span className="text-base font-bold text-red-600">⚠</span>
          <div>
            <p className="font-bold text-sm">This order was cancelled</p>
            <p className="mt-0.5 text-red-700">
              Any allocated stock has been restored.
            </p>
          </div>
        </div>
      )}

      {/* Tracking timeline card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Current Status</span>
            <span className="text-lg font-black text-gray-900 uppercase">
              {(orderStatus || '').replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 ? (
          <div className="pt-4 relative">
            <div className="space-y-7 pl-4 sm:pl-8 relative before:absolute before:inset-0 before:left-[19px] sm:before:left-[35px] before:w-0.5 before:bg-gray-200 before:z-0">
              {timeline.map((step, idx) => {
                const isDone = step.state === 'done';
                const isCurrent = step.state === 'current';

                return (
                  <div key={idx} className="relative z-10 flex items-start space-x-4">
                    {/* Step marker */}
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

                    {/* Step content */}
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
                        {/* Use step.label or step.step as the label */}
                        {step.label || (step.step || '').replace(/_/g, ' ')}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isDone
                          ? 'Completed'
                          : isCurrent
                          ? isCancelled
                            ? 'Order stopped & cancelled'
                            : 'Currently in progress'
                          : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">
            Tracking timeline not available for this order.
          </p>
        )}
      </div>
    </div>
  );
};

export default WholesaleOrderTrackingPage;
