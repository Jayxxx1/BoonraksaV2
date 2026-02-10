import express from 'express';
import { getReports, createReport } from '../controllers/productionReportController.js';
import { protect, restrictTo } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getReports);
router.post('/', protect, restrictTo('ADMIN', 'EXECUTIVE', 'PRODUCTION'), createReport);

export default router;
