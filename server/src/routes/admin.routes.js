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

const router = express.Router();

// Apply protect and authorize('admin') to all admin endpoints in this router
router.use(protect, authorize('admin'));

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
