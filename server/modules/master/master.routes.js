import express from "express";
import * as masterController from "./master.controller.js";
import { protect } from "../../src/middleware/auth.middleware.js";

const router = express.Router();

router.get("/positions", protect, masterController.getMasterPositions);
router.post("/positions", protect, masterController.createMasterPosition);
router.get("/constants", protect, masterController.getMasterConstants);

export default router;
