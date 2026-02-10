import express from 'express';
import { getThreads, createThread, deleteThread } from '../controllers/threadController.js';
import { protect, restrictTo } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getThreads);
router.post('/', protect, restrictTo('ADMIN', 'EXECUTIVE'), createThread);
router.delete('/:id', protect, restrictTo('ADMIN', 'EXECUTIVE'), deleteThread);

export default router;
