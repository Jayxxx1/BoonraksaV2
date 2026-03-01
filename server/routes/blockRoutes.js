import express from "express";
import {
  searchCustomerBlocks,
  listBlocks,
  linkBlockToOrder,
  updateBlock,
} from "../controllers/blockController.js";
import { protect, restrictTo } from "../src/middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", listBlocks);
router.get("/customer-search", searchCustomerBlocks);
router.post(
  "/link/:orderId/:blockId",
  restrictTo("ADMIN", "SUPER_ADMIN", "SALES", "GRAPHIC"),
  linkBlockToOrder,
);
router.patch(
  "/:id",
  restrictTo("ADMIN", "SUPER_ADMIN", "SALES", "GRAPHIC"),
  updateBlock,
);

export default router;
