import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../src/middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All notification routes require login

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;
