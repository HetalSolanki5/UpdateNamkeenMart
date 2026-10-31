import express from 'express';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/address.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All address routes require authentication and customer role
router.use(protect, authorize('customer'));

// GET / - Get all addresses
router.get('/', getAddresses);

// POST / - Add a new address
router.post('/', addAddress);

// PUT /:addressId - Update an address
router.put('/:addressId', updateAddress);

// DELETE /:addressId - Delete an address
router.delete('/:addressId', deleteAddress);

// PUT /:addressId/default - Set as default address
router.put('/:addressId/default', setDefaultAddress);

export default router;
