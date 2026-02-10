import prisma from '../../src/prisma/client.js';
import { OrderStatus, PaymentStatus, BlockType, UserRole, SubStatus, StatusLabels, RoleLabels } from './order.constants.js';
import { getOrderActionMap } from './order.permissions.js';
import { generateJobId, safeNumber } from '../../utils/orderHelpers.js';
import { generateJobSheetPDF, generateCustomerProofPDF } from '../../services/pdfService.js';

class OrderService {
  /**
   * Helper: Normalize Order Data (Computed Fields)
   */
  normalize(order, user) {
    if (!order) return null;

    const total = parseFloat(order.totalPrice || 0);
    const paid = parseFloat(order.paidAmount || 0);
    const balance = total - paid;

    let normalized = {
      ...order,
      totalPrice: total,
      paidAmount: paid,
      balanceDue: balance,
      isUrgent: !!order.isUrgent,
      actionMap: user ? getOrderActionMap(order, user) : {},
    };

    // Role-based privacy: Sales cannot see names of other staff
    if (user && user.role === UserRole.SALES) {
      if (normalized.graphic) normalized.graphic = { name: "ฝ่ายกราฟิก" };
      if (normalized.stock) normalized.stock = { name: "ฝ่ายสต็อก" };
      if (normalized.production) normalized.production = { name: "ฝ่ายผลิต" };
      if (normalized.qc) normalized.qc = { name: "ฝ่าย QC" };
      
      if (normalized.logs) {
        // 1. Filter out "minor" logs as requested (Old technical spec logs or noisy updates)
        const minorActions = ['อัปเดตสเปคทางเทคนิค', '📝 อัปเดตสเปกงาน', 'อัปเดตข้อมูลจัดซื้อ', '📦 อัปเดตสถานะจัดซื้อ (วัสดุ)'];
        
        normalized.logs = normalized.logs
          .filter(log => !minorActions.includes(log.action))
          .map(log => {
            const displayName = log.user ? (log.user.name || log.user.username) : "ระบบ";
            
            if (!log.user) return { ...log, user: { name: "ระบบ" } };
            if (log.user.id === user.id) return { ...log, user: { ...log.user, name: displayName } };
            
            // Masking for Sales
            const roleLabel = RoleLabels[log.user.role] || log.user.role;
            return { ...log, user: { ...log.user, name: roleLabel } };
          });
      }
    } else if (normalized.logs) {
      normalized.logs = normalized.logs.map(log => {
        const displayName = log.user ? (log.user.name || log.user.username) : "ระบบ";
        return { ...log, user: log.user ? { ...log.user, name: displayName } : { name: "ระบบ" } };
      });
    }

    return normalized;
  }

  /**
   * Standard Include
   */
  getStandardInclude() {
    return {
      items: { include: { variant: { include: { product: true } } } },
      positions: true,
      sales: { select: { id: true, name: true, role: true, salesNumber: true } },
      graphic: { select: { id: true, name: true, role: true } },
      stock: { select: { id: true, name: true, role: true } },
      production: { select: { id: true, name: true, role: true } },
      qc: { select: { id: true, name: true, role: true } },
      salesChannel: true,
      paymentSlips: {
        include: { uploader: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
      },
      logs: {
        include: { user: { select: { id: true, name: true, username: true, role: true } } },
        orderBy: { timestamp: 'desc' }
      }
    };
  }

  /**
   * Create Order
   */
  async createOrder(data, user) {
    const { 
      customerName, customerPhone, customerAddress, customerFb,
      salesChannelId, isUrgent, blockType, dueDate, notes,
      items, totalPrice, paidAmount, embroideryDetails,
      depositSlipUrl, draftImages
    } = data;

    if (!items || items.length === 0) throw new Error('Order must have at least one item');

    return await prisma.$transaction(async (tx) => {
      const { jobId, dailyRunning, orderDate } = await generateJobId(tx, user);

      let subStatus = null;
      const purchaseRequests = [];
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: parseInt(item.variantId) },
          select: { id: true, stock: true }
        });
        if (!variant) throw new Error(`Product variant ${item.variantId} not found`);

        const qty = safeNumber(item.quantity);
        if (variant.stock < qty) {
          subStatus = SubStatus.PURCHASING;
          purchaseRequests.push({ variantId: variant.id, quantity: qty - variant.stock });
        }
      }

      const total = safeNumber(totalPrice);
      const paid = safeNumber(paidAmount);
      const balance = total - paid;
      const paymentStatus = paid >= total ? PaymentStatus.PAID : (paid > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID);

      const bTypeMap = { 'บล็อคเดิม': 'OLD', 'บล็อคเดิมเปลี่ยนข้อความ': 'EDIT', 'บล็อคใหม่': 'NEW' };
      const mappedBlockType = BlockType[blockType] || bTypeMap[blockType] || BlockType.OLD;

      const order = await tx.order.create({
        data: {
          jobId, orderDate, dailyRunning,
          customerName: customerName || '-',
          customerPhone: customerPhone || '',
          customerAddress: customerAddress || '',
          customerFb: customerFb || '',
          salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
          isUrgent: !!isUrgent,
          blockType: mappedBlockType,
          totalPrice: total,
          paidAmount: paid,
          balanceDue: balance,
          paymentStatus,
          status: OrderStatus.PENDING_ARTWORK, // Default status
          subStatus,
          dueDate: (dueDate && !isNaN(Date.parse(dueDate))) ? new Date(dueDate) : null,
          notes: notes || '',
          salesId: user.id,
          draftImages: Array.isArray(draftImages) ? draftImages : [],
          logs: {
            create: {
              action: '🆕 เปิดออเดอร์ใหม่',
              details: `สร้างออเดอร์ ${jobId} สำเร็จ โดย ${user.name}`,
              userId: user.id
            }
          },
          items: {
            create: items.map(p => ({
              variantId: parseInt(p.variantId),
              productName: p.productName || 'Unknown Product',
              price: safeNumber(p.price),
              quantity: Math.max(0, parseInt(p.quantity) || 0),
              details: p.details || {}
            }))
          },
          positions: {
            create: (Array.isArray(embroideryDetails) ? embroideryDetails : []).map(pos => ({
              position: pos.position === "อื่นๆ" ? pos.customPosition : pos.position,
              textToEmb: pos.textToEmb || null,
              logoUrl: pos.logoUrl || null,
              mockupUrl: pos.mockupUrl || null,
              width: pos.width ? parseFloat(pos.width) : null,
              height: pos.height ? parseFloat(pos.height) : null,
              note: pos.note || null
            }))
          }
        },
        include: this.getStandardInclude()
      });

      if (paid > 0 && depositSlipUrl) {
        await tx.paymentSlip.create({
          data: { orderId: order.id, amount: paid, slipUrl: depositSlipUrl, uploadedBy: user.id, note: 'เงินมัดจำ (Initial Deposit)' }
        });
      }

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: parseInt(item.variantId) }, select: { stock: true } });
        if (variant) {
          const qtyToDeduct = Math.min(parseInt(item.quantity) || 0, variant.stock);
          if (qtyToDeduct > 0) {
            await tx.productVariant.update({ where: { id: parseInt(item.variantId) }, data: { stock: { decrement: qtyToDeduct } } });
          }
        }
      }

      if (purchaseRequests.length > 0) {
        await tx.purchaseRequest.createMany({ data: purchaseRequests.map(pr => ({ orderId: order.id, variantId: pr.variantId, quantity: pr.quantity })) });
      }

      return this.normalize(order, user);
    });
  }

  /**
   * Get Single Order
   */
  async getOrder(id, user) {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: this.getStandardInclude()
    });
    return this.normalize(order, user);
  }

  /**
   * List Orders with Filters
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

    if (user.role === UserRole.SALES) {
      where.salesId = user.id;
    } else if (view === 'me') {
      const roleField = { 
        [UserRole.GRAPHIC]: 'graphicId', 
        [UserRole.SEWING_QC]: 'qcId', 
        [UserRole.STOCK]: 'stockId', 
        [UserRole.PRODUCTION]: 'productionId' 
      }[user.role];
      if (roleField) {
        where[roleField] = user.id;
        where.status = { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] };
      }
    } else if (view === 'available') {
        if (user.role === UserRole.GRAPHIC) { where.graphicId = null; where.status = { in: [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING] }; }
        else if (user.role === UserRole.STOCK) { where.stockId = null; where.status = { in: [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE] }; }
        else if (user.role === UserRole.PRODUCTION) { where.productionId = null; where.status = OrderStatus.STOCK_RECHECKED; }
        else if (user.role === UserRole.SEWING_QC) { where.qcId = null; where.status = OrderStatus.PRODUCTION_FINISHED; }
    }

    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: this.getStandardInclude(),
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }]
    });

    return orders.map(o => this.normalize(o, user));
  }

  /**
   * Get Sales Channels
   */
  async getSalesChannels() {
    return await prisma.salesChannel.findMany({
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Search Order by Job ID
   */
  async searchOrderByJobId(jobId, user) {
    const order = await prisma.order.findFirst({
      where: {
        jobId: {
          equals: jobId.trim(),
          mode: 'insensitive'
        }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(order, user);
  }

  /**
   * Update Purchasing Info
   */
  async updatePurchasingInfo(orderId, data, user) {
    const { purchasingEta, purchasingReason, status } = data;
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        purchasingEta: purchasingEta ? new Date(purchasingEta) : undefined,
        purchasingReason,
        status: status || undefined
        // Removed log creation for purchasing info updates as requested
      },
      include: this.getStandardInclude()
    });
    return this.normalize(order, user);
  }

  /**
   * Log Production Action (External Log)
   */
  async logProductionAction(orderId, data, user) {
    const { action, details } = data;
    const id = parseInt(orderId);
    
    const logAction = action === 'START' ? '🏭 เริ่มผลิต' : (action === 'COMPLETE' ? '✅ ผลิตเสร็จสิ้น' : '⏸️ พักงานผลิต');
    
    await prisma.$transaction(async (tx) => {
      // 1. Precise log for performance/foreman
      await tx.productionLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: action === 'START' ? 'START_TASK' : (action === 'COMPLETE' ? 'COMPLETE_ORDER' : 'FINISH_TASK'),
          details: details || ''
        }
      });

      // 2. Timeline log
      await tx.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: logAction,
          details: details || ''
        }
      });

      // Workflow state changes
      if (action === 'START') {
        const order = await tx.order.findUnique({ where: { id } });
        if (order && (order.status === OrderStatus.STOCK_RECHECKED || order.status === 'READY_TO_PRODUCE')) {
           await tx.order.update({
             where: { id },
             data: { 
               status: OrderStatus.IN_PRODUCTION,
               productionId: user.id
             }
           });
        }
      } else if (action === 'COMPLETE') {
        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.PRODUCTION_FINISHED
          }
        });
      }
    });
    return true;
  }

  /**
   * Upload Payment Slip
   */
  async uploadPaymentSlip(orderId, data, user) {
    const { amount, slipUrl, note, paymentMethod } = data;
    const id = parseInt(orderId);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    const amt = parseFloat(amount) || 0;
    const currentPaid = parseFloat(order.paidAmount) || 0;
    const total = parseFloat(order.totalPrice);
    
    const finalPaidAmount = currentPaid + amt;
    const balanceDue = Math.max(0, total - finalPaidAmount);

    const actionText = paymentMethod === 'COD' ? 'เปลี่ยนเป็นเก็บเงินปลายทาง (COD)' : 'แจ้งชำระเงิน/อัปโหลดสลิป';
    const detailText = paymentMethod === 'COD' 
      ? `${user.name} เปลี่ยนรูปแบบการชำระเป็น COD และยืนยันยอดเรียกเก็บ ${amt.toLocaleString()} บาท`
      : `${user.name} อัปโหลดสลิปชำระเงินส่วนที่เหลือ ${amt.toLocaleString()} บาท`;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paidAmount: finalPaidAmount,
        balanceDue: balanceDue,
        paymentStatus: balanceDue <= 0 ? 'PAID' : finalPaidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        paymentMethod: paymentMethod || order.paymentMethod,
        paymentSlips: (amt > 0 || paymentMethod === 'TRANSFER') ? {
          create: {
            amount: amt,
            slipUrl: slipUrl || '',
            note: note || (paymentMethod === 'COD' ? 'เปลี่ยนเป็นเก็บเงินปลายทาง (COD)' : null),
            uploadedBy: user.id
          }
        } : undefined,
        logs: {
          create: {
            action: `💰 ${actionText}`,
            details: detailText,
            userId: user.id
          }
        }
      },
      include: this.getStandardInclude()
    });

    return this.normalize(updatedOrder, user);
  }

  /**
   * Get Payment History
   */
  async getPaymentHistory(orderId) {
    const id = parseInt(orderId);
    const payments = await prisma.paymentSlip.findMany({
      where: { orderId: id },
      include: { uploader: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        totalPrice: true,
        paidAmount: true,
        balanceDue: true,
        paymentStatus: true,
        depositSlipUrl: true,
        createdAt: true,
        sales: { select: { name: true } }
      }
    });

    if (!order) throw new Error('Order not found');

    // Handle legacy slip
    const isLegacyIncluded = payments.some(p => p.slipUrl === order.depositSlipUrl);
    if (order.depositSlipUrl && !isLegacyIncluded) {
      const totalNew = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const legacyAmount = parseFloat(order.paidAmount) - totalNew;
      if (legacyAmount > 0) {
        payments.push({
          id: 'legacy-' + id,
          amount: legacyAmount,
          slipUrl: order.depositSlipUrl,
          note: 'เงินมัดจำ (Legacy Data)',
          uploader: { name: order.sales?.name || 'Unknown' },
          createdAt: order.createdAt
        });
        payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    return { payments, summary: order };
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId, data, user) {
    const { reason } = data;
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.CANCELLED,
        logs: { create: { action: '🚫 ยกเลิกออเดอร์', details: reason || '', userId: user.id } }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  /**
   * Bump Urgent
   */
  async bumpUrgent(orderId, data, user) {
    const { note } = data;
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        isUrgent: true,
        urgentNote: note,
        logs: { create: { action: '⚡ เร่งด่วน (โดยฝ่ายขาย)', details: note || '', userId: user.id } }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  async printJobSheetSignal(orderId, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.PENDING_STOCK_CHECK,
        logs: { create: { action: '📄 พิมพ์ใบงาน/ส่งต่อสต็อก', details: `ฝ่ายกราฟิก ${user.name} พิมพ์ใบงาน (Job Sheet) และส่งต่อฝ่ายสต็อกแล้ว`, userId: user.id } }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  async confirmStockRecheck(orderId, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.STOCK_RECHECKED,
        stockId: user.id,
        logs: { create: { action: '✅ ยืนยันสต็อกครบถ้วน', details: `สต็อก ${user.name} ยืนยันว่าพัสดุครบถ้วน พร้อมสำหรับการผลิต`, userId: user.id } }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  async startProduction(orderId, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.IN_PRODUCTION,
        productionId: user.id,
        logs: { create: { action: '🏭 เริ่มกระบวนการผลิต', details: `พนักงานฝ่ายผลิต ${user.name} กดเริ่มงาน`, userId: user.id } }
      },
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  /**
   * Check for Stale Orders (Inactivity Alert)
   * This should be called by a cron job or periodically
   */
  async checkStaleOrders() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const staleOrders = await prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        isUrgent: false,
        updatedAt: { lte: threeDaysAgo }
      },
      select: { id: true, jobId: true }
    });

    if (staleOrders.length === 0) return;

    await prisma.$transaction(async (tx) => {
      // 1. Mark as urgent
      await tx.order.updateMany({
        where: { id: { in: staleOrders.map(o => o.id) } },
        data: { isUrgent: true }
      });

      // 2. Create System logs
      await tx.activityLog.createMany({
        data: staleOrders.map(o => ({
          orderId: o.id,
          action: '⚠️ แจ้งเตือน: ออเดอร์ค้างเข้านานกว่า 3 วัน',
          details: `ระบบปรับออเดอร์ ${o.jobId} เป็นงานด่วนอัตโนมัติเนื่องจากไม่มีการเคลื่อนไหวเกิน 3 วัน`,
          userId: null // System
        }))
      });
    });

    return staleOrders.length;
  }

  /**
   * Update Status with Logging & Complex Logic
   */
  async updateStatus(orderId, status, user, data = {}) {
    const orderIdInt = parseInt(orderId);
    
    // Safety check: Don't allow completion if unpaid (except COD)
    if (status === OrderStatus.COMPLETED) {
      const order = await prisma.order.findUnique({ where: { id: orderIdInt } });
      const isPaid = parseFloat(order.balanceDue) <= 0;
      const isCOD = order.paymentMethod === 'COD';
      if (!isPaid && !isCOD) throw new Error('PAYMENT_INCOMPLETE');
      if (!data.trackingNo) throw new Error('TRACKING_REQUIRED');
    }

    const updateData = { status };
    if (data.trackingNo) updateData.trackingNo = data.trackingNo;
    if (data.artworkUrl) updateData.artworkUrl = data.artworkUrl;
    if (data.subStatus !== undefined) updateData.subStatus = data.subStatus;

    // Handle QC Pass/Fail logic
    if (data.pass === false && status === OrderStatus.PRODUCTION_FINISHED) {
      updateData.status = data.returnTo === UserRole.GRAPHIC ? OrderStatus.DESIGNING : OrderStatus.IN_PRODUCTION;
    } else if (data.pass === true && status === OrderStatus.PRODUCTION_FINISHED) {
      updateData.status = OrderStatus.QC_PASSED;
    }

    const statusLabel = StatusLabels[updateData.status] || updateData.status;

    const result = await prisma.order.update({
      where: { id: orderIdInt },
      data: {
        ...updateData,
        logs: { create: { action: `สถานะ 👉 ${statusLabel}`, details: data.reason || data.note || '', userId: user.id } }
      },
      include: this.getStandardInclude()
    });

    return this.normalize(result, user);
  }

  /**
   * Claim Task
   */
  async claimTask(orderId, user) {
    const roleField = { 
      [UserRole.GRAPHIC]: 'graphicId', 
      [UserRole.STOCK]: 'stockId', 
      [UserRole.PRODUCTION]: 'productionId', 
      [UserRole.SEWING_QC]: 'qcId' 
    }[user.role];
    if (!roleField) throw new Error('UNAUTHORIZED_ACTION');

    const updateData = { [roleField]: user.id };
    // Auto-advance status for some roles
    if (user.role === UserRole.GRAPHIC) updateData.status = OrderStatus.DESIGNING;
    if (user.role === UserRole.PRODUCTION) updateData.status = OrderStatus.IN_PRODUCTION;

    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { ...updateData, logs: { create: { action: '✋ รับงาน/มอบหมายงาน', userId: user.id } } },
      include: this.getStandardInclude()
    });

    return this.normalize(result, user);
  }

  /**
   * Update Technical Specs
   */
  async updateSpecs(orderId, specs, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { ...specs }, // Removed log creation for small changes
      include: this.getStandardInclude()
    });
    return this.normalize(result, user);
  }

  /**
   * Generate PDF Buffer
   */
  async generatePDF(orderId, type) {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: this.getStandardInclude()
    });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    
    if (type === 'jobsheet') return await generateJobSheetPDF(order);
    return await generateCustomerProofPDF(order);
  }
}

export default new OrderService();
