import express from 'express';
import {
  getThreads,
  createThread,
  deleteThread,
  bulkUpdateThreadColors,
} from "../controllers/threadController.js";
import { protect, restrictTo } from '../src/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getThreads);
router.post(
  "/",
  protect,
  restrictTo("ADMIN", "SUPER_ADMIN", "EXECUTIVE", "GRAPHIC"),
  createThread,
);
router.patch(
  "/bulk-color-map",
  protect,
  restrictTo("ADMIN", "SUPER_ADMIN", "GRAPHIC"),
  bulkUpdateThreadColors,
);
router.delete(
  "/:id",
  protect,
  restrictTo("ADMIN", "SUPER_ADMIN", "EXECUTIVE"),
  deleteThread,
);

export default router;
