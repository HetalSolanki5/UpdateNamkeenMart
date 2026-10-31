import { body } from 'express-validator';

export const registerCustomerRules = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone is required').matches(/^(\+91)?[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  // Optional address validation
  body('address.pincode').optional().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Pincode must be 6 digits')
];

export const registerWholesalerRules = [
  ...registerCustomerRules,
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('gstNumber').optional().isLength({ min: 15, max: 15 }).withMessage('GST number must be 15 characters if provided')
];

export const loginRules = [
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').notEmpty().withMessage('Role is required').isIn(['customer', 'wholesaler', 'admin']).withMessage('Role must be customer, wholesaler, or admin')
];
