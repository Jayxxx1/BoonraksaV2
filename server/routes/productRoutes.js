import express from 'express';
import { getProducts, getProductById, createProduct } from '../controllers/productController.js';

const router = express.Router();

// Define specific routes first
router.get('/', getProducts);       // GET /api/products
router.get('/:id', getProductById); // GET /api/products/1
router.post('/', createProduct);

export default router;


