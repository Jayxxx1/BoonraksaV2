import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import { protect } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
