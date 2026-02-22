import prisma from "../src/prisma/client.js";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import axios from "axios";

/**
 * Helper: Convert external URL or local path to Base64 Data URI
 */
const imageUrlToBase64 = async (url) => {
  if (!url) return url;

  // Handle local filesystem paths (for development/local storage)
  if (url.startsWith("/uploads/")) {
    try {
      const filePath = path.join(process.cwd(), url);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(url).slice(1).toLowerCase();
        const contentType = `image/${ext === "jpg" ? "jpeg" : ext || "png"}`;
        return `data:${contentType};base64,${data.toString("base64")}`;
      }
    } catch (err) {
      console.error(`[PDF-IMG-BASE64] Local file error for ${url}:`, err.message);
    }
  }

  if (!url.startsWith("http")) return url;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000, // 10s timeout
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const contentType = response.headers["content-type"] || "image/png";
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.error(`[PDF-IMG-BASE64] Failed to fetch ${url}:`, err.message);
    return url; // Fallback to original URL
  }
};

/**
 * Helper: Batch convert URLs to Base64 with caching
 */
const batchImageToBase64 = async (urls) => {
  const uniqueUrls = [
    ...new Set(urls.filter((u) => u && u.startsWith("http"))),
  ];
  const cache = {};
  await Promise.all(
    uniqueUrls.map(async (url) => {
      cache[url] = await imageUrlToBase64(url);
    }),
  );
  return cache;
};

/**
 * Generate a professional A4 Job Sheet PDF using Puppeteer
 * @param {Object} order - The order object with all relations
 */
export const generateJobSheetPDF = async (order) => {
  let browser = null;
  try {
    // console.log(`[PDF] Starting generation for Job: ${order.jobId}`);

    // 1. Generate QR Code as Base64
    const systemUrl = `http://localhost:3000/order/${order.id}`;
    const qrCodeBase64 = await QRCode.toDataURL(systemUrl);

    // 1.5 Fetch Master Positions for name-to-ID matching
    const masterPositions = await prisma.masterEmbroideryPosition.findMany();

    // 1.7 Prepare Spec Data with Base64 Images
    const tablePositions = order.positions || [];
    const jsonPositions = (order.embroideryDetails || []).map((p) => {
      let resolvedId = p.masterPositionId;
      if (!resolvedId && p.position) {
        const match = masterPositions.find((m) => m.name === p.position);
        if (match) resolvedId = match.id;
      }
      return {
        ...p,
        masterPositionId: resolvedId,
        position: p.position || "-",
      };
    });
    const specs = jsonPositions.length > 0 ? jsonPositions : tablePositions;

    // Collect all image URLs and batch convert to Base64
    const allUrls = [];
    specs.forEach((s) => {
      if (s.mockupUrl) allUrls.push(s.mockupUrl);
      if (s.logoUrl) allUrls.push(s.logoUrl);
    });
    (order.draftImages || []).forEach((img) => allUrls.push(img));
    if (order.artworkUrl) allUrls.push(order.artworkUrl);
    if (order.block?.artworkUrl) allUrls.push(order.block.artworkUrl);

    const imageMap = await batchImageToBase64(allUrls);

    // 2. Prepare HTML Template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <style>
          /* Use standard system fonts for speed and reliability */
          * {
            box-sizing: border-box;
            font-family: 'Tahoma', 'Arial', sans-serif;
          }
          
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background-color: white; color: #1e293b; }
          .page-container { width: 210mm; min-height: 297mm; padding: 5mm 8mm; margin: auto; position: relative; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .header-left h1 { font-size: 24px; margin: 0; letter-spacing: -0.5px; color: #0f172a; }
          .job-id { font-size: 20px; font-weight: bold; color: #4f46e5; margin: 5px 0; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: bold; text-transform: uppercase; border: 1px solid #e2e8f0; background: #f1f5f9; margin-right: 13px; }
          .badge-urgent { background: #fef2f2; color: #dc2626; border-color: #fee2e2; }
          .qr-container { text-align: right; }
          .qr-image { width: 100px; height: 100px; }
          .section { margin-bottom: 15px; }
          .section-title { background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 4px 12px; font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 13px; }
          .grid { display: flex; gap: 20px; }
          .col { flex: 1; }
          .col-2 { flex: 2; }
          .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 1px; }
          .value { font-size: 12px; font-weight: bold; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 13px; }
          th { background-color: #0f172a; color: white; text-align: left; padding: 4px 8px; font-size: 11px; text-transform: uppercase; }
          td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .spec-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 13px; }
          .spec-pos { font-size: 13px; font-weight: 900; color: #4f46e5; margin-bottom: 4px; }
          .artwork-container { border: 1px dashed #cbd5e1; border-radius: 8px; background: transparent; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; overflow: hidden; }
          .artwork-img { width: 100%; height: auto; border-radius: 0; box-shadow: none; display: block; }
          .signature-label { font-size: 13px; font-weight: bold; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div class="header-left">
              <h1>ใบงาน</h1>
              <div class="job-id">เลขใบงาน: ${order.displayJobCode || order.jobId || "-"}</div>
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                เพจ: ${order.salesChannel?.name || "-"} (${order.salesChannel?.code || "-"}) | 
                บล็อก: ${order.blockType === "NEW" ? "3 (ใหม่)" : order.blockType === "EDIT" ? "2 (แก้)" : "1 (เดิม)"} |
                <b style="color: #4f46e5;">แอดมิน: ${order.sales?.name || order.sales?.username || "-"}</b>
              </div>
              <div>
                ${order.isUrgent ? '<span class="badge badge-urgent">งานด่วนพิเศษ</span>' : ""}
              </div>
            </div>
            <div class="qr-container">
              <img src="${qrCodeBase64}" class="qr-image" />
              <div class="signature-label">สแกนเพื่อตรวจสอบ & โหลดไฟล์ผลิต</div>
            </div>
          </div>

          <div class="grid section">
            <div class="col-2">
              <div class="section-title">ข้อมูลลูกค้า</div>
              <div class="grid" style="padding-left: 13px;">
                <div class="col">
                  <div class="label">ชื่อ-สกุล</div>
                  <div class="value">${order.customerName}</div>
                </div>
                <div class="col">
                  <div class="label">Facebook</div>
                  <div class="value">${order.customerFb || "-"}</div>
                </div>
                <div class="col">
                  <div class="label">เบอร์โทรศัพท์</div>
                  <div class="value">${order.customerPhone || "-"}</div>
                </div>
              </div>
              <div style="padding-left: 13px;">
                <div class="label">ที่อยู่</div>
                <div class="value" style="font-size: 13px; font-weight: normal; margin-bottom: 5px;">${order.customerAddress || "-"}</div>
              </div>
            </div>
            <div class="col">
              <div class="section-title">ระยะเวลารวม</div>
              <div style="padding-left: 13px;">
                <div class="label">สร้างเมื่อ</div>
                <div class="value" style="font-size: 12px;">${new Date(order.createdAt).toLocaleDateString("th-TH")}</div>
                <div class="label">กำหนดส่ง</div>
                <div class="value" style="color: #4f46e5; font-size: 12px;">${order.dueDate ? new Date(order.dueDate).toLocaleDateString("th-TH") : "-"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">รายการสินค้า</div>
            <table>
              <thead>
                <tr>
                  <th>รายละเอียดสินค้า (สี/ไซส์)</th>
                  <th class="text-right">รวมจำนวน</th>
                  <th class="text-right">ราคา/ตัว</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const items = order.items || [];
                  const standardItems = items.filter(
                    (item) =>
                      !order.purchaseRequests?.some(
                        (pr) => pr.variantId === item.variantId,
                      ),
                  );
                  const preorderItems = items.filter((item) =>
                    order.purchaseRequests?.some(
                      (pr) => pr.variantId === item.variantId,
                    ),
                  );

                  const renderGroupedRows = (items, isPre) => {
                    const groups = {};
                    items.forEach((item) => {
                      const key = `${item.productName}-${item.variant?.color}`;
                      if (!groups[key]) {
                        groups[key] = {
                          name: item.productName,
                          color: item.variant?.color,
                          sizes: {},
                          total: 0,
                          price: item.price,
                        };
                      }
                      groups[key].sizes[item.variant?.size] =
                        (groups[key].sizes[item.variant?.size] || 0) +
                        item.quantity;
                      groups[key].total += item.quantity;
                    });

                    return Object.values(groups)
                      .map(
                        (g) => `
                      <tr>
                        <td>
                          <div style="font-weight: bold;">${g.name} (${g.color})</div>
                          <div style="font-size: 11px; color: ${isPre ? "#d97706" : "#4f46e5"}; font-weight: bold; margin-top: 2px;">
                            ${Object.entries(g.sizes)
                              .map(([size, qty]) => `${size}=${qty}`)
                              .join(", ")}
                          </div>
                        </td>
                        <td class="text-right" style="font-size: 16px; font-weight: 900;">${g.total}</td>
                        <td class="text-right">${parseFloat(g.price).toLocaleString()} ฿</td>
                      </tr>`,
                      )
                      .join("");
                  };

                  let html = renderGroupedRows(standardItems, false);
                  if (preorderItems.length > 0) {
                    html += `<tr style="background: #fffbeb;"><td colspan="3" style="font-weight: 900; color: #64748b; padding: 6px 12px;">สั่งผลิตเพิ่ม</td></tr>`;
                    html += renderGroupedRows(preorderItems, true);
                  }
                  return html;
                })()}
                <tr style="border-top: 2px solid #0f172a;">
                  <td colspan="2" class="text-right" style="font-size: 12px; font-weight: bold;">รวมเป็นเงิน (Subtotal)</td>
                  <td class="text-right" style="font-size: 12px; font-weight: bold;">${parseFloat(order.totalPrice || 0).toLocaleString()} ฿</td>
                </tr>
                <tr>
                  <td colspan="2" class="text-right" style="font-size: 12px; font-weight: bold;">ชำระแล้ว (Paid)</td>
                  <td class="text-right" style="font-size: 12px; font-weight: bold; color: #10b981;">${parseFloat(order.paidAmount || 0).toLocaleString()} ฿</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td colspan="2" class="text-right" style="font-size: 14px; font-weight: 900;">ยอดค้างชำระ (Balance Due)</td>
                  <td class="text-right" style="font-size: 14px; font-weight: 900; color: #dc2626;">${parseFloat(order.balanceDue || 0).toLocaleString()} ฿</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid section">
            <div class="col" style="flex: 1;">
              <div class="section-title">รูปภาพวางแบบให้ลูกค้า</div>
              <div class="artwork-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 10px; min-height: 200px;">
                ${(() => {
                  const imgs = [];
                  if (order.artworkUrl) imgs.push({ url: order.artworkUrl, isFinal: true });
                  if (order.block?.artworkUrl) imgs.push({ url: order.block.artworkUrl, isFinal: true });
                  (order.draftImages || []).forEach((url) => imgs.push({ url, isFinal: false }));

                  if (imgs.length === 0) {
                    return '<div style="grid-column: 1/-1; color: #94a3b8; font-style: italic; text-align: center; padding: 20px;">ไม่มีภาพร่าง</div>';
                  }

                  return imgs
                    .map((img, idx) => {
                      const isSingle = imgs.length === 1;
                      const border = img.isFinal ? "2px solid #4f46e5" : "1px solid #e2e8f0";
                      const maxHeight = isSingle ? "480px" : "320px";
                      const gridCol = isSingle ? "1 / -1" : "auto";
                      return `<img src="${imageMap[img.url] || img.url}" class="artwork-img" style="border: ${border}; max-height: ${maxHeight}; grid-column: ${gridCol}; object-fit: contain;" />`;
                    })
                    .join("");
                })()}
              </div>
            </div>
          </div>

          <div style="page-break-before: always;"></div>
          <div class="page-container">
            <div class="header" style="border-bottom: 4px solid #4f46e5;">
              <div class="header-left">
                <h1 style="color: #4f46e5;">ข้อมูลฝ่ายผลิต (TECHNICAL SPEC)</h1>
                <div class="job-id">เลขใบงาน: ${order.displayJobCode || order.jobId || "-"}</div>
              </div>
              <div class="qr-container">
                <img src="${qrCodeBase64}" style="width: 70px; height: 70px;" />
              </div>
            </div>

            <div style="padding-top: 10px;">
              ${
                specs.length === 0
                  ? '<div style="text-align: center; padding: 40px; color: #94a3b8; font-weight: bold;">ไม่มีข้อมูลจุดปัก</div>'
                  : specs
                      .map((spec, index) => {
                        const mockupBase64 =
                          imageMap[spec.mockupUrl] || spec.mockupUrl;
                        const logoBase64 =
                          imageMap[spec.logoUrl] || spec.logoUrl;
                        return `
                <div style="border-bottom: 2px solid #0f172a; padding: 10px 0; display: flex; gap: 15px; page-break-inside: avoid;">
                  <div style="flex: 1.2;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <div style="width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; background: #023abbff; color: white; font-weight: 900; font-size: 12px; border-radius: 6px;">${spec.masterPositionId || index + 1}</div>
                      <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${spec.position}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                      <div style="border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold;">ข้อความปัก</div>
                        <div style="font-size: 12px; font-weight: 800;">${spec.textToEmb || "-"}</div>
                      </div>
                      <div style="border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold;">ขนาด</div>
                        <div style="font-size: 12px; font-weight: 800;">${spec.width || 0} x ${spec.height || 0} cm</div>
                      </div>
                    </div>
                    <div style="border: 1px dashed #94a3b8; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px;">
                      <div style="font-size: 9px; color: #64748b; font-weight: bold;">เข็ม (Pattern)</div>
                      <div style="font-size: 11px; font-weight: 900;">${spec.needlePattern || "-"}</div>
                    </div>
                    <div style="border: 1px solid #0f172a; padding: 6px 10px; border-radius: 6px; background: #f1f5f9;">
                      <div style="font-size: 9px; color: #0f172a; font-weight: bold;">📁 ที่อยู่ไฟล์ (File Address)</div>
                      <div style="font-size: 13px; font-weight: 900; color: #4f46e5;">${spec.fileAddress || "-"}</div>
                    </div>
                  </div>
                  <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                    ${mockupBase64 || logoBase64 ? `<img src="${mockupBase64 || logoBase64}" style="width: 100%; max-height: 150px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px;" />` : '<div style="color: #94a3b8; font-style: italic;">ไม่มีรูป</div>'}
                  </div>
                </div>`;
                      })
                      .join("")
              }
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Launch Puppeteer with optimized settings and system browser fallback
    console.log(`[PDF] Launching browser...`);

    // Let Puppeteer use its bundled Chromium to avoid Windows Code 0 crashes.

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();
    // console.log(`[PDF] Setting content...`);

    // Wait for all network requests to finish (crucial for images)
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // console.log(`[PDF] Running PDF export...`);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    // console.log(`[PDF] Generation complete`);
    return pdfBuffer;
  } catch (err) {
    console.error(`[PDF] FATAL ERROR:`, err);
    throw err;
  } finally {
    if (browser) {
      // console.log(`[PDF] Closing browser`);
      await browser.close();
    }
  }
};

/**
 * Generate a client-facing Proof Sheet PDF
 */
export const generateCustomerProofPDF = async (order) => {
  let browser = null;
  try {
    const masterPositions = await prisma.masterEmbroideryPosition.findMany();

    // 1. Prepare Spec Data with Base64 Images
    const tablePositions = order.positions || [];
    const jsonPositions = (order.embroideryDetails || []).map((p) => {
      let resolvedId = p.masterPositionId;
      if (!resolvedId && p.position) {
        const match = masterPositions.find((m) => m.name === p.position);
        if (match) resolvedId = match.id;
      }
      return {
        ...p,
        masterPositionId: resolvedId,
        position: p.position || "ตำแหน่งปัก",
      };
    });
    const finalPositions =
      jsonPositions.length > 0 ? jsonPositions : tablePositions;

    // Collect all image URLs
    const allUrls = [];
    finalPositions.forEach((p) => {
      if (p.mockupUrl) allUrls.push(p.mockupUrl);
      if (p.logoUrl) allUrls.push(p.logoUrl);
    });
    const draftImages = order.draftImages || [];
    draftImages.forEach((img) => allUrls.push(img));
    if (order.artworkUrl) allUrls.push(order.artworkUrl);
    if (order.block?.artworkUrl) allUrls.push(order.block.artworkUrl);

    // Batch convert to Base64
    const imageMap = await batchImageToBase64(allUrls);

    // 2. Prepare HTML Template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; font-family: 'Tahoma', 'Arial', sans-serif; }
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background-color: white; color: #0f172a; line-height: 1.2; }
          .page-container { width: 210mm; min-height: 297mm; padding: 8mm 12mm; margin: auto; }
          
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #4f46e5; padding-bottom: 13px; }
          .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
          .logo span { color: #4f46e5; font-weight: 400; }
          .doc-type { font-size: 12px; font-weight: bold; color: #64748b; }

          .order-meta { display: flex; justify-content: space-between; background: transparent; border: 1px dashed #cbd5e1; padding: 13px 15px; border-radius: 13px; margin-bottom: 15px; }
          .meta-item { flex: 1; }
          .label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
          .value { font-size: 12px; font-weight: 800; }

          .section-title { font-size: 12px; font-weight: 900; margin: 15px 0 5px; border-left: 3px solid #4f46e5; padding-left: 8px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 13px; }
          th { background: #0f172a; color: white; text-align: left; padding: 6px 13px; font-size: 9px; text-transform: uppercase; }
          td { padding: 6px 13px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }

          .pos-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 13px; 
            justify-content: start;
          }
          
          .pos-card { 
            border: 1px dashed #cbd5e1; 
            border-radius: 8px; 
            padding: 8px; 
            background: transparent; 
            text-align: center; 
          }
          .mockup-img { width: 100%; aspect-ratio: 1 / 1; object-fit: contain; background: white; border-radius: 0; margin: 5px 0; border: 1px solid #e2e8f0; }

          .finance-summary { background: #0f172a; color: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; margin-top: 15px; }
          .summary-item .label { color: #64748b; font-size: 9px; }
          .summary-item .value { font-size: 16px; color: white; font-weight: 900; }
          .summary-item .value.highlight { color: #10b981; }

          .footer-note { margin-top: 25px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 13px; }
          .footer-note p { font-size: 13px; color: #94a3b8; font-style: italic; margin: 0; }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div class="header-left">
              <div class="logo">ใบแจ้งรายละเอียดงาน <span>(Proof Sheet)</span></div>
              <div style="font-size: 16px; font-weight: 800; color: #4f46e5; margin-top: 5px;">เลขใบงาน: ${order.displayJobCode || order.jobId || "-"}</div>
            </div>
          </div>

          <div class="order-meta">
            <div class="meta-item">
              <div class="label">วันที่เริ่มงาน</div>
              <div class="value">${new Date(order.createdAt || Date.now()).toLocaleDateString("th-TH")}</div>
            </div>
            <div class="meta-item" style="text-align: right;">
              <div class="label">กำหนดส่งมอบ</div>
              <div class="value" style="color: #4f46e5;">${order.dueDate ? new Date(order.dueDate).toLocaleDateString("th-TH") : "ไม่ระบุ"}</div>
            </div>
          </div>

          <div style="display: flex; gap: 20px;">
            <div style="flex: 1.8;">
              <div class="section-title">📦 รายการสินค้า</div>
              <table>
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th style="text-align: center;">จำนวน</th>
                    <th style="text-align: right;">ราคา/ตัว</th>
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    const items = order.items || [];
                    const standardItems = items.filter(
                      (item) =>
                        !order.purchaseRequests?.some(
                          (pr) => pr.variantId === item.variantId,
                        ),
                    );
                    const preorderItems = items.filter((item) =>
                      order.purchaseRequests?.some(
                        (pr) => pr.variantId === item.variantId,
                      ),
                    );

                    const renderRows = (items, isPre) =>
                      items
                        .map(
                          (item) => `
                        <tr>
                          <td style="font-weight: bold;">
                            ${item.productName} 
                            <span style="font-size: 9px; color: #64748b;">(${item.variant?.color || "-"} / ${item.variant?.size || "-"})</span>
                          </td>
                          <td style="text-align: center; font-weight: 800;">${item.quantity}</td>
                          <td style="text-align: right;">${parseFloat(item.price || 0).toLocaleString()} ฿</td>
                        </tr>
                      `,
                        )
                        .join("");

                    let html = renderRows(standardItems, false);
                    if (preorderItems.length > 0) {
                      html += `
                        <tr style="background: #f8fafc; border-top: 1px dashed #cbd5e1;">
                          <td colspan="3" style="font-weight: 900; color: #64748b; font-size: 10px; padding: 6px;">รายการสั่งผลิตเพิ่มเติม</td>
                        </tr>
                      `;
                      html += renderRows(preorderItems, true);
                    }
                    return html;
                  })()}
                </tbody>
              </table>
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; padding: 13px; border-radius: 13px; background: white;">
              <div class="section-title" style="margin-top: 0; border: none; padding: 0; font-size: 14px; color: #94a3b8;">ที่อยู่จัดส่ง</div>
              <div class="value" style="margin: 5px 0; font-size: 14px;">${order.customerName}</div>
              <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">📞 ${order.customerPhone || "-"}</div>
              <div style="font-size: 14px; color: #64748b; line-height: 1.3;">${order.customerAddress || "-"}</div>
            </div>
          </div>

          <div style="display: flex; gap: 20px; align-items: flex-start;">
            <div style="flex: 0.85;">
              <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>🪡 ตำแหน่งปัก</span>
                <span style="font-size: 10px; background: #4f46e5; color: white; padding: 2px 8px; border-radius: 4px;">รวม ${finalPositions.length} จุด</span>
              </div>
              <div class="pos-grid" style="grid-template-columns: repeat(2, 1fr);">
                ${
                  finalPositions.length === 0
                    ? '<div style="grid-column: 1/-1; padding: 13px; text-align: center; color: #94a3b8; font-size: 13px;">ไม่มีข้อมูลตำแหน่งปัก</div>'
                    : finalPositions
                        .map((pos, idx) => {
                          const mockupBase64 =
                            imageMap[pos.mockupUrl] || pos.mockupUrl;
                          const logoBase64 =
                            imageMap[pos.logoUrl] || pos.logoUrl;

                          let initialContent = "";
                          if (pos.isFreeOption) {
                            initialContent = `<div class="mockup-img" style="display:flex;align-items:center;justify-content:center;color:#4f46e5;font-size:14px;font-weight:900;background:#f0f9ff;border:1px solid #bae6fd;">${pos.freeOptionName || "OPTION"}</div>`;
                          } else if (mockupBase64 || logoBase64) {
                            initialContent = `<img src="${mockupBase64 || logoBase64}" class="mockup-img"/>`;
                          } else {
                            initialContent = `<div class="mockup-img" style="display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:8px;font-style:italic;">No Image</div>`;
                          }

                          return `
                      <div style="margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: white; page-break-inside: avoid;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                          <div style="width: 24px; height: 24px; background: #023abbff; color: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px;">
                            ${pos.masterPositionId || "?"}
                          </div>
                          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${pos.position || "ตำแหน่งปัก"}</div>
                        </div>
                        ${initialContent}
                        ${pos.textToEmb ? `<div style="font-size: 10px; margin-top: 5px; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 4px;"><b>โน้ต:</b> ${pos.textToEmb}</div>` : ""}
                      </div>
                    `;
                        })
                        .join("")
                }
              </div>
            </div>

            <div style="flex: 1.15;">
              <div class="section-title">รูปภาพวางแบบให้ลูกค้า</div>
              <div class="pos-grid" style="grid-template-columns: 1fr; gap: 15px;">
                ${
                  order.artworkUrl
                    ? `
                    <div style="border: 2px solid #4f46e5; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 10px;">
                      <img src="${imageMap[order.artworkUrl] || order.artworkUrl}" style="width: 100%; height: auto; display: block;"/>
                      <div style="background: #4f46e5; color: white; font-size: 10px; text-align: center; padding: 2px;">แบบสรุปสุดท้าย (Final Artwork)</div>
                    </div>`
                    : ""
                }
                ${
                  order.block?.artworkUrl
                    ? `
                    <div style="border: 2px solid #4f46e5; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 10px;">
                      <img src="${imageMap[order.block.artworkUrl] || order.block.artworkUrl}" style="width: 100%; height: auto; display: block;"/>
                      <div style="background: #4f46e5; color: white; font-size: 10px; text-align: center; padding: 2px;">แบบจากบล็อกเดิม</div>
                    </div>`
                    : ""
                }
                ${
                  draftImages.length === 0 && !order.artworkUrl && !order.block?.artworkUrl
                    ? '<div style="grid-column: 1/-1; padding: 13px; text-align: center; color: #94a3b8; font-size: 13px;">ไม่มีภาพร่างจากแชท</div>'
                    : draftImages
                        .map(
                          (img) => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 10px;">
                      <img src="${imageMap[img] || img}" style="width: 100%; height: auto; display: block;"/>
                    </div>
                  `,
                        )
                        .join("")
                }
              </div>
            </div>
          </div>

          ${
            order.notes
              ? `
            <div class="section-title">📝 หมายเหตุ</div>
            <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 13px; border-radius: 8px; font-size: 11px; color: #92400e; margin-bottom: 13px;">
              ${order.notes}
            </div>
          `
              : ""
          }

          <div class="finance-summary">
            <div class="summary-item">
              <div class="label">ยอดรวมสุทธิ</div>
              <div class="value">฿ ${parseFloat(order.totalPrice || 0).toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="label">มัดจำ/ชำระแล้ว</div>
              <div class="value">฿ ${parseFloat(order.paidAmount || 0).toLocaleString()}</div>
            </div>
            <div class="summary-item" style="text-align: right;">
              <div class="label">ยอดคงเหลือ</div>
              <div class="value highlight">฿ ${parseFloat(order.balanceDue || 0).toLocaleString()}</div>
            </div>
          </div>

          <div class="footer-note">
            <p>กรุณาตรวจสอบความถูกต้อง หากมีข้อสงสัยรบกวนแจ้งเจ้าหน้าที่ทันที ขอบคุณครับ</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    return pdfBuffer;
  } catch (err) {
    console.error(`[PDF-PROOF] ERROR:`, err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
};
