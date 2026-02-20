import prisma from "../src/prisma/client.js";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

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

    // 2. Prepare HTML Template (Standard CSS - No External Dependencies)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <style>
          /* Use standard system fonts for speed and reliability */
          * {
            box-sizing: border-box;
            font-family: 'Tahoma', 'Arial', sans-serif; /* Standard Thai-supported fonts */
          }
          
          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background-color: white;
            color: #1e293b;
          }

          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 5mm 8mm; /* Reduced padding */
            margin: auto;
            position: relative;
          }

          /* Header Styles */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px; /* Reduced */
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px; /* Reduced */
          }

          .header-left h1 {
            font-size: 24px;
            margin: 0;
            letter-spacing: -0.5px;
            color: #0f172a;
          }

          .job-id {
            font-size: 20px;
            font-weight: bold;
            color: #4f46e5;
            margin: 5px 0;
          }

          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #e2e8f0;
            background: #f1f5f9;
            margin-right: 13px;
          }

          .badge-urgent {
            background: #fef2f2;
            color: #dc2626;
            border-color: #fee2e2;
          }

          .qr-container {
            text-align: right;
          }

          .qr-image {
            width: 100px;
            height: 100px;
          }

          /* Section Styles */
          .section {
            margin-bottom: 15px;
          }

          .section-title {
            background-color: #f8fafc;
            border-left: 4px solid #4f46e5;
            padding: 4px 12px;
            font-weight: 800;
            font-size: 12px;
            color: #0f172a;
            margin-bottom: 13px;
          }

          .grid {
            display: flex;
            gap: 20px;
          }

          .col {
            flex: 1;
          }

          .col-2 {
            flex: 2;
          }

          /* Info Styles */
          .label {
            font-size: 11px; /* Reduced */
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 1px;
          }

          .value {
            font-size: 12px; /* Reduced */
            font-weight: bold;
            margin-bottom: 8px; /* Reduced */
          }

          /* Table Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 13px;
          }

          th {
            background-color: #0f172a;
            color: white;
            text-align: left;
            padding: 4px 8px; /* Compact */
            font-size: 11px;
            text-transform: uppercase;
          }

          td {
            padding: 4px 8px; /* Compact */
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          /* Spec Box */
          .spec-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 13px;
          }

          .spec-pos {
            font-size: 13px;
            font-weight: 900;
            color: #4f46e5;
            margin-bottom: 4px;
          }

          .spec-dims {
            display: flex;
            gap: 13px;
            margin-top: 5px;
          }

          .dim-pill {
            background: white;
            padding: 2px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 13px;
          }

          /* Artwork Area */
          .artwork-container {
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            background: transparent;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0;
            overflow: hidden;
          }

          .artwork-img {
            width: 100%;
            height: auto;
            border-radius: 0;
            box-shadow: none;
            display: block;
          }

          .signature-label {
            font-size: 13px;
            font-weight: bold;
            color: #94a3b8;
          }

          .technical-card {
            border: 2px solid #0f172a;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }

          .technical-title {
            font-size: 18px;
            font-weight: 900;
            background: #0f172a;
            color: white;
            padding: 5px 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            display: inline-block;
          }

          .thread-table {
            width: 100%;
            margin-top: 10px;
          }

          .thread-table th {
            background: #475569;
            color: white;
            font-size: 10px;
          }

          .thread-table td {
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #e2e8f0;
          }

          .color-swatch {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
          }
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
                ${/* NO SYSTEM STATUS AS REQUESTED */ ""}
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
                  // 1. Split Items
                  const standardItems = [];
                  const preorderItems = [];
                  order.items.forEach((item) => {
                    const isPreorder = order.purchaseRequests?.some(
                      (pr) => pr.variantId === item.variantId,
                    );
                    if (isPreorder) preorderItems.push(item);
                    else standardItems.push(item);
                  });

                  // Helper to grouping items
                  const renderGroupedRows = (items, isPre) => {
                    const groups = {};
                    items.forEach((item) => {
                      const key = `${item.productName}-${item.variant.color}`;
                      if (!groups[key]) {
                        groups[key] = {
                          name: item.productName,
                          color: item.variant.color,
                          sku: item.variant.sku.split("-")[0],
                          sizes: {},
                          total: 0,
                          price: item.price,
                        };
                      }
                      groups[key].sizes[item.variant.size] =
                        (groups[key].sizes[item.variant.size] || 0) +
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
                      </tr>
                    `,
                      )
                      .join("");
                  };

                  let html = "";

                  // 2. Render Standard Items
                  if (standardItems.length > 0) {
                    html += renderGroupedRows(standardItems, false);
                  }

                  // 3. Render Pre-order Items Section (if exists)
                  if (preorderItems.length > 0) {
                    html += `
                      <tr style="background: #fffbeb; border-top: 1px dashed #cbd5e1;">
                        <td colspan="3" style="font-weight: 900; color: #64748b; padding: 6px 12px; font-size: 11px;">
                          รายการสั่งผลิตเพิ่มเติม (ADDITIONAL ITEMS)
                        </td>
                      </tr>
                    `;
                    html += renderGroupedRows(preorderItems, true);
                  }

                  return html;
                })()}
                ${
                  parseFloat(order.blockPrice || 0) > 0
                    ? `
                  <tr style="background: #f8fafc; font-weight: bold; border-top: 1px solid #e2e8f0;">
                    <td colspan="2" class="text-right" style="padding: 6px 15px; font-size: 13px;">ค่าบล็อก (EMBROIDERY BLOCK)</td>
                    <td class="text-right" style="padding: 6px 15px; color: #059669;">${parseFloat(order.blockPrice).toLocaleString()} ฿</td>
                  </tr>
                `
                    : ""
                }
              </tbody>
            </table>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="width: 60%;"></td>
                  <td style="width: 40%;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: right; padding: 4px; font-size: 11px; color: #64748b;">รวมเป็นเงิน (Subtotal)</td>
                        <td style="text-align: right; padding: 4px; font-size: 11px; font-weight: bold;">${(parseFloat(order.totalPrice || 0) - parseFloat(order.blockPrice || 0) - parseFloat(order.codSurcharge || 0)).toLocaleString()} ฿</td>
                      </tr>
                      ${
                        parseFloat(order.blockPrice || 0) > 0
                          ? `
                      <tr>
                        <td style="text-align: right; padding: 4px; font-size: 11px; color: #64748b;">ค่าบล็อก (Block)</td>
                        <td style="text-align: right; padding: 4px; font-size: 11px; font-weight: bold;">${parseFloat(order.blockPrice).toLocaleString()} ฿</td>
                      </tr>`
                          : ""
                      }
                      ${
                        parseFloat(order.codSurcharge || 0) > 0
                          ? `
                      <tr>
                        <td style="text-align: right; padding: 4px; font-size: 11px; color: #64748b;">ค่าบริการ COD (3%)</td>
                        <td style="text-align: right; padding: 4px; font-size: 11px; font-weight: bold;">${parseFloat(order.codSurcharge).toLocaleString()} ฿</td>
                      </tr>`
                          : ""
                      }
                      <tr style="border-top: 1px solid #e2e8f0; border-bottom: 2px solid #0f172a;">
                        <td style="text-align: right; padding: 6px 4px; font-size: 12px; font-weight: 900; color: #0f172a;">ยอดรวมทั้งสิ้น</td>
                        <td style="text-align: right; padding: 6px 4px; font-size: 14px; font-weight: 900; color: #0f172a;">${parseFloat(order.totalPrice || 0).toLocaleString()} ฿</td>
                      </tr>
                      <tr>
                        <td style="text-align: right; padding: 4px; font-size: 11px; color: #059669;">ชำระแล้ว</td>
                        <td style="text-align: right; padding: 4px; font-size: 11px; font-weight: bold; color: #059669;">- ${parseFloat(order.paidAmount || 0).toLocaleString()} ฿</td>
                      </tr>
                      <tr style="background: #fef2f2;">
                        <td style="text-align: right; padding: 6px 4px; font-size: 12px; font-weight: 900; color: #be123c;">ยอดค้างชำระ</td>
                        <td style="text-align: right; padding: 6px 4px; font-size: 14px; font-weight: 900; color: #be123c;">${(parseFloat(order.totalPrice || 0) - parseFloat(order.paidAmount || 0)).toLocaleString()} ฿</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
          </div>

          <div class="grid section">
            <div class="col" style="flex: 1;">
              <div class="section-title">รูปภาพวางแบบให้ลูกค้า</div>
              <div class="artwork-container" style="display: grid; grid-template-columns: repeat(${Math.min((order.draftImages || []).length || 1, 2)}, 1fr); gap: 20px; padding: 0; border: none;">
                ${
                  (order.draftImages || []).length > 0
                    ? order.draftImages
                        .map(
                          (img) =>
                            `<img src="${img}" class="artwork-img" style="width: 100%; height: auto; max-height: 520px; object-fit: contain; background: white; border: 1px solid #e2e8f0;" />`,
                        )
                        .join("")
                    : '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8; font-style: italic; border: 2px dashed #e2e8f0; border-radius: 12px; background: white;">ไม่มีภาพร่างจำลอง</div>'
                }
              </div>
            </div>
          </div>

          <!-- PAGE 2: TECHNICAL SPECIFICATION -->
          <div style="page-break-before: always;"></div>
          <div class="page-container" style="display: flex; flex-direction: column; height: auto; min-height: 287mm;">
            <div class="header" style="border-bottom: 4px solid #4f46e5; flex-shrink: 0;">
              <div class="header-left">
                <h1 style="color: #4f46e5;">ข้อมูลฝ่ายผลิต (TECHNICAL SPEC)</h1>
                <div class="job-id">เลขใบงาน: ${order.displayJobCode || order.jobId || "-"}</div>
                <div style="font-size: 14px; font-weight: bold; color: #64748b;">
                  อัปเดต specs โดย: ${order.graphic?.name || "-"} | จำนวนจุดปัก: ${((order.embroideryDetails || []).length > 0 ? order.embroideryDetails : order.positions || []).length} จุด
                </div>
              </div>
              <div class="qr-container">
                <img src="${qrCodeBase64}" style="width: 70px; height: 70px;" />
              </div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding-top: 10px;">
            ${(() => {
              const tablePositions = order.positions || [];
              const jsonPositions = (order.embroideryDetails || []).map((p) => {
                // Resolve ID by name if missing (Ensures database-linked IDs)
                let resolvedId = p.masterPositionId;
                if (!resolvedId && p.position) {
                  const match = masterPositions.find(
                    (m) => m.name === p.position,
                  );
                  if (match) resolvedId = match.id;
                }

                return {
                  position: p.position,
                  masterPositionId: resolvedId,
                  width: p.width,
                  height: p.height,
                  mockupUrl: p.mockupUrl,
                  logoUrl: p.logoUrl,
                  textToEmb: p.textToEmb,
                  fileAddress: p.fileAddress,
                  embroideryFileUrls: p.embroideryFileUrls || [],
                  needlePattern: p.needlePattern,
                  threadSequence: p.threadSequence || [],
                  isFreeOption: p.isFreeOption,
                  freeOptionName: p.freeOptionName,
                };
              });
              const specs =
                jsonPositions.length > 0 ? jsonPositions : tablePositions;

              if (specs.length === 0) {
                return `<div style="flex: 1; display: flex; align-items: center; justify-content: center; border: 2px dashed #cbd5e1; border-radius: 12px; color: #94a3b8; font-size: 20px; font-weight: bold;">ไม่มีข้อมูลจุดปัก</div>`;
              }

              return specs
                .map(
                  (spec, index) => `
                <div style="border-bottom: 2px solid #0f172a; padding: 10px 0; display: flex; gap: 15px; page-break-inside: avoid;">
                  <div style="flex: 1.2;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <div style="width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; background: #023abbff; color: white; font-weight: 900; font-size: 12px; border-radius: 6px;">
                        ${spec.masterPositionId || "?"}
                      </div>
                      <div style="font-size: 14px; font-weight: 900; color: #0f172a;">
                        ${spec.position} ${spec.isFreeOption ? '<span style="color: #64748b; font-size: 11px;">(ฟรี)</span>' : ""}
                      </div>
                      ${spec.isFreeOption ? `<div style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">OPTION: ${spec.freeOptionName}</div>` : ""}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                      <div style="border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; background: white;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">ข้อความปัก / หมายเหตุ</div>
                        <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px;">${spec.textToEmb || "-"}</div>
                      </div>
                      <div style="border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; background: white; text-align: center;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">ขนาด (Size)</div>
                        <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px;">
                          ${spec.isFreeOption || (!spec.width && !spec.height) ? "-" : `${spec.width || 0} x ${spec.height || 0} cm`}
                        </div>
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-bottom: 5px;">
                      <div style="border: 1px dashed #94a3b8; padding: 6px 10px; border-radius: 6px;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold;">ที่อยู่ไฟล์ / ไฟล์ปัก (.EMB)</div>
                        <div style="font-size: 11px; font-weight: 900; color: #4f46e5; margin-top: 2px;">
                          ${spec.fileAddress ? `<div>${spec.fileAddress}</div>` : ""}
                          ${spec.embroideryFileUrls && spec.embroideryFileUrls.length > 0 ? `<div style="color: #059669; font-size: 10px; margin-top: 2px;">✅ ไฟล์ .EMB ในระบบ (${spec.embroideryFileUrls.length} ไฟล์)</div>` : !spec.fileAddress ? "-" : ""}
                        </div>
                      </div>
                      <div style="border: 1px dashed #94a3b8; padding: 6px 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold;">เข็ม (Pattern)</div>
                        <div style="font-size: 11px; font-weight: 900; margin-top: 2px;">${spec.needlePattern || "-"}</div>
                      </div>
                    </div>

                    ${
                      spec.threadSequence && spec.threadSequence.length > 0
                        ? `
                      <div style="border-top: 1px solid #e2e8f0; padding-top: 8px;">
                        <div style="font-size: 9px; color: #64748b; font-weight: bold; margin-bottom: 4px;">ลำดับไหม (Thread Sequence)</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${spec.threadSequence
                              .map((t, i) => {
                                const code = t.code || t.threadCode || "-";
                                const name =
                                  t.name || t.color || t.colorName || "";
                                return `
                              <div style="font-size: 10px; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; display: flex; align-items: center; gap: 4px;">
                                  <span style="font-weight: 900; color: #94a3b8;">${i + 1}</span>
                                  <span style="font-weight: 800; color: #0f172a;">${code}</span>
                                  ${name ? `<span style="font-size: 9px; color: #64748b;"> ${name}</span>` : ""}
                              </div>
                            `;
                              })
                              .join("")}
                        </div>
                      </div>
                    `
                        : ""
                    }
                  </div>

                  <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0;">
                    ${
                      spec.mockupUrl || spec.logoUrl
                        ? `<img src="${spec.mockupUrl || spec.logoUrl}" style="width: 100%; height: auto; max-height: 120px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px;" />`
                        : '<div style="width: 100%; height: 100px; border: 1px dashed #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; font-size: 10px;">ไม่มีรูปภาพ</div>'
                    }
                  </div>
                </div>
              `,
                )
                .join("");
            })()}
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

    // Faster wait condition
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

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
            /* แก้เป็น 3 คอลัมน์ (ขนาด 5cm เท่าเดิม) */
            grid-template-columns: repeat(3, 5cm); 
            gap: 13px; /* ลดช่องว่างลงนิดนึงจะได้ไม่เบียดขอบ */
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
                <tbody>
                  ${(() => {
                    // SPLIT ITEMS FOR PROOF SHEET AS WELL
                    const standardItems = [];
                    const preorderItems = [];
                    (order.items || []).forEach((item) => {
                      const isPreorder = order.purchaseRequests?.some(
                        (pr) => pr.variantId === item.variantId,
                      );
                      if (isPreorder) preorderItems.push(item);
                      else standardItems.push(item);
                    });

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

                    let html = "";
                    if (standardItems.length > 0)
                      html += renderRows(standardItems, false);

                    if (preorderItems.length > 0) {
                      html += `
                          <tr style="background: #f8fafc; border-top: 1px dashed #cbd5e1;">
                            <td colspan="3" style="font-weight: 900; color: #64748b; font-size: 10px; padding: 6px;">
                              รายการสั่งผลิตเพิ่มเติม
                            </td>
                          </tr>
                        `;
                      html += renderRows(preorderItems, true);
                    }
                    return html;
                  })()}
                </tbody>
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
                <span style="font-size: 10px; background: #4f46e5; color: white; padding: 2px 8px; border-radius: 4px;">รวม ${((order.embroideryDetails || []).length > 0 ? order.embroideryDetails : order.positions || []).length} จุด</span>
              </div>
              <div class="pos-grid" style="grid-template-columns: repeat(2, 1fr);">
                ${(() => {
                  const tablePositions = order.positions || [];
                  const jsonPositions = (order.embroideryDetails || []).map(
                    (p) => {
                      // Resolve ID by name if missing
                      let resolvedId = p.masterPositionId;
                      if (!resolvedId && p.position) {
                        const match = masterPositions.find(
                          (m) => m.name === p.position,
                        );
                        if (match) resolvedId = match.id;
                      }

                      return {
                        positionNo: p.positionNo,
                        position: p.position,
                        masterPositionId: resolvedId,
                        mockupUrl: p.mockupUrl,
                        logoUrl: p.logoUrl,
                        note: p.note,
                        textToEmb: p.textToEmb,
                        isFreeOption: p.isFreeOption,
                        freeOptionName: p.freeOptionName,
                      };
                    },
                  );

                  // Prioritize JSON if available because it contains complete spec data (options, notes) updated by Graphic
                  // The 'positions' table might be stale or lack new schema fields
                  const finalPositions =
                    jsonPositions.length > 0 ? jsonPositions : tablePositions;

                  if (finalPositions.length === 0) {
                    return '<div style="grid-column: 1/-1; padding: 13px; text-align: center; color: #94a3b8; font-size: 13px;">ไม่มีข้อมูลตำแหน่งปัก</div>';
                  }

                  return finalPositions
                    .map((pos, idx) => {
                      let initialContent = "";
                      if (pos.isFreeOption) {
                        initialContent = `<div class="mockup-img" style="display:flex;align-items:center;justify-content:center;color:#4f46e5;font-size:14px;font-weight:900;background:#f0f9ff;border:1px solid #bae6fd;">${pos.freeOptionName || "OPTION"}</div>`;
                      } else if (pos.mockupUrl || pos.logoUrl) {
                        initialContent = `<img src="${pos.mockupUrl || pos.logoUrl}" class="mockup-img"/>`;
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
                    .join("");
                })()}
              </div>
            </div>

            <div style="flex: 1.15;">
              <div class="section-title">รูปภาพวางแบบให้ลูกค้า</div>
              <div class="pos-grid" style="grid-template-columns: repeat(2, 1fr);">
                ${(() => {
                  const draftImages = order.draftImages || [];
                  if (draftImages.length === 0) {
                    return '<div style="grid-column: 1/-1; padding: 13px; text-align: center; color: #94a3b8; font-size: 13px;">ไม่มีภาพร่างจำลองจากแชท</div>';
                  }

                  return draftImages
                    .map(
                      (img) => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 10px;">
                      <img src="${img}" style="width: 100%; height: auto; display: block;"/>
                    </div>
                  `,
                    )
                    .join("");
                })()}
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

    const getExecutablePath = () => {
      const commonPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      ];
      for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
      }
      return undefined; // Let Puppeteer use its bundled Chromium
    };

    const execPath = getExecutablePath();
    console.log(
      "[PDF] Launching Puppeteer with executablePath:",
      execPath || "Bundled Chromium",
    );

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: execPath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--font-render-hinting=none",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
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
