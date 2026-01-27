import express from 'express';
import { receiveStock } from '../controllers/stockController.js';
import { protect, restrictTo } from '../src/middleware/auth.middleware.js';

const router = express.Router();

/**
 * Goods Receipt: Stock receives new items
 * Restricted to ADMIN or STOCK roles
 */
router.post('/receive', protect, restrictTo('ADMIN', 'STOCK'), receiveStock);

export default router;
