
import express from 'express';
import { searchCustomerBlocks } from '../controllers/blockController.js'; // Adjust based on where you put it
import { protect } from '../src/middleware/auth.middleware.js';

const router = express.Router();

// Search blocks used by a customer
router.get('/customer-search', protect, searchCustomerBlocks);

// ... potentially other block routes if they exist, or just export this one
export default router;
