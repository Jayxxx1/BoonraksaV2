import express from 'express';
import { 
  createOrder, 
  getOrders, 
  assignGraphic,  // ✅ เพิ่ม
  uploadArtwork, 
  generateJobSheet, 
  updatePurchasingInfo,
  printJobSheetSignal,
  confirmStockRecheck,
  startProduction,
  passQC,
  readyToShip,
  completeOrder,
  getSalesChannels,
  getOrderById,
  updateOrderSpecs,
  cancelOrder,
  bumpUrgent,
  claimOrder,
  reportStockIssue,
  finishProduction,
  searchOrderByJobId,
  logProductionAction,
  downloadCustomerProofPDF
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../src/middleware/auth.middleware.js';


const router = express.Router();

// Step 1: Sales opens a bill
router.post('/', protect, restrictTo('ADMIN', 'SALES'), createOrder);

// Step 2: Purchasing handles waiting stock
router.patch('/:orderId/purchasing', protect, restrictTo('ADMIN', 'PURCHASING'), updatePurchasingInfo);

// Step 2.5: Graphic claims task
router.patch('/:orderId/assign-graphic', protect, restrictTo('ADMIN', 'GRAPHIC'), assignGraphic);

// Step 3: Graphic uploads artwork
router.patch('/:orderId/artwork', protect, restrictTo('ADMIN', 'GRAPHIC'), uploadArtwork);

// Step 4: Graphic prints Job Sheet
router.get('/:orderId/jobsheet', protect, generateJobSheet);
router.patch('/:orderId/print-signal', protect, restrictTo('ADMIN', 'GRAPHIC'), printJobSheetSignal);

// Step 5: Stock confirms physical inventory (Recheck)
router.patch('/:orderId/stock-recheck', protect, restrictTo('ADMIN', 'STOCK'), confirmStockRecheck);

// Step 6: Production starts
router.patch('/:orderId/production-start', protect, restrictTo('ADMIN', 'PRODUCTION'), startProduction);

// Step 6.5: Production finishes
router.patch('/:orderId/production-finish', protect, restrictTo('ADMIN', 'PRODUCTION'), finishProduction);

// Step 7: QC processes
router.patch('/:orderId/qc-pass', protect, restrictTo('ADMIN', 'SEWING_QC'), passQC);

// Step 8: Ready to ship
router.patch('/:orderId/ready-to-ship', protect, restrictTo('ADMIN', 'DELIVERY'), readyToShip);

// Step 9: Delivery completes order (Payment Gate inside controller)
router.patch('/:orderId/complete', protect, restrictTo('ADMIN', 'DELIVERY'), completeOrder);

// Get all orders
router.get('/', protect, getOrders);

// Get sales channels
router.get('/channels', protect, getSalesChannels);

// Get single order
router.get('/:orderId', protect, getOrderById);

// 🆕 Search order by JOB ID string
router.get('/search/:jobId', protect, searchOrderByJobId);

// 🆕 Log production actions
router.post('/:orderId/production-action', protect, restrictTo('ADMIN', 'PRODUCTION'), logProductionAction);

// 🆕 Customer Proof PDF
router.get('/:id/customer-proof', protect, downloadCustomerProofPDF);

// Update technical specs (Graphic)
router.patch('/:orderId/specs', protect, restrictTo('GRAPHIC'), updateOrderSpecs);

// Sales actions
router.patch('/:orderId/cancel', protect, restrictTo('ADMIN', 'SALES'), cancelOrder);
router.patch('/:orderId/urgent', protect, restrictTo('ADMIN', 'SALES'), bumpUrgent);
router.patch('/:orderId/claim', protect, restrictTo('GRAPHIC', 'SEWING_QC', 'STOCK', 'PRODUCTION'), claimOrder);
router.patch('/:orderId/stock-issue', protect, restrictTo('STOCK'), reportStockIssue);

// Payment routes
router.post('/:orderId/payment', protect, restrictTo('ADMIN', 'SALES'), async (req, res) => {
  const { uploadPaymentSlip } = await import('../controllers/paymentController.js');
  return uploadPaymentSlip(req, res);
});
router.get('/:orderId/payments', protect, async (req, res) => {
  const { getPaymentHistory } = await import('../controllers/paymentController.js');
  return getPaymentHistory(req, res);
});



export default router;
