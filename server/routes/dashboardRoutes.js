import express from "express";
import {
  getMyStats,
  getSLAKPIs,
  getExecutiveKPIs,
} from "../controllers/dashboardController.js";
import { protect } from "../src/middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", protect, getMyStats);
router.get("/sla-kpi", protect, getSLAKPIs);
router.get("/executive-kpi", protect, getExecutiveKPIs);

export default router;
