import { asyncHandler } from '../src/middleware/error.middleware.js';
import prisma from '../src/prisma/client.js';

/**
 * Upload payment slip
 * POST /api/orders/:orderId/payment
 */
export const uploadPaymentSlip = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { amount, slipUrl, note, paymentMethod } = req.body;

  // 1. Get current order state
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) }
  });

  if (!order) {
    return res.status(404).json({ status: 'error', message: 'ไม่พบเลขออเดอร์นี้ในระบบ' });
  }

  const currentBalance = parseFloat(order.balanceDue);
  const total = parseFloat(order.totalPrice);
  const amt = parseFloat(amount) || 0;

  // 2. Logic Guards
  if (currentBalance <= 0 && paymentMethod === 'TRANSFER') {
    return res.status(400).json({
      status: 'error',
      message: 'ออเดอร์นี้ชำระเงินครบถ้วนแล้ว ไม่สามารถแจ้งชำระเพิ่มได้'
    });
  }

  if (paymentMethod === 'TRANSFER' && amt > currentBalance) {
    return res.status(400).json({
      status: 'error',
      message: `ยอดเงินที่แจ้ง (${amt.toLocaleString()} ฿) เกินกว่ายอดที่ต้องค้างชำระ (${currentBalance.toLocaleString()} ฿)`
    });
  }

  if (paymentMethod === 'TRANSFER' && (!amount || !slipUrl)) {
    return res.status(400).json({
      status: 'error',
      message: 'กรุณาระบุยอดเงินและอัปโหลดสลิป'
    });
  }

  if (paymentMethod === 'COD' && !amount) {
     return res.status(400).json({
      status: 'error',
      message: 'กรุณาระบุยอดเงินที่ต้องการส่งแบบเก็บเงินปลายทาง'
    });
  }

  // Create payment slip (if amount > 0 or it's a transfer)
  let paymentSlip = null;
  if (amount > 0 || paymentMethod === 'TRANSFER') {
    paymentSlip = await prisma.paymentSlip.create({
      data: {
        orderId: parseInt(orderId),
        amount: parseFloat(amount) || 0,
        // FUTURE INTEGRATION: slipUrl should ideally reference the S3 Key 
        // generated via storagePath.generatePaymentSlipPath(orderId, filename)
        slipUrl: slipUrl || '',
        note: note || (paymentMethod === 'COD' ? 'เปลี่ยนเป็นเก็บเงินปลายทาง (COD)' : null),
        uploadedBy: req.user.id
      }
    });
  }

  // Update order payment info
  // USER REQUIREMENT: COD amount should also reduce "Balance Due" to clear it from UI (treated as "Covered")
  const finalPaidAmount = parseFloat(order.paidAmount) + amt;
  const balanceDue = Math.max(0, total - finalPaidAmount); // Ensure never negative

  // Activity log
  const actionText = paymentMethod === 'COD' ? 'เปลี่ยนเป็นเก็บเงินปลายทาง (COD)' : 'แจ้งชำระเงิน/อัปโหลดสลิป';
  const detailText = paymentMethod === 'COD' 
    ? `${req.user.name} เปลี่ยนรูปแบบการชำระเป็น COD และยืนยันยอดเรียกเก็บ ${amt.toLocaleString()} บาท`
    : `${req.user.name} อัปโหลดสลิปชำระเงินส่วนที่เหลือ ${amt.toLocaleString()} บาท`;

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      paidAmount: finalPaidAmount,
      balanceDue: balanceDue,
      paymentStatus: balanceDue <= 0 ? 'PAID' : finalPaidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      paymentMethod: paymentMethod || order.paymentMethod,
      logs: {
        create: {
          action: actionText,
          details: detailText,
          userId: req.user.id
        }
      }
    },
    include: {
        paymentSlips: {
          include: { uploader: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        logs: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { timestamp: 'desc' }
        }
    }
  });

  res.status(201).json({
    status: 'success',
    data: { order: updatedOrder, paymentSlip }
  });
});

/**
 * Get payment history
 * GET /api/orders/:orderId/payments
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const payments = await prisma.paymentSlip.findMany({
    where: { orderId: parseInt(orderId) },
    include: {
      uploader: {
        select: { id: true, name: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('DEBUG: getPaymentHistory', { orderId, found: payments.length });


  // Get order info with sales
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    select: {
      totalPrice: true,
      paidAmount: true,
      balanceDue: true,
      paymentStatus: true,
      depositSlipUrl: true, // Legacy field
      createdAt: true,
      deposit: true,
      sales: {
        select: { name: true } // Fetch sales name
      }
    }
  });

  // Check if legacy slip exists (and isn't already in the new payments list)
  const isLegacySlipAlreadyIncluded = payments.some(p => p.slipUrl === order.depositSlipUrl);

  if (order.depositSlipUrl && !isLegacySlipAlreadyIncluded) {
    // Calculate legacy amount: total paid - sum of all new slips
    const totalNewPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const legacyAmount = parseFloat(order.paidAmount) - totalNewPayments;
    
    // Only add if there's a meaningful amount (or it's the only record)
    if (legacyAmount > 0) {
      payments.push({
        id: 'legacy-' + orderId,
        amount: legacyAmount,
        slipUrl: order.depositSlipUrl,
        note: 'เงินมัดจำ (Legacy Data)',
        uploadedBy: null,
        uploader: { name: order.sales?.name || 'Unknown Sales' }, // Use Sales name
        createdAt: order.createdAt
      });

      // Re-sort
      payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      payments,
      summary: order
    }
  });
});
