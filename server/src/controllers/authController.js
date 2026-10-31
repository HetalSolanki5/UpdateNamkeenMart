import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    // 1. Email, password, and role received from request body
    const { email, password, role } = req.body;

    // Check if user exists with that email and role
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email, password, or role' });
    }

    // 2. Server checks password (bcrypt compare)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email, password, or role' });
    }

    // 3. If correct, return JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      }
    });

  } catch (error) {
    next(error);
  }
};
