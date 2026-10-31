import { AuditLog } from '../../models/index.js';

/**
 * @desc    Get audit logs with pagination and optional module filter
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin only)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { module, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (module && module.trim() !== '') {
      filter.module = module.trim();
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNumber - 1) * pageSize;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      AuditLog.countDocuments(filter)
    ]);

    return res.status(200).json({
      auditLogs: logs,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
};
