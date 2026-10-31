import express from 'express';
import {
  getMyInvoices,
  getInvoiceJson,
  downloadInvoicePdf
} from '../controllers/invoice.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// All invoice routes require customer authentication
router.use(protect, authorize('customer'));

// List customer invoices
router.get('/', getMyInvoices);

// View invoice JSON details
router.get('/:orderId', getInvoiceJson);

// Download invoice PDF
router.get('/:orderId/pdf', downloadInvoicePdf);

export default router;
