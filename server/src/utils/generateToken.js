import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Export a function generateToken(user) that signs a JWT
const generateToken = (user) => {
  // Sign with payload { id: user._id, role: user.role }
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export default generateToken;
