import mongoose from 'mongoose';
import { User } from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';

/**
 * @desc    Get paginated users with optional role, search, and wholesalerStatus filters
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, wholesalerStatus, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (role && ['customer', 'wholesaler', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (wholesalerStatus && filter.role === 'wholesaler') {
      filter.wholesalerStatus = wholesalerStatus;
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNumber - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      User.countDocuments(filter)
    ]);

    return res.status(200).json({
      users,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user details by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active/inactive status (cannot deactivate own admin account)
 * @route   PUT /api/admin/users/:id/active
 * @access  Private (Admin only)
 */
export const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent an admin from deactivating their own account
    if (id === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    const actionText = isActive ? 'Activated user' : 'Deactivated user';
    await logAudit({
      userId: req.user._id,
      action: actionText,
      module: 'Users',
      description: `${actionText} ${user.email} (${user.role})`
    });

    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update wholesaler approval status (pending, approved, rejected, inactive)
 * @route   PUT /api/admin/users/:id/wholesaler-status
 * @access  Private (Admin only)
 */
export const updateWholesalerApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wholesalerStatus } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'inactive'];
    if (!validStatuses.includes(wholesalerStatus)) {
      return res.status(400).json({
        message: `wholesalerStatus must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate target user role is wholesaler
    if (user.role !== 'wholesaler') {
      return res.status(400).json({
        message: 'Cannot update wholesaler status for non-wholesaler account'
      });
    }

    user.wholesalerStatus = wholesalerStatus;
    await user.save();

    let actionName = `Updated wholesaler status to ${wholesalerStatus}`;
    if (wholesalerStatus === 'approved') actionName = 'Approved wholesaler';
    else if (wholesalerStatus === 'rejected') actionName = 'Rejected wholesaler';

    const bizDetails = user.businessName ? ` (${user.businessName})` : '';
    await logAudit({
      userId: req.user._id,
      action: actionName,
      module: 'Users',
      description: `${actionName} for ${user.email}${bizDetails}`
    });

    return res.status(200).json({
      message: `Wholesaler status updated to ${wholesalerStatus}`,
      user
    });
  } catch (error) {
    next(error);
  }
};
