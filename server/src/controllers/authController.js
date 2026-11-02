
import * as authService from '../services/authServices.js';
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(
      req.body,
      req.body.role || 'customer'
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user
    });
  } catch (error) {
    const status =
      error.code === 11000
        ? 409
        : error.message === 'Email is already registered'
          ? 409
          : 400;

    return res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? 'Email is already registered'
          : error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    const status =
      error.message === 'JWT_SECRET is not configured' ? 500 : 401;

    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured'
      });
    }

    const token = authorization.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await authService.getUserById(decoded.userId);

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authController = {
  register,
  login,
  getMe
};

export default authController;
