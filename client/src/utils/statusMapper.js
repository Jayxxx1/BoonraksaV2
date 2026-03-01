export const statusLabels = {
  PENDING_DIGITIZING: "รอตีลาย",
  PENDING_ARTWORK: "รอวางแบบ",
  DESIGNING: "กำลังวางแบบ",
  PENDING_PAYMENT: "รอชำระเงิน",
  PENDING_STOCK_CHECK: "รอเช็คสต็อก",
  STOCK_ISSUE: "สต็อกมีปัญหา",
  STOCK_RECHECKED: "รอการผลิต (สต็อกครบ)",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_FINISHED: "ผลิตเสร็จสมบูรณ์",
  QC_PASSED: "รอจัดส่ง",
  READY_TO_SHIP: "พร้อมจัดส่ง",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิกแล้ว",
  // Pre-order Sub-statuses
  WAITING_PURCHASE_INPUT: "รอระบุวันของเข้า",
  PURCHASE_CONFIRMED: "จัดซื้อคอนเฟิร์มแล้ว",
  WAITING_ARRIVAL: "รอสินค้าเข้าคลัง",
  DELAYED_ROUND_1: "ล่าช้า (รอบที่ 1)",
  DELAYED_ROUND_2: "ล่าช้าวิกฤต (รอบที่ 2)",
  ARRIVED: "สินค้าเข้าคลังแล้ว",
};

export const roleLabels = {
  SALES: "ฝ่ายขาย",
  GRAPHIC: "ฝ่ายกราฟิก",
  STOCK: "ฝ่ายสต็อก",
  PRODUCTION: "ฝ่ายผลิต",
  SEWING_QC: "ฝ่ายตัดเย็บ/QC",
  DELIVERY: "ฝ่ายจัดส่ง",
  PURCHASING: "ฝ่ายจัดซื้อ",
  MARKETING: "ฝ่ายการตลาด",
  FINANCE: "ฝ่ายบัญชี",
  DIGITIZER: "ฝ่ายตีลาย",
  ADMIN: "ผู้ดูแลระบบ",
  SUPER_ADMIN: "ผู้ดูแลสูงสุด",
  EXECUTIVE: "ผู้บริหาร",
};

export const actionLabels = {
  สร้างออเดอร์: "สร้างออเดอร์ใหม่",
  CREATED: "สร้างออเดอร์ใหม่",
  CLAIM_GRAPHIC: "กราฟิกรับงาน",
  UPLOAD_ARTWORK: "อัปโหลดแบบปัก",
  PURCHASING_UPDATE: "อัปเดตข้อมูลจัดซื้อ",
  START_PRODUCTION: "เริ่มการผลิต",
  FINISH_PRODUCTION: "ผลิตเสร็จสิ้น",
  QC_PASS: "ผ่านการตรวจสอบ QC",
  QC_FAIL: "ไม่ผ่านการตรวจสอบ QC",
  READY_TO_SHIP: "สินค้าพร้อมส่ง",
  COMPLETED: "จัดส่งสำเร็จ",
  CANCEL_ORDER: "ยกเลิกออเดอร์",
  เร่งด่วน: "แจ้งงานด่วน",
  เร่งงานด่วน: "เร่งงานด่วน ",
  งานด่วนอัตโนมัติ: "งานด่วนอัตโนมัติ (เกิน 3 วัน)",
  อัปเดตสเปคทางเทคนิค: "อัปเดตรายละเอียดงาน",
  ฝ่ายกราฟิกส่งใบงานเข้าสต็อก: "ส่งงานเข้าสต็อก",
  พนักงานฝ่ายสต็อกยืนยันสต็อกครบ: "สต็อกครบถ้วน",
  ฝ่ายสต็อกแจ้งปัญหาสินค้า: "แจ้งปัญหาสต็อก",
  CLAIM_QC: "QC รับงาน",
  CLAIM_STOCK: "สต็อกรับงาน",
  CLAIM_PRODUCTION: "ฝ่ายผลิตรับงาน",
};

export const getStatusLabel = (status) => statusLabels[status] || status;
export const getActionLabel = (action) => actionLabels[action] || action;

export const statusColors = {
  PENDING_DIGITIZING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  PENDING_ARTWORK: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  DESIGNING: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  PENDING_PAYMENT: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  PENDING_STOCK_CHECK: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  STOCK_ISSUE: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
  STOCK_RECHECKED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  IN_PRODUCTION: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  PRODUCTION_FINISHED: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  QC_PASSED: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  READY_TO_SHIP: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  COMPLETED: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  CANCELLED: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  // Pre-order colors
  WAITING_PURCHASE_INPUT: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  PURCHASE_CONFIRMED: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  WAITING_ARRIVAL: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  DELAYED_ROUND_1: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  DELAYED_ROUND_2: {
    bg: "bg-slate-900",
    text: "text-white",
    border: "border-slate-800",
  },
  ARRIVED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};
