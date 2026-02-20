/**
 * Order Status Enums
 */
export const OrderStatus = {
  PENDING_DIGITIZING: "PENDING_DIGITIZING",
  PENDING_ARTWORK: "PENDING_ARTWORK",
  DESIGNING: "DESIGNING",
  PENDING_STOCK_CHECK: "PENDING_STOCK_CHECK",
  STOCK_ISSUE: "STOCK_ISSUE",
  STOCK_RECHECKED: "STOCK_RECHECKED",
  IN_PRODUCTION: "IN_PRODUCTION",
  PRODUCTION_FINISHED: "PRODUCTION_FINISHED",
  QC_PASSED: "QC_PASSED",
  READY_TO_SHIP: "READY_TO_SHIP",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

/**
 * Order Status Labels (Thai)
 */
export const StatusLabels = {
  PENDING_DIGITIZING: "รอตีลาย",
  PENDING_ARTWORK: "รออาร์ตเวิร์ค",
  DESIGNING: "กำลังออกแบบ",
  PENDING_STOCK_CHECK: "รอเช็คสต็อก",
  STOCK_ISSUE: "สต็อกมีปัญหา",
  STOCK_RECHECKED: "สต็อกครบ/เตรียมผลิต",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_FINISHED: "ผลิตเสร็จ/รอ QC",
  QC_PASSED: "รอจัดส่ง",
  READY_TO_SHIP: "พร้อมจัดส่ง",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

/**
 * Payment Status Enums
 */
export const PaymentStatus = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
};

/**
 * Block Type Enums
 */
export const BlockType = {
  OLD: "OLD",
  EDIT: "EDIT",
  NEW: "NEW",
};

/**
 * Role Labels (Thai) for Privacy
 */
export const RoleLabels = {
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

/**
 * User Roles
 */
export const UserRole = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  EXECUTIVE: "EXECUTIVE",
  SALES: "SALES",
  MARKETING: "MARKETING",
  GRAPHIC: "GRAPHIC",
  STOCK: "STOCK",
  PRODUCTION: "PRODUCTION",
  SEWING_QC: "SEWING_QC",
  DELIVERY: "DELIVERY",
  FINANCE: "FINANCE",
  PURCHASING: "PURCHASING",
  DIGITIZER: "DIGITIZER",
};

/**
 * Sub Status Labels
 */
export const SubStatus = {
  PURCHASING: "กำลังสั่งซื้อ",
};

/**
 * Pre-order Status Enums
 */
export const PreorderStatus = {
  NONE: "NONE",
  WAITING_PURCHASE_INPUT: "WAITING_PURCHASE_INPUT", // รอจัดซื้อระบุวัน
  WAITING_ARRIVAL: "WAITING_ARRIVAL", // รอสินค้าเข้า
  PURCHASE_CONFIRMED: "PURCHASE_CONFIRMED", // ยืนยันการสั่งซื้อแล้ว
  DELAYED_ROUND_1: "DELAYED_ROUND_1", // ล่าช้าครั้งที่ 1
  DELAYED_ROUND_2: "DELAYED_ROUND_2", // ล่าช้าครั้งที่ 2 (แจังผู้บริหาร)
  ARRIVED: "ARRIVED", // สินค้าเข้าแล้ว
};

/**
 * Pre-order Status Labels (Thai)
 */
export const PreorderStatusLabels = {
  NONE: "-",
  WAITING_PURCHASE_INPUT: "รอระบุวันเข้า",
  WAITING_ARRIVAL: "ดำเนินการสั่งซื้อ",
  PURCHASE_CONFIRMED: "ยืนยันสั่งซื้อแล้ว",
  DELAYED_ROUND_1: "ล่าช้าครั้งที่ 1",
  DELAYED_ROUND_2: "ล่าช้าครั้งที่ 2 (แจ้งผู้บริหาร)",
  ARRIVED: "สินค้าเข้าแล้ว",
};

/**
 * Response Error Codes
 */
export const OrderErrorCodes = {
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  UNAUTHORIZED_ACTION: "UNAUTHORIZED_ACTION",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  STOCK_INSUFFICIENT: "STOCK_INSUFFICIENT",
  PAYMENT_INCOMPLETE: "PAYMENT_INCOMPLETE",
  TRACKING_REQUIRED: "TRACKING_REQUIRED",
};
