import express from 'express';
import { getProducts, getProductById } from '../controllers/product.controller.js';

const router = express.Router();

// GET / - Public route to fetch products list with filters, sorting, and pagination
router.get('/', getProducts);

// GET /:id - Public route to fetch single product details
router.get('/:id', getProductById);

export default router;
