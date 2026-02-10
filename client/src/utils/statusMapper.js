export const statusLabels = {
  PENDING_ARTWORK: "รอวางแบบ",
  DESIGNING: "กำลังวางแบบ",
  PENDING_PAYMENT: "รอชำระเงิน",
  PENDING_STOCK_CHECK: "รอเช็คสต็อก",
  STOCK_ISSUE: "สต็อกมีปัญหา",
  STOCK_RECHECKED: "รอการผลิต (สต็อกครบ)",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_FINISHED: "ผลิตเสร็จสมบูรณ์",
  QC_PASSED: "ผ่าน QC แล้ว",
  READY_TO_SHIP: "รอจัดส่ง",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิกแล้ว",
};

export const actionLabels = {
  'สร้างออเดอร์': "สร้างออเดอร์ใหม่",
  'CREATED': "สร้างออเดอร์ใหม่",
  'CLAIM_GRAPHIC': "กราฟิกรับงาน",
  'UPLOAD_ARTWORK': "อัปโหลดแบบปัก",
  'PURCHASING_UPDATE': "อัปเดตข้อมูลจัดซื้อ",
  'START_PRODUCTION': "เริ่มการผลิต",
  'FINISH_PRODUCTION': "ผลิตเสร็จสิ้น",
  'QC_PASS': "ผ่านการตรวจสอบ QC",
  'QC_FAIL': "ไม่ผ่านการตรวจสอบ QC",
  'READY_TO_SHIP': "สินค้าพร้อมส่ง",
  'COMPLETED': "จัดส่งสำเร็จ",
  'CANCEL_ORDER': "ยกเลิกออเดอร์",
  'เร่งด่วน': "แจ้งงานด่วน",
  'BUMP_URGENT': "แจ้งงานด่วน (BUMP)",
  'AUTO_URGENT': "ระบบแจ้งงานเร่งด่วน (เกิน 3 วัน)",
  'อัปเดตสเปคทางเทคนิค': "อัปเดตรายละเอียดงาน",
  'ฝ่ายกราฟิกส่งใบงานเข้าสต็อก': "ส่งงานเข้าสต็อก",
  'พนักงานฝ่ายสต็อกยืนยันสต็อกครบ': "สต็อกครบถ้วน",
  'ฝ่ายสต็อกแจ้งปัญหาสินค้า': "แจ้งปัญหาสต็อก",
  'CLAIM_QC': "QC รับงาน",
  'CLAIM_STOCK': "สต็อกรับงาน",
  'CLAIM_PRODUCTION': "ฝ่ายผลิตรับงาน",
};

export const getStatusLabel = (status) => statusLabels[status] || status;
export const getActionLabel = (action) => actionLabels[action] || action;

export const statusColors = {
  PENDING_ARTWORK: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  DESIGNING: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  PENDING_PAYMENT: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  PENDING_STOCK_CHECK: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  STOCK_ISSUE: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  STOCK_RECHECKED: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  IN_PRODUCTION: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  PRODUCTION_FINISHED: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  QC_PASSED: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  READY_TO_SHIP: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};
