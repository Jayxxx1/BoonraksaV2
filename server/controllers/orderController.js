import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";
import QRCode from "qrcode";
import s3Provider from "../src/services/providers/s3.provider.js";
import config from "../src/config/config.js";
import {
  generateJobSheetPDF,
  generateCustomerProofPDF,
} from "../services/pdfService.js";
import orderService from "../modules/orders/order.service.js";
import https from "https";
import fs from "fs";
import path from "path";

/**
 * Standard Include for Order used across multiple controllers
 */
export const standardOrderInclude = {
  items: { include: { variant: { include: { product: true } } } },
  sales: {
    select: {
      id: true,
      name: true,
      role: true,
      username: true,
      salesNumber: true,
    },
  },
  graphic: { select: { id: true, name: true, role: true } },
  qc: { select: { id: true, name: true, role: true } },
  stock: { select: { id: true, name: true, role: true } },
  production: { select: { id: true, name: true, role: true } },
  digitizer: { select: { id: true, name: true, role: true } },
  salesChannel: true,
  block: true,
  positions: true, // 🆕 ตำแหน่งรายละเอียดตารางปักแยก
  productionLogs: {
    // 🆕 Log การผลิตแยกชุด
    include: { user: { select: { name: true } } },
    orderBy: { timestamp: "desc" },
  },
  paymentSlips: {
    include: { uploader: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  },
  logs: {
    include: { user: { select: { name: true, role: true } } },
    orderBy: { timestamp: "desc" },
  },
};

/**
 * Helper to mask staff names for Sales role
 */
const maskStaffNamesForSales = (order, userRole) => {
  if (userRole !== "SALES") return order;

  const maskedOrder = { ...order };
  const roleNames = {
    GRAPHIC: "ฝ่ายกราฟิก",
    STOCK: "ฝ่ายสต็อก",
    PRODUCTION: "ฝ่ายผลิต",
    SEWING_QC: "ฝ่าย QC",
    PURCHASING: "ฝ่ายจัดซื้อ",
    DELIVERY: "ฝ่ายจัดส่ง",
    DIGITIZER: "ฝ่ายตีลาย",
  };

  if (maskedOrder.graphic)
    maskedOrder.graphic = { ...maskedOrder.graphic, name: roleNames.GRAPHIC };
  if (maskedOrder.stock)
    maskedOrder.stock = { ...maskedOrder.stock, name: roleNames.STOCK };
  if (maskedOrder.production)
    maskedOrder.production = {
      ...maskedOrder.production,
      name: roleNames.PRODUCTION,
    };
  if (maskedOrder.qc)
    maskedOrder.qc = { ...maskedOrder.qc, name: roleNames.QC };
  if (maskedOrder.digitizer)
    maskedOrder.digitizer = {
      ...maskedOrder.digitizer,
      name: roleNames.DIGITIZER,
    };

  return maskedOrder;
};

/**
 * Helper to strip financial/customer data for Technical roles
 */
const stripSensitiveDataForTechnicalRoles = (order, userRole) => {
  const technicalRoles = [
    "GRAPHIC",
    "DIGITIZER",
    "PRODUCTION",
    "SEWING_QC",
    "STOCK",
    "DELIVERY",
  ];
  if (!technicalRoles.includes(userRole)) return order;

  const strippedOrder = { ...order };

  // Hide financials
  delete strippedOrder.totalPrice;
  delete strippedOrder.paidAmount;
  delete strippedOrder.balanceDue;
  delete strippedOrder.deposit;
  delete strippedOrder.unitPrice;
  delete strippedOrder.blockPrice;
  delete strippedOrder.paymentStatus;
  delete strippedOrder.paymentSlips;

  // Hide customer details
  delete strippedOrder.customerPhone;
  delete strippedOrder.customerAddress;
  delete strippedOrder.customerFb;

  return strippedOrder;
};

/**
 * Helper to automatically mark orders older than 3 days as urgent
 */
let lastAutoUpdate = 0;
const AUTO_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

export const autoUpdateUrgentOrders = async () => {
  const now = Date.now();
  if (now - lastAutoUpdate < AUTO_UPDATE_INTERVAL) return;
  lastAutoUpdate = now;

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    // 1. Find orders that should be marked as urgent
    const staleOrders = await prisma.order.findMany({
      where: {
        isUrgent: false,
        createdAt: { lte: threeDaysAgo },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: { id: true, displayJobCode: true },
    });

    if (staleOrders.length === 0) return;

    // 2. Update them to urgent
    await prisma.order.updateMany({
      where: { id: { in: staleOrders.map((o) => o.id) } },
      data: { isUrgent: true },
    });

    // 3. Create ActivityLogs for each (System Log)
    const logData = staleOrders.map((o) => ({
      orderId: o.id,
      action: "AUTO_URGENT",
      details: `ระบบปรับออเดอร์ ${o.displayJobCode} เป็นงานด่วนเนื่องจากค้างในระบบมากกว่า 3 วัน`,
      userId: null, // System Log - No specific user
    }));

    await prisma.activityLog.createMany({
      data: logData,
    });

    console.log(
      `[AUTO-URGENT] System marked ${staleOrders.length} stale orders as urgent.`,
    );
  } catch (error) {
    console.error("[AUTO-URGENT-ERROR]", error);
  }
};

/**
 * Step 1: Sales opens a bill
 */
export const createOrder = asyncHandler(async (req, res) => {
  // 🆕 RBAC: Only SALES, MARKETING, and SUPER_ADMIN can create orders
  if (!["SALES", "MARKETING", "SUPER_ADMIN"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ status: "fail", message: "คุณไม่มีสิทธิ์ในการสร้างออเดอร์" });
  }

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
    items, // [{ variantId, productName, price, quantity, details }]
    totalPrice,
    paidAmount,
    blockPrice,
    unitPrice,
    embroideryDetails,
    depositSlipUrl,
    draftImages,
  } = req.body;

  // Helper to ensure numbers are safe for Prisma Decimal/Int
  const safeNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ status: "fail", message: "Order must have at least one item" });
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // --- 1. PREPARE DATA & VALIDATION ---

        // Logic for legacy import
        const { legacyJobCode } = req.body;

        let initialDisplayCode;
        if (legacyJobCode) {
          // If importing, use provided code. DB unique constraint will handle duplicates.
          initialDisplayCode = legacyJobCode;
        } else {
          // Use temporary unique placeholder (Transaction will update this immediately)
          initialDisplayCode = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        }

        // 3. Block Type Mapping
        const bTypeMap = {
          บล็อคเดิม: "OLD",
          บล็อคเดิมเปลี่ยนข้อความ: "EDIT",
          บล็อคเดิมแก้ข้อความ: "EDIT",
          บล็อคใหม่: "NEW",
        };
        const validEnums = ["OLD", "EDIT", "NEW"];
        const mappedBlockType = validEnums.includes(blockType)
          ? blockType
          : bTypeMap[blockType] || "OLD";

        // Logic for status
        const isNewBlock = mappedBlockType === "NEW";
        const initialStatus = isNewBlock
          ? "PENDING_DIGITIZING"
          : "PENDING_ARTWORK";
        let subStatus = null;
        const purchaseRequests = [];

        for (const item of items) {
          if (!item.variantId)
            throw new Error("Missing variantId in one or more items");

          const variant = await tx.productVariant.findUnique({
            where: { id: parseInt(item.variantId) },
            select: { stock: true },
          });

          if (!variant)
            throw new Error(`Product variant ${item.variantId} not found`);

          const qty = safeNumber(item.quantity);
          if (variant.stock < qty) {
            // สร้าง purchase request และตั้งสถานะย่อย
            subStatus = "กำลังสั่งซื้อ";
            purchaseRequests.push({
              variantId: parseInt(item.variantId),
              quantity: qty - variant.stock,
            });
          }
        }

        // 2. Financials
        const total = safeNumber(totalPrice);
        const paid = safeNumber(paidAmount);
        const balance = total - paid;
        let paymentStatus = "UNPAID";
        if (paid > 0) {
          paymentStatus = paid >= total ? "PAID" : "PARTIALLY_PAID";
        }

        // 4. Create the Order (Step 1: Create with Temp/Legacy Code)
        let order = await tx.order.create({
          data: {
            displayJobCode: initialDisplayCode,
            legacyJobCode: legacyJobCode || null,
            // (systemJobNo is auto-incremented by DB)

            customerName: customerName || "-",
            customerPhone: customerPhone || "",
            customerAddress: customerAddress || "",
            customerFb: customerFb || "",
            salesChannelId: salesChannelId ? parseInt(salesChannelId) : null,
            isUrgent: !!isUrgent,
            blockType: mappedBlockType,
            embroideryDetails: Array.isArray(embroideryDetails)
              ? embroideryDetails
              : [],
            totalPrice: total,
            deposit: paid,
            paidAmount: paid,
            balanceDue: balance,
            paymentStatus,
            depositSlipUrl: depositSlipUrl || null,
            draftImages: Array.isArray(draftImages) ? draftImages : [],
            blockPrice: safeNumber(blockPrice),
            unitPrice: safeNumber(unitPrice),
            status: initialStatus,
            subStatus: subStatus,
            dueDate:
              dueDate && !isNaN(Date.parse(dueDate)) ? new Date(dueDate) : null,
            notes: notes || "",
            salesId: req.user.id,
            items: {
              create: items.map((item) => ({
                variantId: parseInt(item.variantId),
                productName: item.productName || "Unknown Product",
                price: safeNumber(item.price),
                quantity: Math.max(0, parseInt(item.quantity) || 0),
                details: item.details || {},
              })),
            },
            // 🆕 บันทึกรายการตำแหน่งปักแยกตาราง (Structured Positions)
            positions: {
              create: (Array.isArray(embroideryDetails)
                ? embroideryDetails
                : []
              ).map((pos) => ({
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

        // 4.1 UPDATE Job ID (Step 2: If not legacy, generate formatted code using systemJobNo)
        if (!legacyJobCode) {
          const salesPrefix = req.user.salesNumber || String(req.user.id);
          const finalCode = `${salesPrefix}/${order.systemJobNo}`;

          order = await tx.order.update({
            where: { id: order.id },
            data: { displayJobCode: finalCode },
          });
        }

        // Map for response compatibility
        order.jobId = order.displayJobCode;

        // 4.5 Create Initial Payment Slip if exists
        console.log("DEBUG: Checking Initial Slip", { paid, depositSlipUrl });
        if (paid > 0 && depositSlipUrl) {
          console.log("DEBUG: Creating Payment Slip record...");
          try {
            await tx.paymentSlip.create({
              data: {
                orderId: order.id,
                amount: paid,
                slipUrl: depositSlipUrl,
                note: "เงินมัดจำ",
                uploadedBy: req.user.id,
              },
            });
            console.log("DEBUG: Payment Slip Created Successfully");
          } catch (err) {
            console.error("DEBUG: Payment Slip Creation Failed", err);
          }
        } else {
          console.log("DEBUG: Skipping Payment Slip Creation");
        }

        // 5. Deduct stock
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

        // 6. Purchase Requests
        if (purchaseRequests.length > 0) {
          await tx.purchaseRequest.createMany({
            data: purchaseRequests.map((pr) => ({
              orderId: order.id,
              variantId: pr.variantId,
              quantity: pr.quantity,
            })),
          });
        }

        // 7. Activity Log
        await tx.activityLog.create({
          data: {
            action: "สร้างออเดอร์",
            details: `สร้างออเดอร์ใหม่เลขที่ ${order.displayJobCode} โดย ${req.user.id} (สถานะ: รอวางแบบ)`,
            orderId: order.id,
            userId: req.user.id,
          },
        });

        return order;
      });

      return res.status(201).json({
        status: "success",
        data: { order: result },
      });
    } catch (error) {
      // Handle Unique Constraint Violation for dailyRunning (Race Condition)
      const isUniqueViolation =
        error.code === "P2002" &&
        (error.meta?.target?.includes("dailyRunning") ||
          error.meta?.constraint?.includes("sales_daily_running"));

      if (isUniqueViolation) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error(
            `[CONCURRENCY-FAILURE] Max retries reached for salesperson ${req.user.id}`,
          );
          return res.status(409).json({
            status: "fail",
            message:
              "ระบบไม่สามารถสร้างเลขลำดับออเดอร์ให้คุณได้ในขณะนี้เนื่องจากมีการใช้งานพร้อมกันจำนวนมาก กรุณาลองใหม่อีกครั้ง",
          });
        }
        console.log(
          `[RETRY] Order creation attempt ${attempts} failed due to race condition. Retrying for salesperson ${req.user.id}...`,
        );
        continue; // Try again the whole transaction
      }

      // Other database or logic errors
      console.error("[CREATE-ORDER-ERROR]", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal Server Error during order creation",
      });
    }
  }
});

/**
 * Get all orders (with filters for different roles)
 */
export const getOrders = asyncHandler(async (req, res) => {
  // 🆕 RBAC: SUPER_ADMIN bypasses all restrictions
  if (req.user.role === "SUPER_ADMIN") {
    // No restrictions – SUPER_ADMIN sees everything
  } else if (
    !["SALES", "MARKETING", "ADMIN", "EXECUTIVE", "FINANCE"].includes(
      req.user.role,
    )
  ) {
    // Note: Allowing management roles to still see the list, but restricting technical roles
    // if they try to access the generic order list without a specific 'view'
    if (!req.query.view) {
      return res.status(403).json({
        status: "fail",
        message: "คุณไม่มีสิทธิ์เข้าถึงรายการสั่งซื้อ",
      });
    }
  }

  const { status, view, search } = req.query;
  const where = {};

  // 🆕 Auto-update urgency for stale orders
  await autoUpdateUrgentOrders();

  if (status) where.status = status;

  // Debug Logging
  console.log(
    `[DEBUG_ORDER] User: ${req.user.username} (${req.user.role}) ID: ${req.user.id}`,
  );
  console.log(`[DEBUG_ORDER] View: ${view}, Search: ${search}`);

  // Search filter - supports jobId and customerName
  if (search) {
    where.OR = [
      { jobId: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Role-based filtering (SUPER_ADMIN skips all filtering)
  if (req.user.role === "SUPER_ADMIN") {
    // SUPER_ADMIN sees all orders, no filtering
  } else if (req.user.role === "SALES") {
    // Sales are strictly restricted to their own orders
    where.salesId = req.user.id;
  } else if (view === "me") {
    switch (req.user.role) {
      case "GRAPHIC":
        where.graphicId = req.user.id;
        break;
      case "SEWING_QC":
        where.qcId = req.user.id;
        break;
      case "STOCK":
        where.stockId = req.user.id;
        break;
      case "PRODUCTION":
        where.productionId = req.user.id;
        break;
      case "DIGITIZER":
        where.digitizerId = req.user.id;
        break;
      default:
        where.salesId = req.user.id;
    }
    // "My Tasks" should only show active tasks (not completed or cancelled)
    where.status = { notIn: ["COMPLETED", "CANCELLED"] };
  } else if (view === "available") {
    if (req.user.role === "GRAPHIC") {
      where.graphicId = null;
      where.status = { in: ["PENDING_ARTWORK", "DESIGNING"] };
    } else if (req.user.role === "DIGITIZER") {
      where.digitizerId = null;
      where.status = "PENDING_DIGITIZING";
    } else if (req.user.role === "STOCK") {
      where.stockId = null;
      where.status = { in: ["PENDING_STOCK_CHECK", "STOCK_ISSUE"] };
    } else if (req.user.role === "PRODUCTION") {
      where.productionId = null;
      where.status = { in: ["STOCK_RECHECKED", "IN_PRODUCTION"] };
    } else if (req.user.role === "SEWING_QC") {
      where.qcId = null;
      where.status = "PRODUCTION_FINISHED";
    } else if (req.user.role === "PURCHASING") {
      where.purchaseRequests = { some: { status: "PENDING" } };
    }
  } else if (view === "history") {
    // History is ALWAYS restricted to own tasks for technical roles
    switch (req.user.role.trim()) {
      case "GRAPHIC":
        where.graphicId = req.user.id;
        where.status = { notIn: ["PENDING_ARTWORK", "DESIGNING"] };
        break;
      case "STOCK":
        // Strict filtering for Stock History
        where.stockId = req.user.id;
        where.status = { notIn: ["PENDING_STOCK_CHECK"] };
        break;
      case "PRODUCTION":
        where.productionId = req.user.id;
        where.status = { notIn: ["PENDING_STOCK_CHECK", "IN_PRODUCTION"] };
        break;
      case "SEWING_QC":
        where.qcId = req.user.id;
        where.status = { notIn: ["PRODUCTION_FINISHED"] };
        break;
      case "DELIVERY":
        where.status = "COMPLETED";
        break;
      default:
        where.salesId = req.user.id;
        where.status = "COMPLETED";
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { variant: { include: { product: true } } } },
      sales: {
        select: {
          id: true,
          name: true,
          role: true,
          username: true,
          salesNumber: true,
        },
      },
      graphic: { select: { id: true, name: true, role: true } },
      stock: { select: { id: true, name: true, role: true } },
      production: { select: { id: true, name: true, role: true } },
      salesChannel: true,
    },
    orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
  });
  console.log(`[DEBUG_ORDER] Final Where:`, JSON.stringify(where, null, 2));

  const processedOrders = orders.map((o) => {
    let processedOrder = maskStaffNamesForSales(o, req.user.role);
    processedOrder = stripSensitiveDataForTechnicalRoles(
      processedOrder,
      req.user.role,
    );
    return processedOrder;
  });

  res.status(200).json({
    status: "success",
    data: { orders: processedOrders },
  });
});

/**
 * Get all sales channels
 */
export const getSalesChannels = asyncHandler(async (req, res) => {
  const channels = await prisma.salesChannel.findMany({
    orderBy: { code: "asc" },
  });

  res.status(200).json({
    status: "success",
    data: { channels },
  });
});

/**
 * Get single order by ID
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: standardOrderInclude,
  });

  if (!order) {
    return res.status(404).json({ status: "fail", message: "Order not found" });
  }

  // Permission check: Sales can only see their own orders
  if (req.user.role === "SALES" && order.salesId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Access denied" });
  }

  let processedOrder = maskStaffNamesForSales(order, req.user.role);
  processedOrder = stripSensitiveDataForTechnicalRoles(
    processedOrder,
    req.user.role,
  );

  res.status(200).json({ status: "success", data: { order: processedOrder } });
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
      status: status || undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "PURCHASING_UPDATE",
      details: `ฝ่ายจัดซื้อ ${req.user.name} อัปเดตข้อมูลพัสดุ/ETA (สถานะ: รอวางแบบ)`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * Step 2: Graphic claims task (Assign Graphic)
 */
export const assignGraphic = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      graphicId: req.user.id,
      status: "DESIGNING", // เปลี่ยนจาก PENDING_ARTWORK → DESIGNING
    },
    include: standardOrderInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: "CLAIM_GRAPHIC",
      details: `ฝ่ายกราฟิก ${req.user.name} รับงานออกแบบ → กำลังวางแบบ`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
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
      // FUTURE INTEGRATION: artworkUrl should ideally point to the S3 Key
      // or metadata entry for the final design file.
      artworkUrl,
      // status: 'PENDING_STOCK_CHECK', // Don't auto-advance. Let Graphic click "Send to Stock"
      graphicId: req.user.id,
    },
    include: standardOrderInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: "UPLOAD_ARTWORK",
      details: `ฝ่ายกราฟิก ${req.user.name} อัปเดตไฟล์ Artwork เรียบร้อย → รอสต็อคเช็ค`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
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
    productionFileName,
  } = req.body;

  const order = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (embroideryDetails) {
      updateData.embroideryDetails = embroideryDetails; // Legacy JSON field fallback

      // Update actual positions
      for (const pos of embroideryDetails) {
        if (pos.id) {
          await tx.orderEmbroideryPosition.update({
            where: { id: parseInt(pos.id) },
            data: {
              mockupUrl:
                pos.mockupUrl !== undefined ? pos.mockupUrl : undefined,
              fileAddress:
                pos.fileAddress !== undefined ? pos.fileAddress : undefined,
              needlePattern:
                pos.needlePattern !== undefined ? pos.needlePattern : undefined,
              embroideryFileUrls: Array.isArray(pos.embroideryFileUrls)
                ? pos.embroideryFileUrls
                : undefined,
              threadSequence:
                pos.threadSequence !== undefined
                  ? pos.threadSequence
                  : undefined,
            },
          });
        }
      }
    }

    if (artworkUrl) updateData.artworkUrl = artworkUrl;
    if (productionFileUrl) updateData.productionFileUrl = productionFileUrl;
    if (productionFileName) updateData.productionFileName = productionFileName;

    return await tx.order.update({
      where: { id: parseInt(orderId) },
      data: {
        ...updateData,
        logs: {
          create: {
            action: "อัปเดตสเปคทางเทคนิค",
            details: `${req.user.role} ${req.user.name} อัปเดตงานปัก/ไฟล์งานหรือรายละเอียดรายจุด`,
            userId: req.user.id,
          },
        },
      },
      include: standardOrderInclude,
    });
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * Step 4: Graphic prints Job Sheet
 */
export const printJobSheetSignal = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  const allowedStatuses = [
    "PENDING_ARTWORK",
    "DESIGNING",
    "PENDING_PAYMENT",
    "PENDING_STOCK_CHECK",
  ];
  if (!allowedStatuses.includes(order.status)) {
    return res.status(400).json({
      status: "fail",
      message: `ออเดอร์อยู่ในสถานะ ${order.status} ไม่สามารถส่งต่อสต็อกได้`,
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "PENDING_STOCK_CHECK",
      logs: {
        create: {
          action: "ฝ่ายกราฟิกส่งใบงานเข้าสต็อก",
          details: `ฝ่ายกราฟิก ${req.user.name} พิมพ์ใบงาน (Job Sheet) และส่งต่อฝ่ายสต็อกแล้ว`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
});

/**
 * Step 5: Stock rechecks physical items
 */
export const confirmStockRecheck = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  if (
    order.status !== "PENDING_STOCK_CHECK" &&
    order.status !== "STOCK_ISSUE"
  ) {
    return res
      .status(400)
      .json({ status: "fail", message: "ออเดอร์ไม่อยู่ในขั้นตอนรอเช็คสต็อก" });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "STOCK_RECHECKED",
      stockId: req.user.id,
      logs: {
        create: {
          action: "พนักงานฝ่ายสต็อกยืนยันสต็อกครบ",
          details: `สต็อก ${req.user.name} ยืนยันว่าพัสดุครบถ้วน พร้อมสำหรับการผลิต (STOCK_RECHECKED)`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
});

/**
 * Step 6: Production starts
 */
export const startProduction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });

  // Allow start ONLY if Stock Rechecked OR if already In Production (idempotent)
  if (order.status !== "STOCK_RECHECKED" && order.status !== "IN_PRODUCTION") {
    return res.status(400).json({
      status: "fail",
      message:
        "ต้องผ่านการเช็คสต็อกก่อนเริ่มผลิต (Status: " + order.status + ")",
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "IN_PRODUCTION",
      productionId: req.user.id,
    },
    include: standardOrderInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: "START_PRODUCTION",
      details: `ฝ่ายผลิต ${req.user.name} เริ่มดำเนินการผลิต (In Production)`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * Step 6: Production finishes (รวม QC)
 */
export const finishProduction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  if (order.status !== "IN_PRODUCTION") {
    return res.status(400).json({
      status: "fail",
      message: "ออเดอร์ต้องอยู่ในกระบวนการผลิตเท่านั้น",
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "PRODUCTION_FINISHED",
      productionId: req.user.id,
      logs: {
        create: {
          action: "ผลิตเสร็จสิ้น/ส่งตรวจ QC",
          details: `ฝ่ายผลิต ${req.user.name} ผลิตเสร็จสมบูรณ์ → ส่งต่อฝ่าย QC`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  // 🔔 Notify Sales for payment if needed
  await orderService.notifySalesOnProductionFinish(orderId);

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
});

/**
 * Step 7: QC Pass/Fail
 */
export const passQC = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { pass, reason, returnTo } = req.body; // Added reason and returnTo

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (order.status !== "PRODUCTION_FINISHED") {
    return res
      .status(400)
      .json({ status: "fail", message: "ออเดอร์ต้องผลิตเสร็จก่อนตรวจสอบ QC" });
  }

  // Determine new status if fail
  let nextStatus = order.status;
  if (pass) {
    nextStatus = "READY_TO_SHIP";
  } else {
    // Determine where to return
    if (returnTo === "GRAPHIC") {
      nextStatus = "DESIGNING";
    } else {
      nextStatus = "IN_PRODUCTION";
    }
  }

  const isUnpaid =
    parseFloat(order.balanceDue) > 0 && order.paymentMethod !== "COD";

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: nextStatus,
      qcId: req.user.id,
      logs: {
        create: {
          action: pass ? "QC_PASS" : "QC_FAIL",
          details: pass
            ? `QC ${req.user.name} ตรวจสอบผล: ผ่าน (PASS) → รอจัดส่ง${isUnpaid ? " (⚠️ ยังชำระเงินไม่ครบ)" : ""}`
            : `QC ${req.user.name} ตรวจสอบผล: ไม่ผ่าน (FAIL) → ส่งกลับ${returnTo === "GRAPHIC" ? "ฝ่ายกราฟิก" : "ฝ่ายผลิต"} (เหตุผล: ${reason || "ไม่ได้ระบุ"})`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
});

/**
 * Step 8: Ready to ship
 */
export const readyToShip = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (order.status !== "QC_PASSED") {
    return res
      .status(400)
      .json({ status: "fail", message: "ออเดอร์ต้องผ่าน QC ก่อนเตรียมจัดส่ง" });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "READY_TO_SHIP",
      logs: {
        create: {
          action: "สินค้าพร้อมจัดส่ง",
          details: `Order marked as ready to ship by ${req.user.name}`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
});

/**
 * Step 9: Delivery completes order (THE PAYMENT GATE)
 */
export const completeOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { trackingNo } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });

  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  if (order.status !== "READY_TO_SHIP" && order.status !== "QC_PASSED") {
    return res.status(400).json({
      status: "fail",
      message: "ออเดอร์ต้องอยู่ในสถานะรอจัดส่งหรือผ่าน QC แล้วเท่านั้น",
    });
  }

  if (!trackingNo) {
    return res
      .status(400)
      .json({ status: "fail", message: "กรุณาระบุเลขพัสดุ (Tracking No.)" });
  }

  // PAYMENT GATE LOGIC
  const isPaid = parseFloat(order.balanceDue) <= 0;
  const isCOD = order.paymentMethod === "COD";

  if (!isPaid && !isCOD) {
    return res.status(400).json({
      status: "fail",
      message: `Payment Incomplete! Balance Due: ${order.balanceDue}. 
      หากลูกค้าต้องการจ่ายปลายทาง กรุณาแจ้งฝ่ายขายให้เปลี่ยนเป็นระบบ COD ก่อนครับ`,
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      trackingNo,
      status: "COMPLETED",
    },
    include: standardOrderInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: "COMPLETED",
      details: `ออเดอร์เสร็จสมบูรณ์ เลขติดตามพัสดุ: ${trackingNo}`,
      orderId: updatedOrder.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
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
      positions: true,
      sales: { select: { name: true } },
      salesChannel: true,
    },
  });

  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  try {
    // Generate PDF using Puppeteer service
    const pdfBuffer = await generateJobSheetPDF(order);
    const buffer = Buffer.from(pdfBuffer);
    // console.log(`[ORDER-CTRL] PDF generated for ${order.jobId}, size: ${buffer.length} bytes`);

    const filename = `JobSheet-${order.jobId.replace(/\//g, "-")}.pdf`;

    // Set headers exactly as suggested by user for maximum reliability
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
    });

    // Use end() to send raw binary buffer directly
    res.end(buffer);
  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to generate PDF: ${error.message}`,
    });
  }
});

/**
 * Generate and Download Proof Sheet PDF for Customer
 */
export const downloadCustomerProofPDF = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      positions: true,
      sales: { select: { name: true } },
    },
  });

  if (!order)
    return res.status(404).json({ status: "fail", message: "Order not found" });

  try {
    const pdfBuffer = await generateCustomerProofPDF(order);
    const buffer = Buffer.from(pdfBuffer);

    const filename = `ProofSheet-${order.jobId.replace(/\//g, "-")}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
    });

    res.end(buffer);
  } catch (error) {
    console.error("CUSTOMER PROOF PDF GENERATION ERROR:", error);
    res.status(500).json({
      status: "error",
      message: "Cloud build error or PDF generation failed",
    });
  }
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
      status: "CANCELLED",
      cancelReason: reason,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "CANCEL_ORDER",
      details: `ยกเลิกออเดอร์โดย ${req.user.name} (เหตุผล: ${reason})`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
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
      urgentNote: note,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "เร่งด่วน",
      details: `ฝ่ายขาย ${req.user.name} แจ้งเร่งออเดอร์ด่วน (หมายเหตุ: ${note})`,
      orderId: order.id,
      userId: req.user.id,
    },
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * Technical roles (GRAPHIC, QC) claim an order to work on it
 */
export const claimOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });

  if (!order) {
    return res.status(404).json({ status: "fail", message: "Order not found" });
  }

  const updateData = {};
  let actionLabel = "";
  let actionDetails = "";

  if (role === "GRAPHIC") {
    if (order.graphicId && order.graphicId !== userId) {
      return res.status(400).json({
        status: "fail",
        message: "This order is already claimed by another graphic designer",
      });
    }
    updateData.graphicId = userId;
    updateData.status = "DESIGNING"; // Auto-start designing upon claim
    actionLabel = "ฝ่ายกราฟิกรับงานออกแบบ";
    actionDetails = `ฝ่ายกราฟิก ${req.user.name} รับงานออกแบบ → กำลังวางแบบ`;
  } else if (role === "SEWING_QC") {
    if (order.qcId && order.qcId !== userId) {
      return res.status(400).json({
        status: "fail",
        message: "This order is already claimed by another QC",
      });
    }
    updateData.qcId = userId;
    actionLabel = "ฝ่ายqcรับงาน";
    actionDetails = `พนักงานฝ่าย QC คุณ${req.user.name} รับงานตรวจคุณภาพเรียบร้อย`;
  } else if (role === "STOCK") {
    if (order.stockId && order.stockId !== userId) {
      return res.status(400).json({
        status: "fail",
        message: "This order is already claimed by another Stock staff",
      });
    }
    updateData.stockId = userId;
    actionLabel = "พนักงานฝ่ายสต็อกรับงาน";
    actionDetails = `พนักงานฝ่ายสต็อก คุณ${req.user.name} รับงานเช็คสต็อกเรียบร้อย`;
  } else if (role === "PRODUCTION") {
    if (order.productionId && order.productionId !== userId) {
      return res.status(400).json({
        status: "fail",
        message: "This order is already claimed by another Production staff",
      });
    }
    updateData.productionId = userId;
    updateData.assignedWorkerName = req.body.assignedWorkerName || null;
    updateData.status = "IN_PRODUCTION"; // Auto-start production upon claim
    actionLabel = "ฝ่ายผลิตรับงาน";
    actionDetails = req.body.assignedWorkerName
      ? `ฝ่ายผลิต ${req.user.name} รับงานผลิต และมอบหมายให้คุณ ${req.body.assignedWorkerName}`
      : `ฝ่ายผลิต ${req.user.name} รับงานผลิต → กำลังผลิต`;
  } else if (role === "DIGITIZER") {
    if (order.digitizerId && order.digitizerId !== userId) {
      return res.status(400).json({
        status: "fail",
        message: "This order is already claimed by another digitizer",
      });
    }
    updateData.digitizerId = userId;
    actionLabel = "ฝ่ายตีลายรับงาน";
    actionDetails = `ฝ่ายตีลาย ${req.user.name} รับงานตีลายเรียบร้อย`;
  } else {
    return res.status(403).json({
      status: "fail",
      message: "Only Technical roles can claim orders",
    });
  }

  const roleMap = {
    GRAPHIC: "ออกแบบ",
    SEWING_QC: "QC",
    STOCK: "สต็อก",
    PRODUCTION: "ผลิต",
    DIGITIZER: "ตีลาย",
  };

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      ...updateData,
      logs: {
        create: {
          action: actionLabel,
          details:
            actionDetails ||
            `พนักงานฝ่าย${roleMap[role] || role} คุณ${req.user.name} กดรับงานเข้าความรับผิดชอบเรียบร้อย`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order: updatedOrder } });
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
      status: "STOCK_ISSUE",
      stockIssueReason: reason,
      stockId: req.user.id,
      logs: {
        create: {
          action: "ฝ่ายสต็อกแจ้งปัญหาสินค้า",
          details: `ฝ่ายสต็อก ${req.user.name} รายงานปัญหา: ${reason}`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * 🆕 Search Order by Job ID String (Production/Foreman)
 */
export const searchOrderByJobId = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      jobId: {
        equals: jobId.trim(),
        mode: "insensitive",
      },
    },
    include: standardOrderInclude,
  });

  if (!order) {
    return res.status(404).json({
      status: "fail",
      message: "ไม่พบเลขออเดอร์ (JOB ID) นี้ในระบบ",
    });
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

/**
 * 🆕 Log Production Start/Finish (Separate from Workflow status)
 */
export const logProductionAction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { action, details } = req.body; // Action: 'START' or 'FINISH'

  const id = parseInt(orderId);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ status: "fail", message: "Order not found" });
  }

  // Create Log Entry
  const logAction =
    action === "START"
      ? "START_TASK"
      : action === "COMPLETE"
        ? "COMPLETE_ORDER"
        : "FINISH_TASK";

  await prisma.productionLog.create({
    data: {
      orderId: order.id,
      userId: req.user.id,
      action: logAction,
      details: details || `Production Worker ${req.user.name} marked ${action}`,
    },
  });

  // If START, also update Order status to IN_PRODUCTION if it's currently at READY_TO_PRODUCE
  if (action === "START" && order.status === "READY_TO_PRODUCE") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "IN_PRODUCTION",
        productionId: req.user.id,
        logs: {
          create: {
            action: "เริ่มการผลิต",
            details: `พนักงานฝ่ายผลิต ${req.user.name} กดเริ่มงานผ่านระบบค้นหา`,
            userId: req.user.id,
          },
        },
      },
    });
  }

  // If COMPLETE (Foreman only check usually at route level, but extra safety here)
  if (action === "COMPLETE") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PRODUCTION_FINISHED", // Fixed from PRODUCT_FINISHED
        logs: {
          create: {
            action: "จบการผลิตทั้งหมด",
            details: `หัวหน้ากะ ${req.user.name} สั่งจบงานผลิตทั้งหมดผ่านระบบค้นหา`,
            userId: req.user.id,
          },
        },
      },
    });

    // 🔔 Notify Sales for payment
    await orderService.notifySalesOnProductionFinish(order.id);
  }

  res.status(200).json({ status: "success", message: "บันทึกสำเร็จ" });
});

/**
 * Step 2.1: Digitizer uploads EMB file and sends to Graphic
 */
export const uploadEmbroidery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { embroideryFileUrl, embroideryFileUrls } = req.body;

  if (!embroideryFileUrl) {
    return res
      .status(400)
      .json({ status: "fail", message: "กรุณาระบุ URL ของไฟล์ .EMB" });
  }

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      embroideryFileUrl: embroideryFileUrl || undefined,
      embroideryFileUrls: embroideryFileUrls || undefined,
      digitizerId: req.user.id,
      status: "PENDING_ARTWORK",
      digitizingCompletedAt: new Date(),
      logs: {
        create: {
          action: "🧵 อัปโหลดไฟล์ตีลาย (.EMB)",
          details: `ฝ่ายตีลาย ${req.user.name} อัปโหลดไฟล์ตีลายเรียบร้อย → ส่งต่อฝ่ายกราฟิก`,
          userId: req.user.id,
        },
      },
    },
    include: standardOrderInclude,
  });

  res.status(200).json({ status: "success", data: { order } });
});

/**
 * Reject / Return order to previous role
 */
export const rejectOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await orderService.rejectOrder(orderId, req.body, req.user);
  res.status(200).json({ status: "success", data: { order } });
});

export const updateOrderSLABuffer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { bufferLevel } = req.body;
  const order = await orderService.updateOrderSLABuffer(
    orderId,
    bufferLevel,
    req.user,
  );
  res.status(200).json({ status: "success", data: { order } });
});

export const downloadEmbroideryFile = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
  });

  if (!order || !order.embroideryFileUrl) {
    return res.status(404).json({
      status: "fail",
      message: "ไม่พบไฟล์ตีลายสำหรับออเดอร์นี้",
    });
  }

  const fileUrl = order.embroideryFileUrl;
  const fileName = `${order.displayJobCode || order.jobId}-design.emb`.replace(
    /\s+/g,
    "_",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(fileName)}"`,
  );
  res.setHeader("Content-Type", "application/octet-stream");

  if (fileUrl.startsWith("http")) {
    https
      .get(fileUrl, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
          return res.status(proxyRes.statusCode).json({
            status: "fail",
            message: "ไม่สามารถดาวน์โหลดไฟล์จาก S3 ได้",
          });
        }
        proxyRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("S3 Proxy Error:", err);
        res.status(500).json({ status: "error", message: "Download failed" });
      });
  } else {
    const localPath = path.resolve(fileUrl);
    if (!fs.existsSync(localPath)) {
      return res
        .status(404)
        .json({ status: "fail", message: "File not found on server" });
    }
    fs.createReadStream(localPath).pipe(res);
  }
});
