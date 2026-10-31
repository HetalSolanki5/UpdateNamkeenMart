import { AuditLog } from '../models/index.js';

/**
 * Log an administrative action to the AuditLog collection.
 * 
 * Design choice: Wrap in try/catch and only console.warn on error.
 * An audit log failure should NEVER block the actual administrative action from completing.
 * System availability and state consistency for business-critical operations (like creating
 * users, updating products, or altering stock) must not fail merely because a secondary logging
 * task encountered an error.
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Admin performing the action
 * @param {string} params.action - Action name (e.g. 'Created category')
 * @param {string} params.module - Module/domain (e.g. 'Users', 'Categories', 'Products', 'Stock')
 * @param {string} [params.description] - Additional context/details
 */
export const logAudit = async ({ userId, action, module, description }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      module,
      description
    });
  } catch (error) {
    console.warn(`[AuditLog Warning] Failed to log audit event (${action} - ${module}):`, error.message);
  }
};

export default logAudit;
