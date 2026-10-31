import express from 'express';
import {
  checkoutOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Customer checkout & orders list
router.post('/', authorize('customer'), checkoutOrder);
router.get('/', authorize('customer'), getMyOrders);

// View order detail & tracking (ownership checked inside controller/service)
router.get('/:id', getOrderById);
router.get('/:id/tracking', getOrderTracking);

// Admin status update (with automatic stock rollback on cancellation)
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;
