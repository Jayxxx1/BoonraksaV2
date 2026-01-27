import express from 'express';
import { 
  getBlocks, 
  createBlock, 
  linkBlockToOrder,
  updateBlock 
} from '../controllers/blockController.js';
import { protect } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getBlocks);
router.post('/', protect, createBlock);
router.patch('/:blockId', protect, updateBlock);
router.post('/link/:orderId/:blockId', protect, linkBlockToOrder);

export default router;
