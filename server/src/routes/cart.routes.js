import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All cart routes require login and customer role
router.use(protect, authorize('customer'));

// GET / - Get current user cart
router.get('/', getCart);

// POST / - Add item to cart
router.post('/', addToCart);

// PUT /:itemId - Update quantity of a cart item
router.put('/:itemId', updateCartItem);

// DELETE /:itemId - Remove one cart item
router.delete('/:itemId', removeCartItem);

// DELETE / - Clear entire cart
router.delete('/', clearCart);

export default router;
