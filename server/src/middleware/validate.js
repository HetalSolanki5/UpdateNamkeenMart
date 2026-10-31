import { validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map errors to { field, message } format
    const formattedErrors = errors.array().map(err => ({ field: err.path, message: err.msg }));
    return res.status(400).json({ message: 'Validation failed', errors: formattedErrors });
  }
  // Otherwise call next()
  next();
};
