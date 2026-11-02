import express from 'express';
import {
  checkoutOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  updateOrderStatus,
  initiateCheckout,
  verifyPayment
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

// ── Phase 5D-A: Two-step Razorpay checkout routes ────────────────────────────
// POST /api/orders/initiate — Step 1: validate cart & get Razorpay order ID (or place COD order directly)
// POST /api/orders/verify   — Step 2: verify Razorpay signature & create the order in MongoDB
// These must be defined BEFORE the dynamic /:id routes so Express doesn't
// treat "initiate" or "verify" as an order ObjectId.
router.post('/initiate', authorize('customer'), initiateCheckout);
router.post('/verify', authorize('customer'), verifyPayment);

// ── Existing routes (unchanged) ───────────────────────────────────────────────
// Customer checkout & orders list
// NOTE: POST / (checkoutOrder) is kept for backwards compatibility and COD-only
// direct testing. The frontend will migrate to /initiate + /verify in the next phase.
router.post('/', authorize('customer'), checkoutOrder);
router.get('/', authorize('customer'), getMyOrders);

// View order detail & tracking (ownership checked inside controller/service)
router.get('/:id', getOrderById);
router.get('/:id/tracking', getOrderTracking);

// Admin status update (with automatic stock rollback on cancellation)
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;
