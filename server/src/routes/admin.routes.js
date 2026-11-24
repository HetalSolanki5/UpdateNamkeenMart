import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { adminAccountRules } from '../validators/admin.validator.js';

// Admin Controllers
import { createAdminAccount } from '../controllers/admin/adminAuth.controller.js';
import {
  getUsers,
  getUserById,
  toggleUserActive,
  updateWholesalerApproval
} from '../controllers/admin/adminUser.controller.js';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive
} from '../controllers/admin/adminCategory.controller.js';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  addVariant,
  updateVariant,
  deleteVariant,
  toggleVariantActive
} from '../controllers/admin/adminProduct.controller.js';
import {
  getStockList,
  updateStock,
  reserveStock,
  releaseStock
} from '../controllers/admin/adminStock.controller.js';
import { getAuditLogs } from '../controllers/admin/adminAuditLog.controller.js';
import { getDashboardSummary } from '../controllers/admin/adminDashboard.controller.js';
import {
  getAdminOrders,
  getAdminOrderById,
  getAdminWholesaleOrders,
  getAdminWholesaleOrderById,
  updateAdminWholesaleOrderStatus
} from '../controllers/admin/adminOrder.controller.js';
import {
  getAdminReviews,
  approveReview,
  hideReview,
  deleteReview
} from '../controllers/admin/adminReview.controller.js';
import { getAdminReports } from '../controllers/admin/adminReport.controller.js';
import {
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive
} from '../controllers/admin/adminOffer.controller.js';

const router = express.Router();

// Apply protect and authorize('admin') to all admin endpoints in this router
router.use(protect, authorize('admin'));

// ==========================================
// Part A: Admin Dashboard Summary
// ==========================================
router.get('/dashboard', getDashboardSummary);

// ==========================================
// Part A2: Admin Orders & Wholesale Orders
// ==========================================
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.get('/wholesale-orders', getAdminWholesaleOrders);
router.get('/wholesale-orders/:id', getAdminWholesaleOrderById);
router.put('/wholesale-orders/:id/status', updateAdminWholesaleOrderStatus);

// ==========================================
// Part A3: Admin Reviews Moderation
// ==========================================
router.get('/reviews', getAdminReviews);
router.put('/reviews/:id/approve', approveReview);
router.put('/reviews/:id/hide', hideReview);
router.delete('/reviews/:id', deleteReview);

// ==========================================
// Part A4: Admin Reports & Analytics
// ==========================================
router.get('/reports', getAdminReports);

// ==========================================
// Part A5: Festival & Seasonal Offers Management
// ==========================================
router.get('/offers', getAdminOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);
router.put('/offers/:id/active', toggleOfferActive);

// ==========================================
// Part B: Controlled Admin Creation
// ==========================================
router.post('/users/admins', adminAccountRules, validate, createAdminAccount);

// ==========================================
// Part C: User Management
// ==========================================
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/active', toggleUserActive);
router.put('/users/:id/wholesaler-status', updateWholesalerApproval);

// ==========================================
// Part D: Category Management
// ==========================================
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.put('/categories/:id/active', toggleCategoryActive);

// ==========================================
// Part E: Product and Variant Management
// ==========================================
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id/active', toggleProductActive);
router.post('/products/:id/variants', addVariant);
router.put('/variants/:variantId', updateVariant);
router.delete('/variants/:variantId', deleteVariant);
router.put('/variants/:variantId/active', toggleVariantActive);

// ==========================================
// Part F: Stock Management
// ==========================================
router.get('/stock', getStockList);
router.put('/stock/:variantId', updateStock);
router.put('/stock/:variantId/reserve', reserveStock);
router.put('/stock/:variantId/release', releaseStock);

// ==========================================
// Part G: Audit Log Viewing
// ==========================================
router.get('/audit-logs', getAuditLogs);

export default router;
