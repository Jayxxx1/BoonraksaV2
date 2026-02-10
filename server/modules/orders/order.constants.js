/**
 * Order Status Enums
 */
export const OrderStatus = {
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
  PENDING_ARTWORK: "รออาร์ตเวิร์ค",
  DESIGNING: "กำลังออกแบบ",
  PENDING_STOCK_CHECK: "รอเช็คสต็อก",
  STOCK_ISSUE: "สต็อกมีปัญหา",
  STOCK_RECHECKED: "สต็อกครบ/เตรียมผลิต",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_FINISHED: "ผลิตเสร็จ/รอ QC",
  QC_PASSED: "ผ่าน QC",
  READY_TO_SHIP: "เตรียมจัดส่ง",
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
};

/**
 * Sub Status Labels
 */
export const SubStatus = {
  PURCHASING: "กำลังสั่งซื้อ",
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
