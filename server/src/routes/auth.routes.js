
import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', (req, res, next) => {
  req.body.role = req.body.role || 'customer';
  next();
}, authController.register);

router.post('/register/customer', (req, res, next) => {
  req.body.role = 'customer';
  next();
}, authController.register);

router.post('/register/wholesaler', (req, res, next) => {
  req.body.role = 'wholesaler';
  next();
}, authController.register);

router.post('/login', authController.login);

router.get('/me', authController.getMe);

export default router;
