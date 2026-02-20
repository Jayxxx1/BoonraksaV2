import prisma from "../../src/prisma/client.js";
import {
  OrderStatus,
  PaymentStatus,
  BlockType,
  UserRole,
  SubStatus,
  StatusLabels,
  RoleLabels,
  PreorderStatus,
} from "./order.constants.js";
import { getOrderActionMap } from "./order.permissions.js";
import { safeNumber } from "../../utils/orderHelpers.js";
import {
  getPreorderItems,
  hasPreorder,
  getIsReadyForProduction,
  getProductionStatus,
} from "../../utils/order-logic.js";
import {
  generateJobSheetPDF,
  generateCustomerProofPDF,
} from "../../services/pdfService.js";
import { deleteFile, extractKeyFromUrl } from "../../services/uploadService.js";

class OrderService {
  /**
   * Helper: Cleanup S3 file if replaced or removed
   * @param {string} oldUrl - Existing file URL
   * @param {string} newUrl - New file URL (if any)
   */
  async cleanupFile(oldUrl, newUrl) {
    if (!oldUrl || oldUrl === newUrl) return;

    const key = extractKeyFromUrl(oldUrl);
    if (key) {
      try {
        await deleteFile(key);
      } catch (err) {
        console.error(`[S3-CLEANUP-ERR] Failed to delete ${key}:`, err);
      }
    }
  }

  /**
   * Helper: Cleanup multiple S3 files
   * @param {string[]} oldUrls - Current list of URLs
   * @param {string[]} newUrls - New list of URLs
   */
  async cleanupFiles(oldUrls, newUrls = []) {
    if (!Array.isArray(oldUrls) || oldUrls.length === 0) return;

    const newSet = new Set(newUrls || []);
    const toDelete = oldUrls.filter((url) => !newSet.has(url));

    for (const url of toDelete) {
      await this.cleanupFile(url);
    }
  }

  /**
   * Helper: Normalize Order Data (Computed Fields)
   */
  normalize(order, user) {
    if (!order) return null;

    const total = parseFloat(order.totalPrice || 0);
    const paid = parseFloat(order.paidAmount || 0);
    const balance = total - paid;

    // --- 🏭 Factory-Grade Production Derived State ---
    const isReadyForProduction = getIsReadyForProduction(order);

    const itemsWithPreorder = getPreorderItems(
      order.items || [],
      order.purchaseRequests,
    );

    let normalized = {
      ...order,
      totalPrice: total,
      paidAmount: paid,
      balanceDue: balance,
      isUrgent: !!order.isUrgent,
      actionMap: user ? getOrderActionMap(order, user) : {},
      jobId: order.displayJobCode || order.jobId,
      items: itemsWithPreorder,
      hasPreorder: hasPreorder(order, itemsWithPreorder),
      hasPreorderItems: itemsWithPreorder.some((i) => i.isPreorder),
      preorderSummary: {
        totalShortageUnits:
          order.purchaseRequests?.reduce(
            (acc, pr) => acc + (pr.quantity || 0),
            0,
          ) || 0,
      },
      isDelayed:
        order.purchasingEta &&
        order.dueDate &&
        new Date(order.purchasingEta).getTime() >
          new Date(order.dueDate).getTime(),
      isReadyForProduction,
      productionStatus: getProductionStatus(order),
    };

    // --- 🕒 Dynamic SLA & Alert Engine (Phase 5) ---
    if (order.dueDate) {
      const dueDate = new Date(order.dueDate);

      // Fix: Normalize Due Date to 18:00 (End of Day) to avoid "07:00" confusion
      // This ensures that when we calculate offsets, they are also at 18:00
      dueDate.setHours(18, 0, 0, 0);

      const bufferDays = parseInt(order.slaBufferLevel || 0);

      // Base Calculation on the Customer Due Date directly
      // 2. Department Staggered Deadlines (Based on Rules: Graphic -3/4 days, Prod -1/2 days)

      const ONE_DAY = 24 * 60 * 60 * 1000;

      // Helper to subtract days and keep time at 18:00
      const subtractDays = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() - days);
        d.setHours(18, 0, 0, 0);
        return d.getTime();
      };

      const deptDeadlines = {
        // Pipeline order: Graphic/Digitizer → Stock → Production → QC → Ship
        // Each department's deadline is LATER than the previous in the chain.
        GRAPHIC: subtractDays(dueDate, 4), // Graphic must finish 4 days before delivery
        DIGITIZER: subtractDays(dueDate, 4), // Digitizer has the same window as Graphic
        STOCK: subtractDays(dueDate, 3), // Stock must finish 3 days before delivery
        PRODUCTION: subtractDays(dueDate, 2), // Production must finish 2 days before delivery
        QC: subtractDays(dueDate, 1), // QC must finish 1 day before delivery (Final check)
      };

      // 3. Determine Current Target Deadline based on Order Status
      // Default to QC (Last step before Shipping)
      let targetDeadline = deptDeadlines.QC;

      if (
        order.status === OrderStatus.PENDING_ARTWORK ||
        order.status === OrderStatus.DESIGNING
      ) {
        targetDeadline = deptDeadlines.GRAPHIC;
      } else if (order.status === OrderStatus.PENDING_DIGITIZING) {
        targetDeadline = deptDeadlines.DIGITIZER;
      } else if (order.status === OrderStatus.PENDING_STOCK_CHECK) {
        targetDeadline = deptDeadlines.STOCK;
      } else if (
        order.status === OrderStatus.STOCK_RECHECKED ||
        order.status === OrderStatus.IN_PRODUCTION
      ) {
        targetDeadline = deptDeadlines.PRODUCTION;
      }

      const now = new Date().getTime();
      const timeLeft = targetDeadline - now;

      let slaStatus = "GREEN";
      if (timeLeft < 0) {
        slaStatus = "RED"; // Overdue
      } else if (timeLeft < 24 * 60 * 60 * 1000) {
        slaStatus = "YELLOW"; // Warning (< 24h)
      }

      // 🆕 Check if the current user's role has completed their part
      let isRoleCompleted = false;
      if (user) {
        if (user.role === UserRole.DIGITIZER) {
          isRoleCompleted = !!order.digitizingCompletedAt;
        } else if (user.role === UserRole.PRODUCTION) {
          isRoleCompleted = !!order.productionCompletedAt;
        } else if (user.role === UserRole.SEWING_QC) {
          isRoleCompleted = !!order.qcCompletedAt;
        } else if (user.role === UserRole.STOCK) {
          isRoleCompleted = order.stockRechecked === true;
        } else if (user.role === UserRole.GRAPHIC) {
          // Artwork is "Finished" for Graphic once it moves to Stock Check or beyond
          const graphicFinishedStatuses = [
            OrderStatus.PENDING_STOCK_CHECK,
            OrderStatus.STOCK_RECHECKED,
            OrderStatus.STOCK_ISSUE,
            OrderStatus.IN_PRODUCTION,
            OrderStatus.PRODUCTION_FINISHED,
            OrderStatus.QC_PASSED,
            OrderStatus.READY_TO_SHIP,
            OrderStatus.COMPLETED,
          ];
          isRoleCompleted = graphicFinishedStatuses.includes(order.status);
        }
      }

      normalized.sla = {
        internalDeadline: new Date(subtractDays(dueDate, bufferDays)), // For reference only
        targetDeadline: new Date(targetDeadline),
        status: isRoleCompleted ? "GREEN" : slaStatus,
        isLate: !isRoleCompleted && slaStatus === "RED",
        isCompleted: isRoleCompleted,
      };
    }

    // Dynamic Status Label & Sub-status for QC_PASSED & READY_TO_SHIP
    if (normalized.status === OrderStatus.QC_PASSED) {
      if (balance > 0) {
        normalized.displayStatusLabel = "รอจัดส่ง";
        normalized.subStatusLabel = "ยังไม่ชำระคงเหลือ";
      } else {
        normalized.displayStatusLabel = "พร้อมจัดส่ง";
      }
    } else if (normalized.status === OrderStatus.READY_TO_SHIP) {
      normalized.displayStatusLabel = "พร้อมจัดส่ง";
    }

    // Role-based privacy & Sanitization
    if (user) {
      if (user.role === UserRole.SALES) {
        normalized = this.sanitizeOrderForSalesRole(normalized, user);
      } else if (
        user.role === UserRole.PRODUCTION ||
        user.role === UserRole.PURCHASING
      ) {
        normalized = this.sanitizeOrderForProductionRole(normalized, user);
      }

      // --- 🧵 Digitizer View Optimization ---
      // Once digitized, the order is "Finished" from the Digitizer's perspective.
      // We mask subsequent statuses to avoid information overload.
      if (
        user.role === UserRole.DIGITIZER &&
        order.digitizingCompletedAt &&
        order.status !== OrderStatus.PENDING_DIGITIZING
      ) {
        normalized.status = OrderStatus.COMPLETED;
      }
    }

    if (normalized.logs) {
      normalized.logs = normalized.logs.map((log) => {
        const displayName = log.user
          ? log.user.name || log.user.username
          : "ระบบ";
        return {
          ...log,
          user: log.user
            ? { ...log.user, name: displayName }
            : { name: "ระบบ" },
        };
      });
    }

    return normalized;
  }

  /**
   * Centralized Sanitization for Production/Purchasing Role
   * Strips financials and internal technical logs.
   */
  sanitizeOrderForProductionRole(order, user) {
    const sanitized = { ...order };

    // 1. HARD RULE: STRIP TECHNICAL & INTERNAL DATA
    delete sanitized.systemJobNo; // Hide global running number
    delete sanitized.graphicSpec; // Hide graphic spec (Internal)
    delete sanitized.productionLogs; // Hide internal production logs

    // 2. FINANCIAL PRIVACY: Production/Purchasing don't need to see sales pricing
    if (user.role === UserRole.PRODUCTION) {
      delete sanitized.totalPrice;
      delete sanitized.paidAmount;
      delete sanitized.balanceDue;
      delete sanitized.notes; // Hide Sales Notes to reduce distractions
    }

    return sanitized;
  }

  /**
   * Centralized Sanitization for Sales Role
   * Masks internal staff names to department labels.
   */
  sanitizeOrderForSalesRole(order, user) {
    const sanitized = { ...order };

    // Mask Staff Names (Replace with Department Names)
    if (sanitized.graphic)
      sanitized.graphic = {
        ...sanitized.graphic,
        name: "ฝ่ายกราฟิก",
        username: "GRAPHIC",
        id: 0,
      };
    if (sanitized.stock)
      sanitized.stock = {
        ...sanitized.stock,
        name: "ฝ่ายสต็อก",
        username: "STOCK",
        id: 0,
      };
    if (sanitized.production)
      sanitized.production = {
        ...sanitized.production,
        name: "ฝ่ายผลิต",
        username: "PRODUCTION",
        id: 0,
      };
    if (sanitized.qc)
      sanitized.qc = {
        ...sanitized.qc,
        name: "ฝ่าย QC",
        username: "QC",
        id: 0,
      };
    if (sanitized.digitizer)
      sanitized.digitizer = {
        ...sanitized.digitizer,
        name: "ฝ่ายตีลาย",
        username: "DIGITIZER",
        id: 0,
      };

    // Filter Logs (Remove internal technical logs)
    if (sanitized.logs) {
      const minorActions = [
        "อัปเดตสเปคทางเทคนิค",
        "📝 อัปเดตสเปกงาน",
        "อัปเดตข้อมูลจัดซื้อ",
        "📦 อัปเดตสถานะจัดซื้อ (วัสดุ)",
        "INTERNAL_NOTE",
        "สถานะ 👉",
      ];

      sanitized.logs = sanitized.logs
        .filter((log) => !minorActions.includes(log.action))
        .map((log) => {
          if (!log.user) return log;
          if (log.user.id === user.id) return log; // Own logs visible

          const roleLabel = RoleLabels[log.user.role] || log.user.role;
          return { ...log, user: { ...log.user, name: roleLabel, id: 0 } };
        });
    }

    return sanitized;
  }

  /**
   * Standard Include
   */
  getStandardInclude() {
    return {
      items: { include: { variant: { include: { product: true } } } },
      purchaseRequests: true, // 🆕 Include PR for Pre-order checks
      positions: true,
      sales: {
        select: { id: true, name: true, role: true, salesNumber: true },
      },
      graphic: { select: { id: true, name: true, role: true } },
      stock: { select: { id: true, name: true, role: true } },
      production: { select: { id: true, name: true, role: true } },
      qc: { select: { id: true, name: true, role: true } },
      digitizer: { select: { id: true, name: true, role: true } },
      salesChannel: true,
      paymentSlips: {
        include: { uploader: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      rejections: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      logs: {
        include: {
          user: {
            select: { id: true, name: true, username: true, role: true },
          },
        },
        orderBy: { timestamp: "desc" },
      },
    };
  }

  /**
   * Create Order
   */
  async createOrder(data, user) {
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerFb,
      salesChannelId,
      isUrgent,
      blockType,
      dueDate,
      notes,
      items,
      totalPrice,
      paidAmount,
      embroideryDetails,
      depositSlipUrl,
      draftImages,
    } = data;

    if (!items || items.length === 0)
      throw new Error("Order must have at least one item");

    return await prisma.$transaction(async (tx) => {
      // Logic for legacy import
      // Pre-order Detection Logic (HARD RULE)
      let needsPurchasing = false;
      const purchaseRequestsData = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: parseInt(item.variantId) },
          select: { id: true, stock: true },
        });
        if (!variant)
          throw new Error(`Product variant ${item.variantId} not found`);

        const requestedQty = Math.max(0, parseInt(item.quantity) || 0);
        if (variant.stock < requestedQty) {
          needsPurchasing = true;
          purchaseRequestsData.push({
            variantId: variant.id,
            quantity: requestedQty - variant.stock,
          });
        }
      }

      const total = safeNumber(totalPrice);
      const paid = safeNumber(paidAmount);
      const balance = total - paid;
      const paymentStatus =
        paid >= total
          ? PaymentStatus.PAID
          : paid > 0
            ? PaymentStatus.PARTIALLY_PAID
            : PaymentStatus.UNPAID;

      const bTypeMap = {
        บล็อคเดิม: "OLD",
        บล็อคเดิมเปลี่ยนข้อความ: "EDIT",
        บล็อคใหม่: "NEW",
      };
      const mappedBlockType =
        BlockType[blockType] || bTypeMap[blockType] || BlockType.OLD;

      // Use temporary unique placeholder (Transaction will update this immediately)
      const initialDisplayCode = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      let order = await tx.order.create({
        data: {
          displayJobCode: initialDisplayCode, // Temporary, will update atomically below
          customerName: customerName || "-",
          customerPhone: customerPhone || "",
          customerAddress: customerAddress || "",
          customerFb: customerFb || "",
          salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
          isUrgent: !!isUrgent,
          blockType: mappedBlockType,
          totalPrice: total,
          paidAmount: paid,
          balanceDue: balance,
          paymentStatus,
          status:
            mappedBlockType === BlockType.NEW
              ? OrderStatus.PENDING_DIGITIZING
              : OrderStatus.PENDING_ARTWORK,
          preorderSubStatus: needsPurchasing
            ? PreorderStatus.WAITING_PURCHASE_INPUT
            : PreorderStatus.NONE,
          dueDate:
            dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate) : null,
          notes: notes || "",
          salesId: user.id,
          draftImages: Array.isArray(draftImages) ? draftImages : [],
          logs: {
            create: {
              action: "🆕 เปิดออเดอร์ใหม่",
              details: `สร้างออเดอร์สำเร็จ โดย ${user.name}${needsPurchasing ? " (พบสินค้าต้องสั่งซื้อเพิ่ม)" : ""}`,
              userId: user.id,
            },
          },
          items: {
            create: items.map((p) => ({
              variantId: parseInt(p.variantId),
              productName: p.productName || "Unknown Product",
              price: safeNumber(p.price),
              quantity: Math.max(0, parseInt(p.quantity) || 0),
              details: p.details || {},
            })),
          },
          positions: {
            create: (Array.isArray(embroideryDetails)
              ? embroideryDetails
              : []
            ).map((pos) => ({
              positionNo: pos.positionNo ? parseInt(pos.positionNo) : null,
              masterPositionId: pos.masterPositionId
                ? parseInt(pos.masterPositionId)
                : null,
              position:
                pos.position === "อื่นๆ" ? pos.customPosition : pos.position,
              textToEmb: pos.textToEmb || null,
              logoUrl: pos.logoUrl || null,
              mockupUrl: pos.mockupUrl || null,
              width: pos.width ? parseFloat(pos.width) : null,
              height: pos.height ? parseFloat(pos.height) : null,
              note: pos.note || null,
            })),
          },
        },
      });

      // ATOMIC JOB ID GENERATION (HARD RULE)
      const salesPrefix = user.salesNumber || String(user.id);
      const finalCode = `${salesPrefix}/${order.systemJobNo}`;

      order = await tx.order.update({
        where: { id: order.id },
        data: { displayJobCode: finalCode },
        include: this.getStandardInclude(),
      });

      if (paid > 0 && depositSlipUrl) {
        await tx.paymentSlip.create({
          data: {
            orderId: order.id,
            amount: paid,
            slipUrl: depositSlipUrl,
            uploadedBy: user.id,
            note: "เงินมัดจำ",
          },
        });
      }

      // Deduct stock for available items
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: parseInt(item.variantId) },
          select: { stock: true },
        });
        if (variant) {
          const qtyToDeduct = Math.min(
            parseInt(item.quantity) || 0,
            variant.stock,
          );
          if (qtyToDeduct > 0) {
            await tx.productVariant.update({
              where: { id: parseInt(item.variantId) },
              data: { stock: { decrement: qtyToDeduct } },
            });
          }
        }
      }

      // Create Purchase Requests if needed
      if (purchaseRequestsData.length > 0) {
        await tx.purchaseRequest.createMany({
          data: purchaseRequestsData.map((pr) => ({
            orderId: order.id,
            variantId: pr.variantId,
            quantity: pr.quantity,
          })),
        });
      }

      return this.normalize(order, user);
    });
  }

  /**
   * Get Single Order
   */
  async getOrder(id, user) {
    const orderIdInt = parseInt(id);
    const order = await prisma.order.findUnique({
      where: { id: orderIdInt },
      include: this.getStandardInclude(),
    });

    if (!order) return null;

    // --- 🔐 Strict Pipeline Authorization ---
    if (
      user &&
      ![
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.EXECUTIVE,
        UserRole.SALES,
      ].includes(user.role)
    ) {
      // 1. If assigned, they can always view
      const isAssignedToMe =
        order.graphicId === user.id ||
        order.digitizerId === user.id ||
        order.stockId === user.id ||
        order.productionId === user.id ||
        order.qcId === user.id;

      if (!isAssignedToMe) {
        // 2. If not assigned, check if it's in their department's visible statuses
        const departmentStatuses = {
          [UserRole.GRAPHIC]: [
            OrderStatus.PENDING_ARTWORK,
            OrderStatus.DESIGNING,
          ],
          [UserRole.DIGITIZER]: [OrderStatus.PENDING_DIGITIZING],
          [UserRole.STOCK]: [
            OrderStatus.PENDING_STOCK_CHECK,
            OrderStatus.STOCK_ISSUE,
            OrderStatus.STOCK_RECHECKED,
          ],
          [UserRole.PRODUCTION]: [
            OrderStatus.STOCK_RECHECKED,
            OrderStatus.IN_PRODUCTION,
            OrderStatus.PRODUCTION_FINISHED,
          ],
          [UserRole.SEWING_QC]: [
            OrderStatus.PRODUCTION_FINISHED,
            OrderStatus.QC_PASSED,
            OrderStatus.READY_TO_SHIP,
          ],
          [UserRole.DELIVERY]: [
            OrderStatus.QC_PASSED,
            OrderStatus.READY_TO_SHIP,
            OrderStatus.COMPLETED,
          ],
        }[user.role];

        if (!departmentStatuses || !departmentStatuses.includes(order.status)) {
          throw new Error(
            "UNAUTHORIZED_ACCESS: Order is currently handled by another department",
          );
        }
      }
    }

    return this.normalize(order, user);
  }

  /**
   * List Orders with Filters
   */
  async getOrders(filters, user) {
    const { view, search, status } = filters;
    const where = {};

    // 1. Search Logic (Using AND to avoid collision with visibility OR)
    if (search) {
      where.AND = [
        {
          OR: [
            { displayJobCode: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // 2. Metadata for Visibility
    const roleField = {
      [UserRole.GRAPHIC]: "graphicId",
      [UserRole.SEWING_QC]: "qcId",
      [UserRole.STOCK]: "stockId",
      [UserRole.PRODUCTION]: "productionId",
      [UserRole.DIGITIZER]: "digitizerId",
    }[user.role];

    const departmentStatuses = {
      [UserRole.GRAPHIC]: [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING],
      [UserRole.DIGITIZER]: [OrderStatus.PENDING_DIGITIZING],
      [UserRole.STOCK]: [
        OrderStatus.PENDING_STOCK_CHECK,
        OrderStatus.STOCK_ISSUE,
        OrderStatus.STOCK_RECHECKED,
      ],
      [UserRole.PRODUCTION]: [
        OrderStatus.STOCK_RECHECKED,
        OrderStatus.IN_PRODUCTION,
        OrderStatus.PRODUCTION_FINISHED,
      ],
      [UserRole.SEWING_QC]: [
        OrderStatus.PRODUCTION_FINISHED,
        OrderStatus.QC_PASSED,
        OrderStatus.READY_TO_SHIP,
      ],
      [UserRole.DELIVERY]: [
        OrderStatus.QC_PASSED,
        OrderStatus.READY_TO_SHIP,
        OrderStatus.COMPLETED,
      ],
    }[user.role];

    // 3. Visibility Application
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EXECUTIVE].includes(
        user.role,
      )
    ) {
      // Full visibility for Admin/Executive
    } else if (user.role === UserRole.SALES) {
      where.salesId = user.id;
    } else if (view === "me") {
      if (roleField) {
        where[roleField] = user.id;

        // Base exclusion
        const notInStatus = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

        // Role-specific "Finished" exclusion for "My Tasks"
        const specificExclusions = {};
        if (user.role === UserRole.DIGITIZER) {
          specificExclusions.digitizingCompletedAt = null;
        } else if (user.role === UserRole.PRODUCTION) {
          specificExclusions.productionCompletedAt = null;
        } else if (user.role === UserRole.SEWING_QC) {
          specificExclusions.qcCompletedAt = null;
        } else if (user.role === UserRole.STOCK) {
          specificExclusions.stockRechecked = false;
        } else if (user.role === UserRole.GRAPHIC) {
          // If artwork is uploaded and pending stock, it's "finished" for Graphic's My Tasks
          notInStatus.push(
            OrderStatus.PENDING_STOCK_CHECK,
            OrderStatus.STOCK_RECHECKED,
            OrderStatus.STOCK_ISSUE,
          );
        }

        where.AND = [
          { status: { notIn: notInStatus } },
          { ...specificExclusions },
        ];
      }
    } else if (view === "available") {
      if (user.role === UserRole.GRAPHIC) {
        where.graphicId = null;
        where.status = {
          in: [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING],
        };
      } else if (user.role === UserRole.DIGITIZER) {
        where.digitizerId = null;
        where.status = OrderStatus.PENDING_DIGITIZING;
      } else if (user.role === UserRole.STOCK) {
        where.stockId = null;
        where.status = {
          in: [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE],
        };
      } else if (user.role === UserRole.PRODUCTION) {
        // Factory-Grade: No individual claim, only show eligible orders
        where.stockRechecked = true;
        where.physicalItemsReady = true;
        where.graphicJobSheetAttached = true;
        where.productionCompletedAt = null; // Still in progress or ready
      } else if (user.role === UserRole.SEWING_QC) {
        where.qcId = null;
        where.status = OrderStatus.PRODUCTION_FINISHED;
      }
    } else {
      // Default / "All" Tab View for Departments: Strict Pipeline + Assigned Jobs
      const visibilityOr = [];
      if (departmentStatuses) {
        visibilityOr.push({ status: { in: departmentStatuses } });
      }

      if (roleField) {
        // Technical roles: ALWAYS see what they are responsible for (History)
        visibilityOr.push({ [roleField]: user.id });
      }

      if (visibilityOr.length > 0) {
        where.AND = [...(where.AND || []), { OR: visibilityOr }];
      }
    }

    // 4. Status Filter Mapping (Accounting for Masked Statuses)
    if (status && status === OrderStatus.COMPLETED) {
      if (user.role === UserRole.DIGITIZER) {
        where.digitizingCompletedAt = { not: null };
      } else if (user.role === UserRole.PRODUCTION) {
        where.productionCompletedAt = { not: null };
      } else if (user.role === UserRole.SEWING_QC) {
        where.qcCompletedAt = { not: null };
      } else {
        where.status = status;
      }
    } else if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: this.getStandardInclude(),
      orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
    });

    return orders.map((o) => this.normalize(o, user));
  }

  /**
   * Get Sales Channels
   */
  async getSalesChannels() {
    return await prisma.salesChannel.findMany({
      orderBy: { code: "asc" },
    });
  }

  /**
   * Search Order by Job ID
   */
  async searchOrderByJobId(jobId, user) {
    const order = await prisma.order.findFirst({
      where: {
        displayJobCode: {
          equals: jobId.trim(),
          mode: "insensitive",
        },
      },
      include: this.getStandardInclude(),
    });
    return this.normalize(order, user);
  }

  /**
   * Update Purchasing Info
   */
  async updatePurchasingInfo(orderId, data, user) {
    const { purchasingEta, purchasingReason, status, preorderSubStatus } = data;
    const id = parseInt(orderId);

    // 1. Fetch current order state
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { preorderSubStatus: true, purchasingEta: true },
    });

    if (!currentOrder) throw new Error("Order not found");

    const updateData = {
      purchasingReason,
      status: status || undefined,
    };

    // 2. Handle ETA Updates
    if (purchasingEta !== undefined) {
      if (purchasingEta) {
        // SETTING DATE
        updateData.purchasingEta = new Date(purchasingEta);

        // Auto-transition: If currently waiting for input, move to Waiting Arrival
        const currentSub = currentOrder.preorderSubStatus;
        if (
          !currentSub ||
          currentSub === PreorderStatus.WAITING_PURCHASE_INPUT
        ) {
          updateData.preorderSubStatus = PreorderStatus.WAITING_ARRIVAL;
        }
        // If updating date while already DELAYED -> Reset to Round 2 Confirmation (or just Waiting Arrival)
        else if (
          currentSub === PreorderStatus.DELAYED ||
          currentSub === PreorderStatus.DELAYED_ROUND_2
        ) {
          updateData.preorderSubStatus = PreorderStatus.WAITING_ARRIVAL_2;
        }
      } else {
        // CLEARING DATE (set to null or empty)
        updateData.purchasingEta = null;

        // Revert Status: If currently Waiting Arrival, go back to Input
        if (
          currentOrder.preorderSubStatus === PreorderStatus.WAITING_ARRIVAL ||
          currentOrder.preorderSubStatus === PreorderStatus.WAITING_ARRIVAL_2
        ) {
          updateData.preorderSubStatus = PreorderStatus.WAITING_PURCHASE_INPUT;
        }
      }
    }

    // 3. Manual Status Override (if provided)
    if (preorderSubStatus) {
      updateData.preorderSubStatus = preorderSubStatus;
    }

    // 4. Final Validation Sanity Check
    // If resulting status is WAITING_ARRIVAL (any round), MUST have a date
    const finalStatus =
      updateData.preorderSubStatus || currentOrder.preorderSubStatus;
    const finalDate =
      updateData.purchasingEta !== undefined
        ? updateData.purchasingEta
        : currentOrder.purchasingEta;

    if (
      (finalStatus === PreorderStatus.WAITING_ARRIVAL ||
        finalStatus === PreorderStatus.WAITING_ARRIVAL_2) &&
      !finalDate
    ) {
      // Fallback: If no date, force to Input
      updateData.preorderSubStatus = PreorderStatus.WAITING_PURCHASE_INPUT;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: this.getStandardInclude(),
    });
    return this.normalize(order, user);
  }

  /**
   * Log Production Action (External Log)
   */
  async logProductionAction(orderId, data, user) {
    const { action, details } = data;
    const id = parseInt(orderId);

    const logAction =
      action === "START"
        ? "🏭 เริ่มผลิต"
        : action === "COMPLETE"
          ? "✅ ผลิตเสร็จสิ้น"
          : "⏸️ พักงานผลิต";

    await prisma.$transaction(async (tx) => {
      // 1. Precise log for performance/foreman
      await tx.productionLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action:
            action === "START"
              ? "START_TASK"
              : action === "COMPLETE"
                ? "COMPLETE_ORDER"
                : "FINISH_TASK",
          details: details || "",
        },
      });

      // 2. Timeline log
      await tx.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: logAction,
          details: details || "",
        },
      });

      // Workflow state changes
      if (action === "START") {
        const order = await tx.order.findUnique({ where: { id } });
        // Only update if not already in production or finished
        if (order && !order.productionStartedAt) {
          await tx.order.update({
            where: { id },
            data: {
              status: OrderStatus.IN_PRODUCTION,
              productionId: user.id,
              productionStartedAt: new Date(),
            },
          });
        }
      } else if (action === "COMPLETE") {
        const order = await tx.order.findUnique({ where: { id } });
        // Only update if not already completed
        if (order && !order.productionCompletedAt) {
          await tx.order.update({
            where: { id },
            data: {
              status: OrderStatus.PRODUCTION_FINISHED,
              productionCompletedAt: new Date(),
            },
          });
        }
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
    if (!order) throw new Error("Order not found");

    const amt = parseFloat(amount) || 0;
    const currentPaid = parseFloat(order.paidAmount) || 0;
    const total = parseFloat(order.totalPrice);

    const finalPaidAmount = currentPaid + amt;
    const balanceDue = Math.max(0, total - finalPaidAmount);

    const actionText =
      paymentMethod === "COD"
        ? "เปลี่ยนเป็นเก็บเงินปลายทาง (COD)"
        : "แจ้งชำระเงิน/อัปโหลดสลิป";
    const detailText =
      paymentMethod === "COD"
        ? `${user.name} เปลี่ยนรูปแบบการชำระเป็น COD และยืนยันยอดเรียกเก็บ ${amt.toLocaleString()} บาท`
        : `${user.name} อัปโหลดสลิปชำระเงินส่วนที่เหลือ ${amt.toLocaleString()} บาท`;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paidAmount: finalPaidAmount,
        balanceDue: balanceDue,
        paymentStatus:
          balanceDue <= 0
            ? "PAID"
            : finalPaidAmount > 0
              ? "PARTIALLY_PAID"
              : "UNPAID",
        paymentMethod: paymentMethod || order.paymentMethod,
        paymentSlips:
          amt > 0 || paymentMethod === "TRANSFER"
            ? {
                create: {
                  amount: amt,
                  slipUrl: slipUrl || "",
                  note:
                    note ||
                    (paymentMethod === "COD"
                      ? "เปลี่ยนเป็นเก็บเงินปลายทาง (COD)"
                      : null),
                  uploadedBy: user.id,
                },
              }
            : undefined,
        logs: {
          create: {
            action: `💰 ${actionText}`,
            details: detailText,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
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
      orderBy: { createdAt: "desc" },
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
        sales: { select: { name: true } },
      },
    });

    if (!order) throw new Error("Order not found");

    // Handle legacy slip
    const isLegacyIncluded = payments.some(
      (p) => p.slipUrl === order.depositSlipUrl,
    );
    if (order.depositSlipUrl && !isLegacyIncluded) {
      const totalNew = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0,
      );
      const legacyAmount = parseFloat(order.paidAmount) - totalNew;
      if (legacyAmount > 0) {
        payments.push({
          id: "legacy-" + id,
          amount: legacyAmount,
          slipUrl: order.depositSlipUrl,
          note: "เงินมัดจำ (Legacy Data)",
          uploader: { name: order.sales?.name || "Unknown" },
          createdAt: order.createdAt,
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
        logs: {
          create: {
            action: "🚫 ยกเลิกออเดอร์",
            details: reason || "",
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
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
        logs: {
          create: {
            action: "⚡ เร่งด่วน (โดยฝ่ายขาย)",
            details: note || "",
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });
    return this.normalize(result, user);
  }

  async printJobSheetSignal(orderId, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.PENDING_STOCK_CHECK,
        graphicJobSheetAttached: true,
        readyForProductionAt: new Date(), // Potential ready point if other flags are also true
        logs: {
          create: {
            action: "📄 พิมพ์ใบงาน/ส่งต่อสต็อก",
            details: `ฝ่ายกราฟิก ${user.name} พิมพ์ใบงาน (Job Sheet) และส่งต่อฝ่ายสต็อกแล้ว`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });
    return this.normalize(result, user);
  }

  async confirmStockRecheck(orderId, user) {
    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: OrderStatus.STOCK_RECHECKED,
        stockRechecked: true,
        physicalItemsReady: true,
        stockId: user.id,
        logs: {
          create: {
            action: "✅ ยืนยันสต็อกครบถ้วน",
            details: `สต็อก ${user.name} ยืนยันว่าพัสดุครบถ้วน พร้อมสำหรับการผลิต`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });
    return this.normalize(result, user);
  }

  async startProduction(orderId, user, { workerNames = [] } = {}) {
    const id = parseInt(orderId);
    const order = await prisma.order.findUnique({ where: { id } });

    // Idempotency: NEVER overwrite an existing timestamp
    if (order && order.productionStartedAt) return this.normalize(order, user);

    const result = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.IN_PRODUCTION,
        productionId: user.id,
        productionStartedAt: new Date(),
        assignedWorkerNames: workerNames,
        logs: {
          create: {
            action: "🏭 เริ่มกระบวนการผลิต",
            details: workerNames.length
              ? `${user.name} มอบหมายงานให้: ${workerNames.join(", ")}`
              : `${user.name} กดเริ่มงาน`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
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
        updatedAt: { lte: threeDaysAgo },
      },
      select: { id: true, displayJobCode: true },
    });

    if (staleOrders.length === 0) return;

    await prisma.$transaction(async (tx) => {
      // 1. Mark as urgent
      await tx.order.updateMany({
        where: { id: { in: staleOrders.map((o) => o.id) } },
        data: { isUrgent: true },
      });

      // 2. Create System logs
      await tx.activityLog.createMany({
        data: staleOrders.map((o) => ({
          orderId: o.id,
          action: "⚠️ แจ้งเตือน: ออเดอร์ค้างเข้านานกว่า 3 วัน",
          details: `ระบบปรับออเดอร์ ${o.displayJobCode} เป็นงานด่วนอัตโนมัติเนื่องจากไม่มีการเคลื่อนไหวเกิน 3 วัน`,
          userId: null, // System
        })),
      });
    });

    return staleOrders.length;
  }

  /**
   * Check for Delayed Pre-orders (ETA Missed)
   */
  async checkDelayedPreorders() {
    const today = new Date();

    // 1. Check Standard Delays (WAITING_ARRIVAL -> DELAYED_ROUND_1)
    const delayedOrders = await prisma.order.findMany({
      where: {
        preorderSubStatus: PreorderStatus.WAITING_ARRIVAL,
        purchasingEta: { lt: today },
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      },
      select: { id: true, displayJobCode: true, purchasingEta: true },
    });

    // 2. Check Round 2 Delays (WAITING_ARRIVAL_2 (renamed to PURCHASE_CONFIRMED contextually) -> DELAYED_ROUND_2)
    // Note: User requested WAITING_ARRIVAL -> DELAYED_ROUND_1 -> WAITING_ARRIVAL (re-enter) -> DELAYED_ROUND_2
    const delayedOrdersRound2 = await prisma.order.findMany({
      where: {
        preorderSubStatus: PreorderStatus.PURCHASE_CONFIRMED, // used as "Waiting Arrival Round 2"
        purchasingEta: { lt: today },
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      },
      select: { id: true, displayJobCode: true, purchasingEta: true },
    });

    if (delayedOrders.length === 0 && delayedOrdersRound2.length === 0)
      return 0;

    await prisma.$transaction(async (tx) => {
      // Process Round 1 Delays
      if (delayedOrders.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: delayedOrders.map((o) => o.id) } },
          data: { preorderSubStatus: PreorderStatus.DELAYED_ROUND_1 },
        });

        await tx.activityLog.createMany({
          data: delayedOrders.map((o) => ({
            orderId: o.id,
            action: "⚠️ แจ้งเตือน: ของเข้าล่าช้า (รอบที่ 1)",
            details: `ระบบเปลี่ยนสถานะเป็น "ล่าช้าครั้งที่ 1" เนื่องจากเกินกำหนดวันที่ ${o.purchasingEta.toLocaleDateString("th-TH")}`,
            userId: null, // System
          })),
        });
      }

      // Process Round 2 Delays (Executive Alert - HARD RULE)
      if (delayedOrdersRound2.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: delayedOrdersRound2.map((o) => o.id) } },
          data: { preorderSubStatus: PreorderStatus.DELAYED_ROUND_2 },
        });

        await tx.activityLog.createMany({
          data: delayedOrdersRound2.map((o) => ({
            orderId: o.id,
            action: "🚨 แจ้งเตือนผู้บริหาร: สินค้าล่าช้าซ้ำซ้อน (รอบที่ 2)",
            details: `CRITICAL: ออเดอร์ ${o.displayJobCode} ล่าช้าครั้งที่ 2 เกินกำหนด ${o.purchasingEta.toLocaleDateString("th-TH")} โปรดตรวจสอบเพื่อรักษาระดับการบริการ`,
            userId: null, // System
          })),
        });
      }
    });

    return delayedOrders.length + delayedOrdersRound2.length;
  }

  /**
   * Update Status with Logging & Complex Logic
   */
  async updateStatus(orderId, status, user, data = {}) {
    const orderIdInt = parseInt(orderId);

    // Safety check: Don't allow completion if unpaid (except COD)
    if (status === OrderStatus.COMPLETED) {
      const order = await prisma.order.findUnique({
        where: { id: orderIdInt },
      });
      const isPaid = parseFloat(order.balanceDue) <= 0;
      const isCOD = order.paymentMethod === "COD";
      if (!isPaid && !isCOD) throw new Error("PAYMENT_INCOMPLETE");
      if (!data.trackingNo) throw new Error("TRACKING_REQUIRED");
    }

    const updateData = { status };
    if (data.trackingNo) updateData.trackingNo = data.trackingNo;
    if (data.artworkUrl) updateData.artworkUrl = data.artworkUrl;
    if (data.subStatus !== undefined) updateData.subStatus = data.subStatus;

    // Handle QC Pass/Fail logic
    if (data.pass === false && status === OrderStatus.PRODUCTION_FINISHED) {
      updateData.status =
        data.returnTo === UserRole.GRAPHIC
          ? OrderStatus.DESIGNING
          : OrderStatus.IN_PRODUCTION;
    } else if (
      data.pass === true &&
      status === OrderStatus.PRODUCTION_FINISHED
    ) {
      updateData.status = OrderStatus.QC_PASSED;
    }

    // --- 🏭 Factory-Grade Transition (Hardening) ---
    // IN_PRODUCTION applies to the order lifecycle and does not imply total SKU completion.
    // Idempotency: Only set productionStartedAt if it's the first time entering this state.
    if (updateData.status === OrderStatus.IN_PRODUCTION) {
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderIdInt },
      });
      if (currentOrder && !currentOrder.productionStartedAt) {
        updateData.productionStartedAt = new Date();
      }
    }

    // Finalize production timestamp
    if (updateData.status === OrderStatus.PRODUCTION_FINISHED) {
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderIdInt },
      });
      if (currentOrder && !currentOrder.productionCompletedAt) {
        updateData.productionCompletedAt = new Date();
      }
    }

    const statusLabel = StatusLabels[updateData.status] || updateData.status;

    const result = await prisma.order.update({
      where: { id: orderIdInt },
      data: {
        ...updateData,
        logs: {
          create: {
            action: `สถานะ 👉 ${statusLabel}`,
            details: data.reason || data.note || "",
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });

    return this.normalize(result, user);
  }

  /**
   * Claim Task
   */
  async claimTask(orderId, user) {
    const roleField = {
      [UserRole.GRAPHIC]: "graphicId",
      [UserRole.STOCK]: "stockId",
      [UserRole.PRODUCTION]: "productionId",
      [UserRole.SEWING_QC]: "qcId",
      [UserRole.DIGITIZER]: "digitizerId",
    }[user.role];
    if (!roleField) throw new Error("UNAUTHORIZED_ACTION");

    const updateData = { [roleField]: user.id };
    // Auto-advance status for some roles
    if (user.role === UserRole.GRAPHIC)
      updateData.status = OrderStatus.DESIGNING;
    if (user.role === UserRole.PRODUCTION)
      updateData.status = OrderStatus.IN_PRODUCTION;

    const result = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        ...updateData,
        logs: { create: { action: "✋ รับงาน/มอบหมายงาน", userId: user.id } },
      },
      include: this.getStandardInclude(),
    });

    return this.normalize(result, user);
  }

  /**
   * Update Purchasing Info (Pre-order management)
   */
  async updatePurchasingInfo(orderId, data, user) {
    const { purchasingEta, purchasingReason, confirmArrival } = data;
    const orderIdInt = parseInt(orderId);

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderIdInt },
      select: {
        id: true,
        purchasingEta: true,
        purchasingEtaCount: true,
        dueDate: true,
        preorderSubStatus: true,
      },
    });
    if (!currentOrder) throw new Error("ORDER_NOT_FOUND");

    const updateData = {};

    // 1. Role: PURCHASING/ADMIN can update ETA and Reason
    if (purchasingEta !== undefined || purchasingReason !== undefined) {
      if (![UserRole.PURCHASING, UserRole.ADMIN].includes(user.role)) {
        throw new Error(
          "UNAUTHORIZED_ACTION: Only Purchasing can set ETA/Remarks",
        );
      }

      if (purchasingEta) {
        const newEta = new Date(purchasingEta);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validation: No past dates
        if (newEta < today) {
          throw new Error(
            "VALIDATION_ERROR: Cannot select a past date for ETA",
          );
        }

        // Validation: Max 2 updates (Initial set + 1 change)
        if (
          purchasingEta !==
          currentOrder.purchasingEta?.toISOString().split("T")[0]
        ) {
          if (currentOrder.purchasingEtaCount >= 2) {
            throw new Error(
              "VALIDATION_ERROR: ETA can only be updated twice (Initial set + 1 change)",
            );
          }
          updateData.purchasingEtaCount = currentOrder.purchasingEtaCount + 1;
          updateData.preorderSubStatus = PreorderStatus.WAITING_ARRIVAL; // ดำเนินการสั่งซื้อ
        }

        updateData.purchasingEta = newEta;
      }

      if (purchasingReason !== undefined) {
        updateData.purchasingReason = purchasingReason;
      }
    }

    // 2. Special Action: Confirm Arrival (PURCHASING/ADMIN only)
    if (confirmArrival) {
      if (![UserRole.PURCHASING, UserRole.ADMIN].includes(user.role)) {
        throw new Error(
          "UNAUTHORIZED_ACTION: Only Purchasing should confirm arrival upon delivery",
        );
      }
      updateData.preorderSubStatus = PreorderStatus.ARRIVED;

      // Also log this major event
      await prisma.activityLog.create({
        data: {
          orderId: orderIdInt,
          action: "📥 สินค้าเข้าคลังแล้ว (ARRIVED)",
          details: `ยืนยันโดยฝ่ายขาย (${user.name}). ออเดอร์พร้อมผลิต`,
          userId: user.id,
        },
      });
    }

    const result = await prisma.order.update({
      where: { id: orderIdInt },
      data: updateData,
      include: this.getStandardInclude(),
    });

    return this.normalize(result, user);
  }

  /**
   * Update Order (Sales Edit)
   * Handles full update including items, stock recalculation, and PRs.
   */
  async updateOrder(orderId, data, user) {
    const orderIdInt = parseInt(orderId);

    // 1. Fetch current order to check status and permissions
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderIdInt },
      include: { items: true, purchaseRequests: true },
    });

    if (!currentOrder) throw new Error("Order not found");

    // Restriction: Cannot edit items if production started (simplified check)
    // Allowed statuses: PENDING_ARTWORK, DESIGNING, PENDING_PAYMENT, PENDING_STOCK_CHECK, STOCK_ISSUE
    const allowedStatues = [
      OrderStatus.PENDING_ARTWORK,
      OrderStatus.DESIGNING,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PENDING_DIGITIZING,
      OrderStatus.PENDING_STOCK_CHECK,
      OrderStatus.STOCK_ISSUE,
      OrderStatus.STOCK_RECHECKED, // Maybe allowing if stock issue
    ];

    // If items are being changed, check status
    if (data.items && data.items.length > 0) {
      if (!allowedStatues.includes(currentOrder.status)) {
        throw new Error(
          "ไม่อนุญาตให้แก้ไขรายการสินค้าในสถานะปัจจุบัน (งานเข้าสู่กระบวนการผลิตแล้ว)",
        );
      }
    }

    // --- S3 Cleanup ---
    if (data.draftImages) {
      await this.cleanupFiles(currentOrder.draftImages, data.draftImages);
    }

    return await prisma.$transaction(async (tx) => {
      // 2. Prepare Update Data for Basic Fields
      const updateData = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        customerFb: data.customerFb,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        isUrgent: data.isUrgent !== undefined ? !!data.isUrgent : undefined,
        salesChannelId: data.salesChannelId
          ? parseInt(data.salesChannelId)
          : undefined,
        purchaseOrder: data.purchaseOrder, // PO No
        taxInbox: data.taxInbox, // Tax Info
        draftImages: data.draftImages, // Array of URLs
      };

      // 3. Handle Specs/Embroidery (Reuse updateSpecs logic/fields)
      if (data.embroideryDetails) {
        // Clear old positions
        await tx.orderEmbroideryPosition.deleteMany({
          where: { orderId: orderIdInt },
        });

        // Create new positions
        if (data.embroideryDetails.length > 0) {
          await tx.orderEmbroideryPosition.createMany({
            data: data.embroideryDetails.map((pos) => ({
              orderId: orderIdInt,
              positionNo: pos.positionNo ? parseInt(pos.positionNo) : null,
              masterPositionId: pos.masterPositionId
                ? parseInt(pos.masterPositionId)
                : null,
              position: pos.position || "-",
              textToEmb: pos.textToEmb || null,
              logoUrl: pos.logoUrl || null,
              mockupUrl: pos.mockupUrl || null,
              width: pos.width ? parseFloat(pos.width) : null,
              height: pos.height ? parseFloat(pos.height) : null,
              note: pos.details || pos.note || null,
              isFreeOption: !!pos.isFreeOption,
              freeOptionName: pos.freeOptionName,
              fileAddress: pos.fileAddress || null,
              needlePattern: pos.needlePattern || null,
            })),
          });
        }
        updateData.embroideryDetails = data.embroideryDetails;
      }

      // 4. Handle Items (Complex Logic)
      if (data.items && data.items.length > 0) {
        // A. Restore Stock for Old Items
        for (const oldItem of currentOrder.items) {
          await tx.productVariant.update({
            where: { id: oldItem.variantId },
            data: { stock: { increment: oldItem.quantity } },
          });
        }

        // B. Delete Old Items & PRs
        await tx.orderItem.deleteMany({ where: { orderId: orderIdInt } });
        await tx.purchaseRequest.deleteMany({ where: { orderId: orderIdInt } }); // Reset PRs

        // C. Process New Items (Copy logic from createOrder)
        let needsPurchasing = false;
        const purchaseRequestsData = [];

        for (const item of data.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: parseInt(item.variantId) },
            select: { id: true, stock: true },
          });

          if (!variant)
            throw new Error(`Product variant ${item.variantId} not found`);

          const requestedQty = Math.max(0, parseInt(item.quantity) || 0);

          // Deduct Stock
          const qtyToDeduct = Math.min(requestedQty, variant.stock);
          if (qtyToDeduct > 0) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: qtyToDeduct } },
            });
          }

          // Check for PR
          if (variant.stock < requestedQty) {
            needsPurchasing = true;
            purchaseRequestsData.push({
              variantId: variant.id,
              quantity: requestedQty - variant.stock,
            });
          }
        }

        // Create New Items in DB
        await tx.orderItem.createMany({
          data: data.items.map((p) => ({
            orderId: orderIdInt,
            variantId: parseInt(p.variantId),
            productName: p.productName || "Unknown Product",
            price: safeNumber(p.price),
            quantity: Math.max(0, parseInt(p.quantity) || 0),
            details: p.details || {},
          })),
        });

        // Create New PRs
        if (purchaseRequestsData.length > 0) {
          await tx.purchaseRequest.createMany({
            data: purchaseRequestsData.map((pr) => ({
              orderId: orderIdInt,
              variantId: pr.variantId,
              quantity: pr.quantity,
              status: "PENDING",
            })),
          });
          updateData.preorderSubStatus = PreorderStatus.WAITING_PURCHASE_INPUT;
        } else {
          // If no PRs needed anymore, clear flag
          updateData.preorderSubStatus = PreorderStatus.NONE;
        }

        // Update Totals
        updateData.totalPrice = safeNumber(data.totalPrice);
        updateData.balanceDue =
          safeNumber(data.totalPrice) - safeNumber(currentOrder.paidAmount);
      }

      // 5. Commit Update
      const result = await tx.order.update({
        where: { id: orderIdInt },
        data: {
          ...updateData,
          logs: {
            create: {
              action: "✏️ แก้ไขออเดอร์ (Sales Edit)",
              details: `แก้ไขข้อมูลโดย ${user.name}`,
              userId: user.id,
            },
          },
        },
        include: this.getStandardInclude(),
      });

      return result;
    });
  }

  async updateSpecs(orderId, specs, user) {
    const orderIdInt = parseInt(orderId);

    // We update atomically using a transaction to ensure positions model is synced
    const result = await prisma.$transaction(async (tx) => {
      // 0. Fetch current state for S3 Cleanup
      const currentOrder = await tx.order.findUnique({
        where: { id: orderIdInt },
        include: { positions: true },
      });

      if (!currentOrder) throw new Error("Order not found");

      // 1. Update the Order model (for artworkUrl, productionFileUrl, etc.)
      const { embroideryDetails, positions, ...otherSpecs } = specs;

      // --- S3 Cleanup (Main Order Files) ---
      if (otherSpecs.artworkUrl !== undefined) {
        await this.cleanupFile(currentOrder.artworkUrl, otherSpecs.artworkUrl);
      }
      if (otherSpecs.productionFileUrl !== undefined) {
        await this.cleanupFile(
          currentOrder.productionFileUrl,
          otherSpecs.productionFileUrl,
        );
      }

      const detailsToSync = embroideryDetails || positions;

      await tx.order.update({
        where: { id: orderIdInt },
        data: { ...otherSpecs, embroideryDetails: detailsToSync },
      });

      // 2. Sync Positions Model if provided
      if (Array.isArray(detailsToSync)) {
        // --- S3 Cleanup (Positions Files) ---
        // Since we delete and recreate, we cleanup EVERYTHING that isn't in the new set
        const newLogos = detailsToSync.map((p) => p.logoUrl).filter(Boolean);
        const newMockups = detailsToSync
          .map((p) => p.mockupUrl)
          .filter(Boolean);
        const newEmbs = detailsToSync
          .flatMap((p) => p.embroideryFileUrls || [])
          .filter(Boolean);

        const oldLogos = currentOrder.positions
          .map((p) => p.logoUrl)
          .filter(Boolean);
        const oldMockups = currentOrder.positions
          .map((p) => p.mockupUrl)
          .filter(Boolean);
        const oldEmbs = currentOrder.positions
          .flatMap((p) => p.embroideryFileUrls || [])
          .filter(Boolean);

        await this.cleanupFiles(oldLogos, newLogos);
        await this.cleanupFiles(oldMockups, newMockups);
        await this.cleanupFiles(oldEmbs, newEmbs);

        // Validation: Mandatory Detail for "อื่นๆ"
        for (const pos of detailsToSync) {
          if (
            (pos.position === "อื่นๆ" || pos.position === "อื่นๆ (Other)") &&
            !(pos.details || pos.note || "").trim()
          ) {
            throw new Error(
              "VALIDATION_ERROR: กรุณาระบุรายละเอียดเพิ่มเติมสำหรับตำแหน่ง 'อื่นๆ'",
            );
          }
        }

        // Delete old positions
        await tx.orderEmbroideryPosition.deleteMany({
          where: { orderId: orderIdInt },
        });

        // Create new positions
        await tx.orderEmbroideryPosition.createMany({
          data: detailsToSync.map((pos) => ({
            orderId: orderIdInt,
            positionNo: pos.positionNo ? parseInt(pos.positionNo) : null,
            masterPositionId: pos.masterPositionId
              ? parseInt(pos.masterPositionId)
              : null,
            position: pos.position || "-",
            textToEmb: pos.textToEmb || null,
            logoUrl: pos.logoUrl || null,
            mockupUrl: pos.mockupUrl || null,
            width: pos.width ? parseFloat(pos.width) : null,
            height: pos.height ? parseFloat(pos.height) : null,
            note: pos.details || pos.note || null,
            fileAddress: pos.fileAddress || null,
            needlePattern: pos.needlePattern || null,
            threadSequence: pos.threadSequence || null,
            embroideryFileUrls: pos.embroideryFileUrls || [],
          })),
        });
      }

      // 3. Return refreshed order
      return await tx.order.findUnique({
        where: { id: orderIdInt },
        include: this.getStandardInclude(),
      });
    });

    return this.normalize(result, user);
  }

  /**
   * Generate PDF Buffer
   */
  async generatePDF(orderId, type) {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: this.getStandardInclude(),
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const normalizedOrder = this.normalize(order);

    if (type === "jobsheet") return await generateJobSheetPDF(normalizedOrder);
    return await generateCustomerProofPDF(normalizedOrder);
  }

  /**
   * Upload Embroidery File (.EMB) and advance status
   */
  async uploadEmbroidery(orderId, data, user) {
    const { embroideryFileUrl } = data;
    const id = parseInt(orderId);

    // --- S3 Cleanup ---
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { embroideryFileUrl: true },
    });
    if (currentOrder) {
      await this.cleanupFile(currentOrder.embroideryFileUrl, embroideryFileUrl);
    }

    const result = await prisma.order.update({
      where: { id },
      data: {
        embroideryFileUrl,
        status: OrderStatus.PENDING_ARTWORK, // Once digitized, it goes to Graphic for mockup
        digitizingCompletedAt: new Date(),
        logs: {
          create: {
            action: "🧵 อัปโหลดไฟล์ตีลาย (.EMB)",
            details: `อัปโหลดไฟล์เรียบร้อยโดย ${user.name}. ส่งต่อให้ฝ่ายกราฟิก`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });

    return this.normalize(result, user);
  }
  /**
   * Daily Production Report (Supervisor Feature)
   */
  async createDailyReport(data, user) {
    return await prisma.dailyProductionReport.create({
      data: {
        ...data,
        foremanId: user.id,
      },
    });
  }

  async getDailyReports(filters = {}) {
    return await prisma.dailyProductionReport.findMany({
      where: filters,
      include: {
        foreman: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  // Reject / Return Order with error tracking
  async rejectOrder(orderId, data, user) {
    const { targetRole, reason, damagedCount, isSalesError } = data;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) throw new Error("Order not found");

    // Determine New Status based on targetRole
    let newStatus;
    switch (targetRole) {
      case "GRAPHIC":
        newStatus = OrderStatus.PENDING_ARTWORK;
        break;
      case "PRODUCTION":
        newStatus = OrderStatus.STOCK_RECHECKED; // Return to waiting for production start
        break;
      case "STOCK":
        newStatus = OrderStatus.PENDING_STOCK_CHECK;
        break;
      case "DIGITIZER":
        newStatus = OrderStatus.PENDING_DIGITIZING;
        break;
      default:
        throw new Error(
          "Target role for rejection is invalid or not supported for direct return",
        );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: newStatus,
        rejectionCount: { increment: 1 },
        damagedCount: { increment: safeNumber(damagedCount) },
        rejections: {
          create: {
            fromRole: user.role,
            toRole: targetRole,
            reason: reason,
            isSalesError: !!isSalesError,
            userId: user.id,
          },
        },
        logs: {
          create: {
            action: `ตีกลับงาน (${RoleLabels[targetRole] || targetRole})`,
            details: `สาเหตุ: ${reason}${damagedCount > 0 ? ` | ของเสีย: ${damagedCount} ตัว` : ""}${isSalesError ? " (ผิดพลาดจากข้อมูลฝ่ายขาย)" : ""}`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });

    return updatedOrder;
  }

  // Notify Sales when production is finished if there's a balance
  async notifySalesOnProductionFinish(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { sales: true },
    });

    if (!order) return;

    const balance = parseFloat(order.balanceDue || 0);

    if (balance > 0) {
      await prisma.notification.create({
        data: {
          userId: order.salesId,
          orderId: order.id,
          type: "PAYMENT_REMINDER",
          message: `งาน ${order.displayJobCode || order.jobId} (ลูกค้า: ${order.customerName}) ผลิตเสร็จแล้ว แต่ยังมียอดค้างชำระ ${balance.toLocaleString()} บาท กรุณาเร่งรัดการชำระเงินก่อนจัดส่ง`,
        },
      });
    }
  }

  // Update SLA Buffer Level (Executive only)
  async updateOrderSLABuffer(orderId, bufferLevel, user) {
    const level = parseInt(bufferLevel || 0);

    return await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        slaBufferLevel: level,
        logs: {
          create: {
            action: "ปรับระดับ Buffer SLA",
            details: `ผู้บริหาร ${user.name} ปรับระดับ Buffer เป็น ${level} วัน`,
            userId: user.id,
          },
        },
      },
      include: this.getStandardInclude(),
    });
  }
}

export default new OrderService();
