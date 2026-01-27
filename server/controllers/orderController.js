import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import s3Provider from '../src/services/providers/s3.provider.js';
import config from '../src/config/config.js';


/**
 * Generate a new Job ID ([salesNumber] / [dailySeq])
 */
const generateJobId = async (user) => {
  const prefix = user.salesNumber || 'XX';
  
  // Get start of today in local time
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Find max dailySeq for today
  const lastOrderToday = await prisma.order.findFirst({
    where: {
      createdAt: {
        gte: startOfDay
      }
    },
    orderBy: {
      dailySeq: 'desc'
    },
    select: { dailySeq: true }
  });

  const nextSeq = (lastOrderToday?.dailySeq || 0) + 1;
  const formattedSeq = nextSeq.toString().padStart(3, '0');

  return {
    jobId: `${prefix}/${formattedSeq}`,
    dailySeq: nextSeq
  };
};

/**
 * Step 1: Sales opens a bill
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { 
    customerName, customerPhone, customerAddress, customerFb,
    salesChannelId, isUrgent, blockType, dueDate, notes,
    items, // [{ variantId, productName, price, quantity, details }]
    totalPrice, paidAmount, blockPrice, unitPrice, embroideryDetails,
    depositSlipUrl, draftImages
  } = req.body;

  // Helper to ensure numbers are safe for Prisma Decimal/Int
  const safeNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'fail', message: 'Order must have at least one item' });
  }

  try {
    const { jobId, dailySeq } = await generateJobId(req.user);

    const result = await prisma.$transaction(async (tx) => {
      // ใช้สถานะเดียว: PENDING_ARTWORK (ไม่ว่าจะมีสต็อกหรือไม่)
      let orderStatus = 'PENDING_ARTWORK'; 
      const purchaseRequests = [];

      // 1. Check stock
      for (const item of items) {
        if (!item.variantId) throw new Error('Missing variantId in one or more items');
        
        const variant = await tx.productVariant.findUnique({
          where: { id: parseInt(item.variantId) },
          select: { stock: true }
        });

        if (!variant) throw new Error(`Product variant ${item.variantId} not found`);

        const qty = safeNumber(item.quantity);
        if (variant.stock < qty) {
          // สร้าง purchase request แต่ไม่เปลี่ยนสถานะ (ยังคงเป็น PENDING_ARTWORK)
          purchaseRequests.push({
            variantId: parseInt(item.variantId),
            quantity: qty - variant.stock
          });
        }
      }

      // 2. Financials
      const total = safeNumber(totalPrice);
      const paid = safeNumber(paidAmount);
      const balance = total - paid;
      let paymentStatus = 'UNPAID';
      if (paid > 0) {
        paymentStatus = paid >= total ? 'PAID' : 'PARTIALLY_PAID';
      }

      // 3. Block Type Mapping
      const bTypeMap = {
        'บล็อคเดิม': 'OLD',
        'บล็อคเดิมเปลี่ยนข้อความ': 'EDIT',
        'บล็อคเดิมแก้ข้อความ': 'EDIT',
        'บล็อคใหม่': 'NEW'
      };
      const mappedBlockType = bTypeMap[blockType] || 'OLD';

      // 4. Create the Order
      const order = await tx.order.create({
        data: {
          jobId,
          dailySeq: parseInt(dailySeq),
          customerName: customerName || '-',
          customerPhone: customerPhone || '',
          customerAddress: customerAddress || '',
          customerFb: customerFb || '',
          salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
          isUrgent: !!isUrgent,
          blockType: mappedBlockType,
          embroideryDetails: Array.isArray(embroideryDetails) ? embroideryDetails : [],
          totalPrice: total,
          deposit: paid, // Copy initial payment to deposit field
          paidAmount: paid,
          balanceDue: balance,
          paymentStatus,
          depositSlipUrl: depositSlipUrl || null,
          draftImages: Array.isArray(draftImages) ? draftImages : [],
          blockPrice: safeNumber(blockPrice),
          unitPrice: safeNumber(unitPrice),
          status: orderStatus,
          dueDate: (dueDate && !isNaN(Date.parse(dueDate))) ? new Date(dueDate) : null,
          notes: notes || '',
          salesId: req.user.id,
          items: {
            create: items.map(item => ({
              variantId: parseInt(item.variantId),
              productName: item.productName || 'Unknown Product',
              price: safeNumber(item.price),
              quantity: Math.max(0, parseInt(item.quantity) || 0),
              details: item.details || {}
            }))
          }
        }
      });

      // 5. Deduct stock
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ 
          where: { id: parseInt(item.variantId) }, 
          select: { stock: true } 
        });

        if (variant) {
          const qtyToDeduct = Math.min(parseInt(item.quantity) || 0, variant.stock);
          if (qtyToDeduct > 0) {
            await tx.productVariant.update({
              where: { id: parseInt(item.variantId) },
              data: { stock: { decrement: qtyToDeduct } }
            });
          }
        }
      }

      // 6. Purchase Requests
      if (purchaseRequests.length > 0) {
        await tx.purchaseRequest.createMany({
          data: purchaseRequests.map(pr => ({
            orderId: order.id,
            variantId: pr.variantId,
            quantity: pr.quantity
          }))
        });
      }

      // 7. Activity Log
      await tx.activityLog.create({
        data: {
          action: 'CREATED',
          details: `สร้างออเดอร์ใหม่ ${jobId} โดย ${req.user.name} (สถานะ: ${orderStatus})`,
          orderId: order.id,
          userId: req.user.id
        }
      });

      return order;
    });

    res.status(200).json({ status: 'success', data: { order: result } });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error during order creation'
    });
  }
});

/**
 * Get all orders (with filters for different roles)
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { status, view, search } = req.query;
  const where = {};
  
  if (status) where.status = status;

  // Search filter - supports jobId and customerName
  if (search) {
    where.OR = [
      { jobId: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Role-based filtering
  if (req.user.role === 'SALES') {
    // Sales are strictly restricted to their own orders
    where.salesId = req.user.id;
  } else if (view === 'me') {
    switch (req.user.role) {
      case 'GRAPHIC': where.graphicId = req.user.id; break;
      case 'SEWING_QC': where.qcId = req.user.id; break;
      case 'STOCK': where.stockId = req.user.id; break;
      case 'PRODUCTION': where.productionId = req.user.id; break;
      default: where.salesId = req.user.id;
    }
    // "My Tasks" should only show active tasks (not completed or cancelled)
    where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
  } else if (view === 'available') {
    if (req.user.role === 'GRAPHIC') {
      where.graphicId = null;
      where.status = 'READY_FOR_ARTWORK';
    } else if (req.user.role === 'STOCK') {
      where.stockId = null;
      where.status = 'JOB_PRINTED';
    } else if (req.user.role === 'PRODUCTION') {
      where.productionId = null;
      where.status = 'STOCK_RECHECKED';
    } else if (req.user.role === 'SEWING_QC') {
      where.qcId = null;
      where.status = 'PRODUCTION_FINISHED';
    } else if (req.user.role === 'DELIVERY') {
      where.status = 'READY_TO_SHIP';
    }
  } else if (view === 'history') {
    // History is ALWAYS restricted to own tasks for technical roles
    switch (req.user.role) {
      case 'GRAPHIC': 
        where.graphicId = req.user.id; 
        where.status = { notIn: ['READY_FOR_ARTWORK', 'ARTWORK_UPLOADED'] };
        break;
      case 'STOCK': 
        where.stockId = req.user.id; 
        where.status = { notIn: ['JOB_PRINTED'] };
        break;
      case 'PRODUCTION': 
        where.productionId = req.user.id; 
        where.status = { notIn: ['STOCK_RECHECKED', 'IN_PRODUCTION'] };
        break;
      case 'SEWING_QC': 
        where.qcId = req.user.id; 
        where.status = { notIn: ['PRODUCTION_FINISHED'] };
        break;
      case 'DELIVERY':
        where.status = 'COMPLETED';
        break;
      default: 
        where.salesId = req.user.id;
        where.status = 'COMPLETED';
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { variant: { include: { product: true } } } },
      sales: { select: { id: true, name: true, role: true, salesNumber: true } },
      graphic: { select: { id: true, name: true, role: true } },
      stock: { select: { id: true, name: true, role: true } },
      production: { select: { id: true, name: true, role: true } },
      salesChannel: true
    },
    orderBy: [
      { isUrgent: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { orders }
  });
});

/**
 * Get all sales channels
 */
export const getSalesChannels = asyncHandler(async (req, res) => {
  const channels = await prisma.salesChannel.findMany({
    orderBy: { code: 'asc' }
  });

  res.status(200).json({
    status: 'success',
    data: { channels }
  });
});

/**
 * Get single order by ID
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      },
      sales: { select: { id: true, name: true, role: true, salesNumber: true } },
      graphic: { select: { id: true, name: true, role: true } },
      qc: { select: { id: true, name: true, role: true } },
      stock: { select: { id: true, name: true, role: true } },
      production: { select: { id: true, name: true, role: true } },
      salesChannel: true,
      block: true,
      logs: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!order) {
    return res.status(404).json({ status: 'fail', message: 'Order not found' });
  }

  // Permission check: Sales can only see their own orders
  if (req.user.role === 'SALES' && order.salesId !== req.user.id) {
    return res.status(403).json({ status: 'fail', message: 'Access denied' });
  }

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 2: Purchasing adds ETA and reason for WAITING_STOCK orders
 */
export const updatePurchasingInfo = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { purchasingEta, purchasingReason, status } = req.body; 

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      purchasingEta: purchasingEta ? new Date(purchasingEta) : undefined,
      purchasingReason,
      status: status || undefined
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'PURCHASING_UPDATE',
      details: `ฝ่ายจัดซื้อ ${req.user.name} อัปเดตข้อมูลพัสดุ/ETA (สถานะ: ${order.status})`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 3: Graphic uploads artwork
 */
export const uploadArtwork = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { artworkUrl } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      artworkUrl,
      status: 'ARTWORK_UPLOADED',
      graphicId: req.user.id
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPLOAD_ARTWORK',
      details: `ฝ่ายกราฟิก ${req.user.name} อัปเดตไฟล์ Artwork เรียบร้อย`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Update order specifications (Dimensions, thread colors, production files)
 */
export const updateOrderSpecs = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { 
    embroideryDetails, 
    artworkUrl, 
    productionFileUrl, 
    productionFileName 
  } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      embroideryDetails: embroideryDetails || undefined,
      artworkUrl: artworkUrl || undefined,
      productionFileUrl: productionFileUrl || undefined,
      productionFileName: productionFileName || undefined,
      status: (artworkUrl || productionFileUrl) ? 'ARTWORK_UPLOADED' : undefined
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE_SPECS',
      details: `Graphic ${req.user.name} อัพเดตงานปัก`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 4: Graphic prints Job Sheet
 */
export const printJobSheetSignal = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: 'JOB_PRINTED' }
  });

  await prisma.activityLog.create({
    data: {
      action: 'PRINT_JOB_SHEET',
      details: `ฝ่ายกราฟิก ${req.user.name} พิมพ์ใบงาน (Job Sheet) แล้ว`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 5: Stock rechecks physical items
 */
export const confirmStockRecheck = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: 'STOCK_RECHECKED',
      stockId: req.user.id
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'STOCK_RECHECKED',
      details: `ฝ่ายสต็อก ${req.user.name} ยืนยันสินค้าครบถ้วน พร้อมเข้าการผลิต`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 6: Production starts
 */
export const startProduction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: 'IN_PRODUCTION' }
  });

  await prisma.activityLog.create({
    data: {
      action: 'START_PRODUCTION',
      details: `เริ่มกระบวนการผลิต (In Production)`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});


/**
 * Step 6.5: Production finishes
 */
export const finishProduction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: 'PRODUCTION_FINISHED',
      productionId: req.user.id 
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'FINISH_PRODUCTION',
      details: `ฝ่ายผลิต ${req.user.name} ผลิตเสร็จสมบูรณ์ ส่งต่อให้ฝ่าย QC ตรวจสอบ`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 7: QC Pass/Fail
 */
export const passQC = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { pass } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: pass ? 'QC_PASSED' : 'IN_PRODUCTION',
      qcId: req.user.id
    } 
  });

  await prisma.activityLog.create({
    data: {
      action: 'QC_CHECK',
      details: `QC ${req.user.name} result: ${pass ? 'PASS' : 'FAIL'}. Status: ${order.status}`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 8: Ready to ship
 */
export const readyToShip = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: 'READY_TO_SHIP',
      qcId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Step 9: Delivery completes order (THE PAYMENT GATE)
 */
export const completeOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { trackingNo } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) }
  });

  if (!order) return res.status(404).json({ status: 'fail', message: 'Order not found' });

  // PAYMENT GATE LOGIC
  if (parseFloat(order.balanceDue) > 0) {
    return res.status(400).json({ 
      status: 'fail', 
      message: `Payment Incomplete! Balance Due: ${order.balanceDue}. Please notify Sales.` 
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      trackingNo,
      status: 'COMPLETED'
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'COMPLETED',
      details: `ออเดอร์เสร็จสมบูรณ์ เลขติดตามพัสดุ: ${trackingNo}`,
      orderId: updatedOrder.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order: updatedOrder } });
});

/**
 * Generate A4 Job Sheet PDF
 */
export const generateJobSheet = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { 
      items: { include: { variant: { include: { product: true } } } },
      sales: { select: { name: true } }
    }
  });

  if (!order) return res.status(404).json({ status: 'fail', message: 'Order not found' });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filename = `JobSheet-${order.jobId}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  doc.pipe(res);

  // [HEADER]
  doc.fontSize(22).text('Boonraksa System - Job Sheet', { align: 'center' });
  doc.fontSize(14).text(`Job ID: ${order.jobId}`, { align: 'center' });
  doc.moveDown();

  // [BODY]
  doc.fontSize(12).text('CUSTOMER INFO', { underline: true });
  doc.fontSize(10).text(`Name: ${order.customerName}`);
  doc.text(`Phone: ${order.customerPhone || '-'}`);
  doc.text(`Payment Status: ${order.paymentStatus}`);
  doc.moveDown();

  doc.text('ORDER ITEMS', { underline: true });
  order.items.forEach((item, i) => {
    doc.text(`${i+1}. ${item.productName} - Size: ${item.variant.size} - Qty: ${item.quantity}`);
  });

  // [QR CODE]
  const qrData = `https://boonraksa.in.th/order/${order.jobId}`;
  const qrDataURL = await QRCode.toDataURL(qrData);
  doc.image(qrDataURL, 450, 50, { width: 100 });

  doc.end();
});

/**
 * Cancel order (SALES/ADMIN only)
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: 'CANCELLED',
      cancelReason: reason
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'CANCEL_ORDER',
      details: `ยกเลิกออเดอร์โดย ${req.user.name} (เหตุผล: ${reason})`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Bump to urgent / Escalation
 */
export const bumpUrgent = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { note } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      isUrgent: true,
      urgentNote: note
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'BUMP_URGENT',
      details: `ฝ่ายขาย ${req.user.name} แจ้งเร่งออเดอร์ด่วน (หมายเหตุ: ${note})`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Technical roles (GRAPHIC, QC) claim an order to work on it
 */
export const claimOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) }
  });

  if (!order) {
    return res.status(404).json({ status: 'fail', message: 'Order not found' });
  }

  const updateData = {};
  let actionLabel = '';

  if (role === 'GRAPHIC') {
    if (order.graphicId && order.graphicId !== userId) {
      return res.status(400).json({ status: 'fail', message: 'This order is already claimed by another graphic designer' });
    }
    updateData.graphicId = userId;
    actionLabel = 'CLAIM_GRAPHIC';
  } else if (role === 'SEWING_QC') {
    if (order.qcId && order.qcId !== userId) {
      return res.status(400).json({ status: 'fail', message: 'This order is already claimed by another QC' });
    }
    updateData.qcId = userId;
    actionLabel = 'CLAIM_QC';
  } else if (role === 'STOCK') {
    if (order.stockId && order.stockId !== userId) {
      return res.status(400).json({ status: 'fail', message: 'This order is already claimed by another Stock staff' });
    }
    updateData.stockId = userId;
    actionLabel = 'CLAIM_STOCK';
  } else if (role === 'PRODUCTION') {
    if (order.productionId && order.productionId !== userId) {
      return res.status(400).json({ status: 'fail', message: 'This order is already claimed by another Production staff' });
    }
    updateData.productionId = userId;
    actionLabel = 'CLAIM_PRODUCTION';
  } else {
    return res.status(403).json({ status: 'fail', message: 'Only Technical roles can claim orders' });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
    include: {
      graphic: { select: { name: true } },
      qc: { select: { name: true } },
      stock: { select: { name: true } },
      production: { select: { name: true } },
      items: { include: { variant: { include: { product: true } } } },
      sales: { select: { name: true } },
      salesChannel: true
    }
  });

  const roleMap = {
    'GRAPHIC': 'ออกแบบ',
    'SEWING_QC': 'QC',
    'STOCK': 'สต็อก',
    'PRODUCTION': 'ผลิต'
  };

  await prisma.activityLog.create({
    data: {
      action: actionLabel,
      details: `พนักงานฝ่าย${roleMap[role] || role} คุณ${req.user.name} กดรับงานเข้าความรับผิดชอบเรียบร้อย`,
      orderId: updatedOrder.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order: updatedOrder } });
});

/**
 * Step 5.1: Stock reports an issue (mismatch/incomplete)
 */
export const reportStockIssue = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      status: 'STOCK_ISSUE',
      stockIssueReason: reason,
      stockId: req.user.id
    }
  });

  await prisma.activityLog.create({
    data: {
      action: 'STOCK_ISSUE',
      details: `แจ้งปัญหาคลังสินค้าโดยคุณ ${req.user.name}: ${reason} (แจ้งฝ่ายขาย: ช่วยตรวจสอบกับลูกค้าว่าจะสั่งเพิ่มหรือยกเลิกรายการนี้)`,
      orderId: order.id,
      userId: req.user.id
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});





