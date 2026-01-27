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
  // Use salesNumber if available, otherwise adminNumber or fallback
  const prefix = user.salesNumber || user.adminNumber || 'XX';
  
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
 * Get all orders with optional filters
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { jobId: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              select: { sku: true, color: true, size: true }
            }
          }
        },
        sales: {
          select: { name: true, salesNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    data: orders,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Step 1: Sales opens a bill
 * Advanced Logic: Matrix stock check -> multi-status handling -> transactional create
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { 
    customerName, customerPhone, customerAddress, customerFb,
    salesChannelId, isUrgent, blockType, dueDate, notes,
    items, // [{ variantId, productName, price, quantity, details }]
    totalPrice, deposit, blockPrice, unitPrice, embroideryDetails,
  } = req.body;

  if (!customerName || !items || items.length === 0) {
    return res.status(400).json({ status: 'fail', message: 'Missing required fields' });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Generate Job ID
    const { jobId, dailySeq } = await generateJobId(req.user);

    // Check stock for all items
    let initialStatus = 'PENDING';
    const purchaseRequests = [];

    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true, sku: true }
      });

      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        // Insufficient stock -> Pre-order
        initialStatus = 'WAITING_STOCK';
        purchaseRequests.push({
          variantId: item.variantId,
          quantity: item.quantity - variant.stock,
        });
      }
    }

    // Create Order
    const order = await tx.order.create({
      data: {
        jobId,
        dailySeq,
        customerName,
        customerPhone,
        customerAddress,
        customerFb,
        salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
        isUrgent: isUrgent || false,
        blockType: blockType || 'OLD',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        totalPrice: parseFloat(totalPrice),
        deposit: parseFloat(deposit) || 0,
        blockPrice: parseFloat(blockPrice) || 0,
        unitPrice: parseFloat(unitPrice),
        embroideryDetails: embroideryDetails || null,
        status: initialStatus,
        salesId: req.user.id,
      }
    });

    // Create Order Items
    for (const item of items) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          variantId: item.variantId,
          productName: item.productName,
          price: parseFloat(item.price),
          quantity: item.quantity,
          details: item.details || null,
        }
      });

      // Deduct stock if available
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true }
      });

      const deductQty = Math.min(variant.stock, item.quantity);
      if (deductQty > 0) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: deductQty } }
        });
      }
    }

    // Create Purchase Requests if needed
    for (const pr of purchaseRequests) {
      await tx.purchaseRequest.create({
        data: {
          orderId: order.id,
          variantId: pr.variantId,
          quantity: pr.quantity,
          status: 'PENDING',
        }
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        action: 'ORDER_CREATED',
        details: `Order ${jobId} created by ${req.user.name}. Status: ${initialStatus}`,
        userId: req.user.id,
      }
    });

    return order;
  });

  res.status(201).json({
    status: 'success',
    data: { order: result }
  });
});
