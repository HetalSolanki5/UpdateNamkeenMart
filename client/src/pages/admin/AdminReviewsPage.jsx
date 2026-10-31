import React, { useState, useEffect } from 'react';
import {
  getAdminReviews,
  approveReview,
  hideReview,
  deleteReview
} from '../../api/adminReviewApi.js';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const AdminReviewsPage = () => {
  // Filter: 'all' | 'approved' | 'pending'
  const [filterTab, setFilterTab] = useState('all');
  const [page, setPage] = useState(1);

  // Data state
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10
      };

      if (filterTab === 'approved') params.isApproved = true;
      if (filterTab === 'pending') params.isApproved = false;

      const res = await getAdminReviews(params);
      setReviews(res?.reviews || []);
      setPagination({
        totalPages: res?.totalPages || 1,
        totalResults: res?.totalResults || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterTab, page]);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      await approveReview(id);
      setFeedback({ type: 'success', message: 'Review approved successfully.' });
      fetchReviews();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve review.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHide = async (id) => {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      await hideReview(id);
      setFeedback({ type: 'success', message: 'Review hidden successfully.' });
      fetchReviews();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to hide review.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this review permanently?');
    if (!confirmed) return;

    setActionLoadingId(id);
    setFeedback(null);
    try {
      await deleteReview(id);
      setFeedback({ type: 'success', message: 'Review deleted permanently.' });
      fetchReviews();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete review.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render gold star icons for rating (1 to 5)
  const renderStars = (rating = 0) => {
    const num = Math.min(5, Math.max(1, Math.round(rating)));
    return (
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= num ? 'fill-current' : 'text-gray-200 fill-current'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Product Reviews</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Moderate, approve, and manage customer product ratings and reviews.
          </p>
        </div>
        <div className="text-xs text-gray-500 font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs self-start">
          Total Reviews: <span className="text-gray-900 font-black">{pagination.totalResults}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setFilterTab('all');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterTab === 'all'
              ? 'bg-[#C62828] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Reviews
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterTab('approved');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterTab === 'approved'
              ? 'bg-[#C62828] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterTab('pending');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterTab === 'pending'
              ? 'bg-[#C62828] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending Moderation
        </button>
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

      {/* Content Area */}
      {loading ? (
        <Loader message="Loading reviews..." />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-1">Error Loading Reviews</p>
          <p className="text-xs mb-3">{error}</p>
          <button
            onClick={fetchReviews}
            className="px-4 py-1.5 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="w-14 h-14 mb-3 rounded-full bg-[#FDECEC] flex items-center justify-center text-[#C62828]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">No reviews yet</h3>
          <p className="text-xs text-gray-500 max-w-md">
            Reviews will appear here once customers start submitting ratings and comments for products.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 max-w-xs">Comment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((r) => {
                  const customerName = r.userId?.name || 'Customer';
                  const productName = r.productId?.productName || 'Namkeen Product';
                  const reviewDate = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—';
                  const isBusy = actionLoadingId === r._id;

                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {customerName}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {productName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStars(r.rating)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs break-words">
                        {r.comment || <span className="italic text-gray-400">No comment</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {reviewDate}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={r.isApproved ? 'approved' : 'pending'}
                          type="review"
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!r.isApproved ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApprove(r._id)}
                              className="px-2.5 py-1 rounded text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleHide(r._id)}
                              className="px-2.5 py-1 rounded text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition"
                            >
                              Hide
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDelete(r._id)}
                            className="px-2.5 py-1 rounded text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs">
              <span className="text-gray-500 font-medium">
                Page <span className="font-bold text-gray-800">{page}</span> of{' '}
                <span className="font-bold text-gray-800">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
