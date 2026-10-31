import express from 'express';
import { getCategories } from '../controllers/category.controller.js';

const router = express.Router();

// GET / - Public route to fetch all active categories
router.get('/', getCategories);

export default router;
