import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All wishlist routes require login and customer role
router.use(protect, authorize('customer'));

// GET / - Retrieve user's wishlist
router.get('/', getWishlist);

// POST / - Add product to wishlist
router.post('/', addToWishlist);

// DELETE /:productId - Remove product from wishlist
router.delete('/:productId', removeFromWishlist);

export default router;
