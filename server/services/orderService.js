import prisma from '../src/prisma/client.js';
import { 
  safeNumber, 
  generateJobId, 
  getBangkokStartOfDay 
} from '../utils/orderHelpers.js';
import { OrderStatus, PaymentStatus } from '../constants/orderConstants.js';

/**
 * Standard Include for Order
 */
export const standardOrderInclude = {
  items: { include: { variant: { include: { product: true } } } },
  positions: true,
  sales: { select: { name: true, role: true, salesNumber: true } },
  graphic: { select: { id: true, name: true, role: true } },
  stock: { select: { id: true, name: true, role: true } },
  production: { select: { id: true, name: true, role: true } },
  qc: { select: { id: true, name: true, role: true } },
  salesChannel: true,
  purchaseRequests: {
    include: { variant: { include: { product: true } } }
  },
  paymentSlips: {
    include: { uploader: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' }
  },
  logs: {
    include: { user: { select: { name: true, role: true } } },
    orderBy: { timestamp: 'desc' }
  }
};

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(data, user) {
    const {
      customerName, customerPhone, customerAddress,
      salesChannelId, isUrgent, blockType, dueDate, notes,
      items, totalPrice, paidAmount, blockPrice, unitPrice,
      embroideryDetails, depositSlipUrl, draftImages
    } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Job ID generation
      const { jobId, dailyRunning, orderDate } = await generateJobId(tx, user);

      // 2. Stock Check & Purchase Requests
      const purchaseRequests = [];
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: parseInt(item.variantId) }
        });
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        
        const qty = parseInt(item.quantity) || 0;
        if (qty > variant.stock) {
          purchaseRequests.push({
            variantId: variant.id,
            quantity: qty - variant.stock
          });
        }
      }

      // 3. Financials
      const total = safeNumber(totalPrice);
      const paid = safeNumber(paidAmount);
      const balance = total - paid;
      let paymentStatus = PaymentStatus.UNPAID;
      if (paid > 0) {
        paymentStatus = paid >= total ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
      }

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          jobId,
          orderDate,
          dailyRunning,
          customerName: customerName || '-',
          customerPhone: customerPhone || '',
          customerAddress: customerAddress || '',
          salesId: user.id,
          salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
          totalPrice: total,
          paidAmount: paid,
          balanceDue: balance,
          paymentStatus,
          status: purchaseRequests.length > 0 ? OrderStatus.STOCK_ISSUE : OrderStatus.PENDING_ARTWORK,
          isUrgent: isUrgent === true || isUrgent === 'true',
          blockType: blockType || 'OLD',
          dueDate: dueDate ? new Date(dueDate) : null,
          note: notes || '',
          draftImages: draftImages || [],
          items: {
            create: items.map(item => ({
              variantId: parseInt(item.variantId),
              productName: item.productName || 'Unknown Product',
              price: safeNumber(item.price),
              quantity: Math.max(0, parseInt(item.quantity) || 0),
              details: item.details || {}
            }))
          },
          positions: {
            create: (Array.isArray(embroideryDetails) ? embroideryDetails : []).map(pos => ({
              position: pos.position || '-',
              type: pos.type || 'EMBROIDERY',
              size: pos.size || '',
              details: pos.details || '',
              mockupUrl: pos.mockupUrl || null,
              width: pos.width ? parseFloat(pos.width) : null,
              height: pos.height ? parseFloat(pos.height) : null,
              note: pos.note || null
            }))
          },
          logs: {
            create: {
              action: 'Order Created',
              userId: user.id
            }
          }
        },
        include: standardOrderInclude
      });

      // 5. Initial Payment Slip
      if (paid > 0 && depositSlipUrl) {
        await tx.paymentSlip.create({
          data: {
            orderId: order.id,
            amount: paid,
            slipUrl: depositSlipUrl,
            uploaderId: user.id,
            note: 'Initial deposit'
          }
        });

        // Deduct stock only for the items that have stock
        for (const item of items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: parseInt(item.variantId) }
          });
          const qty = parseInt(item.quantity) || 0;
          const qtyToDeduct = Math.min(qty, variant.stock);
          if (qtyToDeduct > 0) {
            await tx.productVariant.update({
              where: { id: parseInt(item.variantId) },
              data: { stock: { decrement: qtyToDeduct } }
            });
          }
        }
      }

      // 6. Create Purchase Requests
      if (purchaseRequests.length > 0) {
        await tx.purchaseRequest.createMany({
          data: purchaseRequests.map(pr => ({
            orderId: order.id,
            variantId: pr.variantId,
            quantity: pr.quantity
          }))
        });
      }

      return order;
    });
  }

  /**
   * Get filtered orders
   */
  async getOrders(filters, user) {
    const { view, search, status } = filters;
    const where = {};

    if (search) {
      where.OR = [
        { jobId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role-based filtering logic
    if (user.role === 'SALES') {
      where.salesId = user.id;
    } else if (view === 'me') {
      switch (user.role) {
        case 'GRAPHIC': where.graphicId = user.id; break;
        case 'SEWING_QC': where.qcId = user.id; break;
        case 'STOCK': where.stockId = user.id; break;
        case 'PRODUCTION': where.productionId = user.id; break;
        default: where.salesId = user.id;
      }
      where.status = { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] };
    } else if (view === 'available') {
      if (user.role === 'GRAPHIC') {
        where.graphicId = null;
        where.status = { in: [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING] };
      } else if (user.role === 'STOCK') {
        where.stockId = null;
        where.status = { in: [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE] };
      } else if (user.role === 'PRODUCTION') {
        where.productionId = null;
        where.status = OrderStatus.STOCK_RECHECKED;
      } else if (user.role === 'SEWING_QC') {
        where.qcId = null;
        where.status = OrderStatus.PRODUCTION_FINISHED;
      } else if (user.role === 'PURCHASING') {
        where.purchaseRequests = { some: { status: 'PENDING' } };
      }
    } else if (view === 'history') {
      switch (user.role) {
        case 'GRAPHIC': where.graphicId = user.id; break;
        case 'STOCK': where.stockId = user.id; break;
        case 'PRODUCTION': where.productionId = user.id; break;
        case 'SEWING_QC': where.qcId = user.id; break;
      }
      where.status = { in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] };
    }

    if (status) {
      where.status = status;
    }

    return await prisma.order.findMany({
      where,
      include: {
        items: { include: { variant: { include: { product: true } } } },
        sales: { select: { name: true, role: true, salesNumber: true } },
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
  }

  /**
   * Get order by ID
   */
  async getOrderById(id) {
    return await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: standardOrderInclude
    });
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status, userId, additionalData = {}) {
    const updateData = { status };
    
    // Handle specific status update logic
    if (status === OrderStatus.READY_TO_SHIP && additionalData.trackingNo) {
      updateData.trackingNo = additionalData.trackingNo;
    }

    return await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        ...updateData,
        logs: {
          create: {
            action: `Status updated to ${status}`,
            userId: userId,
            details: additionalData.note || ''
          }
        }
      },
      include: standardOrderInclude
    });
  }
}

export default new OrderService();
