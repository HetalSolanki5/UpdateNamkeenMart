import express from 'express';
import { 
  registerCustomer, 
  registerWholesaler, 
  login, 
  logout, 
  getMe,
  customerOnly,
  wholesalerOnly,
  adminOnly
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { registerCustomerRules, registerWholesalerRules, loginRules } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register/customer', registerCustomerRules, validate, registerCustomer);
router.post('/register/wholesaler', registerWholesalerRules, validate, registerWholesaler);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Test role routes
router.get('/test/customer', protect, authorize('customer'), customerOnly);
router.get('/test/wholesaler', protect, authorize('wholesaler'), wholesalerOnly);
router.get('/test/admin', protect, authorize('admin'), adminOnly);

export default router;
