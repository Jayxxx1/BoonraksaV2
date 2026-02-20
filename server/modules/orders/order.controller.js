import orderService from "./order.service.js";
import { asyncHandler } from "../../src/middleware/error.middleware.js";
import { OrderErrorCodes } from "./order.constants.js";
import https from "https";
import fs from "fs";
import path from "path";
import prisma from "../../src/prisma/client.js";

const sendSuccess = (res, data, message = "", status = 200) => {
  res.status(status).json({ success: true, data, message });
};

const sendError = (res, code, message = "An error occurred", status = 400) => {
  res.status(status).json({ success: false, code, message });
};

export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.updateOrder(id, req.body, req.user);
  sendSuccess(res, { order }, "แก้ไขข้อมูลออเดอร์เรียบร้อยแล้ว");
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user);
  sendSuccess(res, { order }, "ออเดอร์ถูกสร้างเรียบร้อยแล้ว", 201);
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrder(id, req.user);
  if (!order)
    return sendError(
      res,
      OrderErrorCodes.ORDER_NOT_FOUND,
      "Order not found",
      404,
    );
  sendSuccess(res, { order });
});

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrders(req.query, req.user);
  sendSuccess(res, { orders });
});

export const getSalesChannels = asyncHandler(async (req, res) => {
  const channels = await orderService.getSalesChannels();
  sendSuccess(res, { channels });
});

export const searchOrderByJobId = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const order = await orderService.searchOrderByJobId(jobId, req.user);
  if (!order)
    return sendError(
      res,
      OrderErrorCodes.ORDER_NOT_FOUND,
      "ไม่พบเลขออเดอร์ (JOB ID) นี้ในระบบ",
      404,
    );
  sendSuccess(res, { order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.updateStatus(
      id,
      req.body.status,
      req.user,
      req.body,
    );
    sendSuccess(res, { order }, `Order status updated to ${req.body.status}`);
  } catch (error) {
    if (error.message === "PAYMENT_INCOMPLETE")
      return sendError(
        res,
        "PAYMENT_INCOMPLETE",
        "ยังชำระเงินไม่ครบ ไม่สามารถปิดงานได้",
      );
    if (error.message === "TRACKING_REQUIRED")
      return sendError(res, "TRACKING_REQUIRED", "กรุณาระบุเลขพัสดุ");
    throw error;
  }
});

export const claimTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.claimTask(id, req.user);
    sendSuccess(res, { order }, "รับงานเรียบร้อยแล้ว");
  } catch (error) {
    if (error.message === "UNAUTHORIZED_ACTION")
      return sendError(
        res,
        OrderErrorCodes.UNAUTHORIZED_ACTION,
        "สิทธิ์ของคุณไม่สามารถรับงานนี้ได้",
        403,
      );
    throw error;
  }
});

export const updateSpecs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.updateSpecs(id, req.body, req.user);
  sendSuccess(res, { order }, "อัปเดตสเปกงานเรียบร้อย");
});

export const updatePurchasingInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.updatePurchasingInfo(id, req.body, req.user);
  sendSuccess(res, { order }, "อัปเดตข้อมูลพัสดุเรียบร้อย");
});

export const logProductionAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await orderService.logProductionAction(id, req.body, req.user);
  sendSuccess(res, null, "บันทึกสำเร็จ");
});

export const uploadPaymentSlip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await orderService.uploadPaymentSlip(id, req.body, req.user);
  sendSuccess(res, result, "แจ้งชำระเงินเรียบร้อยแล้ว");
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await orderService.getPaymentHistory(id);
  sendSuccess(res, history);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.cancelOrder(id, req.body, req.user);
  sendSuccess(res, { order }, "ยกเลิกออเดอร์เรียบร้อยแล้ว");
});

export const bumpUrgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.bumpUrgent(id, req.body, req.user);
  sendSuccess(res, { order }, "ส่งสัญญาณเร่งด่วนเรียบร้อย");
});

export const printJobSheetSignal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.printJobSheetSignal(id, req.user);
  sendSuccess(res, { order }, "ส่งใบงานเข้าสต็อกเรียบร้อยแล้ว");
});

export const confirmStockRecheck = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.confirmStockRecheck(id, req.user);
  sendSuccess(res, { order }, "ยืนยันสต็อกเรียบร้อย");
});

export const startProduction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.startProduction(id, req.user);
  sendSuccess(res, { order }, "เริ่มการผลิตเรียบร้อย");
});

export const downloadPDF = asyncHandler(async (req, res) => {
  const { id, type } = req.params; // type: 'jobsheet' or 'proof'
  try {
    const buffer = await orderService.generatePDF(id, type);
    const filename = `${type.toUpperCase()}-${id}.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  } catch (error) {
    sendError(res, "PDF_ERROR", error.message);
  }
});

/**
 * Daily Production Reports
 */
export const createDailyReport = asyncHandler(async (req, res) => {
  const report = await orderService.createDailyReport(req.body, req.user);
  sendSuccess(res, { report }, "บันทึกรายงานประจำวันเรียบร้อยแล้ว");
});

export const getDailyReports = asyncHandler(async (req, res) => {
  const reports = await orderService.getDailyReports(req.query);
  sendSuccess(res, { reports });
});

export const downloadEmbroideryFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
  });

  if (!order || !order.embroideryFileUrl) {
    return res.status(404).json({
      success: false,
      message: "ไม่พบไฟล์ตีลายสำหรับออเดอร์นี้",
    });
  }

  const fileUrl = order.embroideryFileUrl;
  const fileName = `${order.displayJobCode || order.id}-design.emb`.replace(
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
            success: false,
            message: "ไม่สามารถดาวน์โหลดไฟล์จาก S3 ได้",
          });
        }
        proxyRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("S3 Proxy Error:", err);
        res.status(500).json({ success: false, message: "Download failed" });
      });
  } else {
    const localPath = path.resolve(fileUrl);
    if (!fs.existsSync(localPath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on server" });
    }
    fs.createReadStream(localPath).pipe(res);
  }
});
