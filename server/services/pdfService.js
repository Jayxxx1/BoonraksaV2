import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

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
    // console.log(`[PDF] QR Code generated`);

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
            padding: 8mm 12mm;
            margin: auto;
            position: relative;
          }

          /* Header Styles */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
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
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #e2e8f0;
            background: #f1f5f9;
            margin-right: 10px;
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
            margin-bottom: 10px;
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
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 2px;
          }

          .value {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
          }

          /* Table Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th {
            background-color: #0f172a;
            color: white;
            text-align: left;
            padding: 8px 12px;
            font-size: 10px;
            text-transform: uppercase;
          }

          td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          /* Spec Box */
          .spec-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 10px;
          }

          .spec-pos {
            font-size: 10px;
            font-weight: 900;
            color: #4f46e5;
            margin-bottom: 4px;
          }

          .spec-dims {
            display: flex;
            gap: 10px;
            margin-top: 5px;
          }

          .dim-pill {
            background: white;
            padding: 2px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 10px;
          }

          /* Artwork Area */
          .artwork-container {
            border: 2px solid #f1f5f9;
            border-radius: 15px;
            background: #f8fafc;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
          }

          .artwork-img {
            max-width: 100%;
            max-height: 260px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          /* Signatures */
          .footer {
            margin-top: 40px;
            display: flex;
            gap: 40px;
          }

          .signature-box {
            flex: 1;
            text-align: center;
          }

          .signature-line {
            border-bottom: 1px solid #cbd5e1;
            height: 50px;
            margin-bottom: 8px;
          }

          .signature-label {
            font-size: 10px;
            font-weight: bold;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div class="header-left">
              <h1>JOB SHEET</h1>
              <div class="job-id">${order.jobId}</div>
              <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">
                เพจ: ${order.salesChannel?.code || '-'} | 
                บล็อก: ${order.blockType === 'NEW' ? '3 (ใหม่)' : order.blockType === 'EDIT' ? '2 (แก้)' : '1 (เดิม)'}
              </div>
              <div>
                <span class="badge">${order.status}</span>
                ${order.isUrgent ? '<span class="badge badge-urgent">งานด่วน</span>' : ''}
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
              <div class="grid" style="padding-left: 10px;">
                <div class="col">
                  <div class="label">ชื่อ-สกุล</div>
                  <div class="value">${order.customerName}</div>
                </div>
                <div class="col">
                  <div class="label">Facebook</div>
                  <div class="value">${order.customerFb || '-'}</div>
                </div>
                <div class="col">
                  <div class="label">เบอร์โทรศัพท์</div>
                  <div class="value">${order.customerPhone || '-'}</div>
                </div>
                      </div>
              <div style="padding-left: 10px;">
                <div class="label">ที่อยู่</div>
                <div class="value" style="font-size: 11px; font-weight: normal; margin-bottom: 5px;">${order.customerAddress || '-'}</div>
              </div>
            </div>
            <div class="col">
              <div class="section-title">ระยะเวลารวม</div>
              <div style="padding-left: 10px;">
                <div class="label">สร้างเมื่อ</div>
                <div class="value" style="font-size: 12px;">${new Date(order.createdAt).toLocaleDateString('th-TH')}</div>
                <div class="label">กำหนดส่ง</div>
                <div class="value" style="color: #4f46e5; font-size: 12px;">${order.dueDate ? new Date(order.dueDate).toLocaleDateString('th-TH') : '-'}</div>
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
                  // Consolidate items by Product + Color
                  const groups = {};
                  order.items.forEach(item => {
                    const key = `${item.productName}-${item.variant.color}`;
                    if (!groups[key]) {
                      groups[key] = {
                        name: item.productName,
                        color: item.variant.color,
                        sku: item.variant.sku.split('-')[0], // Base SKU
                        sizes: {},
                        total: 0,
                        price: item.price
                      };
                    }
                    groups[key].sizes[item.variant.size] = (groups[key].sizes[item.variant.size] || 0) + item.quantity;
                    groups[key].total += item.quantity;
                  });

                  return Object.values(groups).map(g => `
                    <tr>
                      <td>
                        <div style="font-weight: bold;">${g.name} (${g.color})</div>
                        <div style="font-size: 11px; color: #4f46e5; font-weight: bold; margin-top: 2px;">
                          ${Object.entries(g.sizes).map(([size, qty]) => `${size}=${qty}`).join(', ')}
                        </div>
                      </td>
                      <td class="text-right" style="font-size: 16px; font-weight: 900;">${g.total}</td>
                      <td class="text-right">${parseFloat(g.price).toLocaleString()} ฿</td>
                    </tr>
                  `).join('');
                })()}
                ${parseFloat(order.blockPrice || 0) > 0 ? `
                  <tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="2" class="text-right" style="padding: 6px 15px; font-size: 10px;">ค่าบล็อก (EMBROIDERY BLOCK)</td>
                    <td class="text-right" style="padding: 6px 15px; color: #059669;">${parseFloat(order.blockPrice).toLocaleString()} ฿</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          <div class="grid section">
            <div class="col">
              <div class="section-title">ขนาดงานปัก (EMBROIDERY SPECS)</div>
              ${(order.embroideryDetails || []).map((spec, index) => `
                <div class="spec-box">
                  <div class="spec-pos">${index + 1}. ${spec.position} ${spec.isFreeOption ? '(ฟรี)' : ''}</div>
                  <div style="font-size: 12px; font-weight: bold;">${spec.note || '-'}</div>
                  <div class="spec-dims">
                    ${spec.isFreeOption ? `
                      <span class="dim-pill" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd; font-weight: 900;">
                        OPTION: ${spec.freeOptionName || '-'}
                      </span>
                    ` : `
                      <span class="dim-pill">W: ${spec.width || '-'} cm</span>
                      <span class="dim-pill">H: ${spec.height || '-'} cm</span>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="col">
              <div class="section-title">ภาพร่างจำลองจากแชท (DRAFT MOCKUPS)</div>
              <div class="artwork-container">
                ${(order.draftImages || []).length > 0 ? 
                  order.draftImages.map(img => `<img src="${img}" class="artwork-img" style="margin-bottom: 10px;" />`).join('') : 
                  '<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">ไม่มีภาพร่างจำลอง</div>'
                }
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">ฝ่ายขาย (SALES)</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">คลัง/สต็อก (STOCK)</div>
            </div>
            <div class="signature-box" style="background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 10px; padding: 5px;">
              <div style="font-size: 9px; font-weight: 900; color: #d97706; margin-bottom: 5px;">
                📍 ฝ่ายผลิต / QC / จัดส่ง<br/>
                กรุณาสแกน QR เพื่ออัปเดตระบบ<br/>
                (โหลดไฟล์พิมพ์ / ดู Artwork เต็ม)
              </div>
              <div class="signature-line" style="height: 30px;"></div>
              <div class="signature-label">ผู้รับผิดชอบ</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Launch Puppeteer with optimized settings and system browser fallback
    console.log(`[PDF] Launching browser...`);
    
    // Fallback paths for Windows machines where Puppeteer download might fail
    const getExecutablePath = () => {
      const commonPaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      ];
      for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
      }
      return undefined; // Let puppeteer find its own if possible
    };

    const executablePath = getExecutablePath();
    if (executablePath) {
      // console.log(`[PDF] Using system browser: ${executablePath}`);
    }

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: executablePath,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    // console.log(`[PDF] Setting content...`);
    
    // Faster wait condition
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // console.log(`[PDF] Running PDF export...`);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
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
