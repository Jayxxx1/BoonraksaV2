import express from "express";
import * as orderController from "./order.controller.js";
import { protect, restrictTo } from "../../src/middleware/auth.middleware.js";
import { validate, updateStatusSchema } from "./order.validation.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(orderController.getOrders)
  .post(orderController.createOrder);

router.route("/channels").get(orderController.getSalesChannels);

router.route("/search/:jobId").get(orderController.searchOrderByJobId);

// Status-based Aliases (Compatibility with OrderStatusBar.jsx)
router
  .route("/:id/status")
  .patch(validate(updateStatusSchema), orderController.updateStatus);
router
  .route("/:id/PENDING_STOCK_CHECK")
  .patch(orderController.printJobSheetSignal);
router.route("/:id/STOCK_RECHECKED").patch(orderController.confirmStockRecheck);
router.route("/:id/IN_PRODUCTION").patch(orderController.startProduction);
router.route("/:id/PRODUCTION_FINISHED").patch(orderController.updateStatus);
router.route("/:id/READY_TO_SHIP").patch(orderController.updateStatus);
router.route("/:id/COMPLETED").patch(orderController.updateStatus);
router.route("/:id/STOCK_ISSUE").patch(orderController.updateStatus);

router.route("/:id/claim").patch(orderController.claimTask);
router.route("/:id/specs").patch(orderController.updateSpecs);

router.route("/:id/print-signal").patch(orderController.printJobSheetSignal);
router.route("/:id/stock-recheck").patch(orderController.confirmStockRecheck);
router.route("/:id/production-start").patch(orderController.startProduction);
router.route("/:id/cancel").patch(orderController.cancelOrder);
router.route("/:id/urgent").patch(orderController.bumpUrgent);
router.route("/:id/purchasing").patch(orderController.updatePurchasingInfo);
router
  .route("/:id/production-action")
  .post(orderController.logProductionAction);
router
  .route("/:id/payment")
  .post(
    restrictTo("ADMIN", "SUPER_ADMIN", "SALES", "DELIVERY"),
    orderController.uploadPaymentSlip,
  );
router.route("/:id/payments").get(orderController.getPaymentHistory);

router.route("/:id/download/:type").get(orderController.downloadPDF);

router
  .route("/:id/download-embroidery")
  .get(orderController.downloadEmbroideryFile);

// Daily Production reports
router
  .route("/reports/daily")
  .get(
    restrictTo("ADMIN", "SUPER_ADMIN", "PRODUCTION"),
    orderController.getDailyReports,
  )
  .post(
    restrictTo("ADMIN", "SUPER_ADMIN", "PRODUCTION"),
    orderController.createDailyReport,
  );

// Generic ID route must be LAST to prevent shadowing
router
  .route("/:id")
  .get(orderController.getOrder)
  .put(restrictTo("ADMIN", "SALES"), orderController.updateOrder);

export default router;
