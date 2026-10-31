import { User } from '../../models/index.js';
import { logAudit } from '../../utils/auditLogger.js';

/**
 * @desc    Create a new admin account (controlled admin creation by an existing admin)
 * @route   POST /api/admin/users/admins
 * @access  Private (Admin only)
 */
export const createAdminAccount = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create User with role: 'admin', isActive: true
    const newAdmin = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      isActive: true
    });

    // Log the administrative action
    await logAudit({
      userId: req.user._id,
      action: 'Created admin account',
      module: 'Users',
      description: `Created admin account for ${email}`
    });

    // Return 201 without password (automatically excluded via User model toJSON transform)
    return res.status(201).json({
      message: 'Admin account created',
      user: newAdmin
    });
  } catch (error) {
    next(error);
  }
};
