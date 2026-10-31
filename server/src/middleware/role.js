// Middleware to authorize roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if req.user.role is in allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Proceed if authorized
    next();
  };
};
