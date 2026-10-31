import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';

// Protect middleware to verify token and fetch user
export const protect = async (req, res, next) => {
  let token;

  // Read the header "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If there is no token, return 401
  if (!token) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    // Verify the token with jsonwebtoken
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Load the user from the database by decoded.id
    const user = await User.findById(decoded.id);

    // If user not found or user.isActive is false, return 401
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not allowed' });
    }

    // Attach the user to req.user and call next()
    req.user = user;
    next();
  } catch (error) {
    // If invalid or expired, return 401
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
