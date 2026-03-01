import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../src/middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Define specific routes first
router.get("/", getProducts); // GET /api/products
router.get("/:id", getProductById); // GET /api/products/1
router.post("/", restrictTo("ADMIN", "SUPER_ADMIN", "STOCK"), createProduct);

export default router;


