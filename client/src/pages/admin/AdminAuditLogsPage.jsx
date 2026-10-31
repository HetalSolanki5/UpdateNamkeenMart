import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../api/adminApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'Users', label: 'Users' },
  { value: 'Categories', label: 'Categories' },
  { value: 'Products', label: 'Products' },
  { value: 'Stock', label: 'Stock' },
  { value: 'Orders', label: 'Orders' },
  { value: 'Reviews', label: 'Reviews' }
];

const AdminAuditLogsPage = () => {
  const [selectedModule, setSelectedModule] = useState('');
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20
      };
      if (selectedModule) params.module = selectedModule;

      const res = await getAuditLogs(params);
      // Handles both { auditLogs: [...], total } and { logs: [...], totalResults } shapes
      const items = res?.auditLogs || res?.logs || [];
      const totalResults = res?.total || res?.totalResults || items.length;
      const totalPages = res?.totalPages || Math.ceil(totalResults / 20) || 1;

      setLogs(items);
      setPagination({ totalPages, totalResults });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule, page]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">System Audit Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable tracking timeline of all admin modifications and sensitive system actions.
          </p>
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-2 self-start">
          <label className="text-xs font-bold text-gray-500 uppercase">Module:</label>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white font-medium focus:outline-hidden focus:border-[#C62828] transition"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message="Loading audit trail..." />
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl text-center">
          <p className="font-bold mb-1">Error Loading Logs</p>
          <p className="text-xs mb-3">{error}</p>
          <button
            onClick={fetchLogs}
            className="px-4 py-1.5 bg-[#C62828] text-white text-xs font-semibold rounded-lg hover:bg-[#8E1B1B] transition"
          >
            Retry
          </button>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          message="No activity recorded yet."
          actionLabel={selectedModule ? 'Clear Module Filter' : undefined}
          onAction={selectedModule ? () => setSelectedModule('') : undefined}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-6">
          {/* Vertical timeline */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {logs.map((log, idx) => {
              const adminName = log.userId?.name || 'Administrator';
              const adminEmail = log.userId?.email ? ` (${log.userId.email})` : '';
              const timeFormatted = log.createdAt
                ? new Date(log.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              return (
                <div key={log._id || idx} className="relative group">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#C62828] group-hover:bg-[#C62828] transition" />

                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-4 transition hover:bg-gray-50 hover:border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-gray-900">{log.action}</span>
                        {log.module && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDECEC] text-[#C62828] border border-[#C62828]/20 uppercase">
                            {log.module}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {timeFormatted}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 font-normal leading-relaxed mb-2">
                      {log.description}
                    </p>

                    <div className="text-[11px] text-gray-400 font-medium">
                      By: <span className="text-gray-600 font-semibold">{adminName}</span>
                      {adminEmail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
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

export default AdminAuditLogsPage;
