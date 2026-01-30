import express from 'express';
import { getMyStats } from '../controllers/dashboardController.js';
import { protect } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats', protect, getMyStats);

export default router;
