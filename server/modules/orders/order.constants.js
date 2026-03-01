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
 * Order Status Labels
 */
export const StatusLabels = {
  PENDING_DIGITIZING: "รอตีลาย",
  PENDING_ARTWORK: "รอออกแบบ",
  DESIGNING: "กำลังออกแบบ",
  PENDING_STOCK_CHECK: "กำลังเช็คสต็อค",
  STOCK_ISSUE: "สต็อคมีปัญหา",
  STOCK_RECHECKED: "รอผลิต",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_FINISHED: "ผลิตเสร็จสิ้น",
  QC_PASSED: "ผ่าน QC",
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
 * Order Flow Type
 */
export const OrderFlowType = {
  EMBROIDERY: "EMBROIDERY",
  DIRECT_SALE: "DIRECT_SALE",
};

export const OrderFlowTypeLabels = {
  EMBROIDERY: "Embroidery flow",
  DIRECT_SALE: "Direct sale flow",
};

/**
 * Role Labels
 */
export const RoleLabels = {
  SALES: "Sales",
  GRAPHIC: "Graphic",
  STOCK: "Stock",
  PRODUCTION: "Production",
  SEWING_QC: "QC",
  DELIVERY: "Delivery",
  PURCHASING: "Purchasing",
  MARKETING: "Marketing",
  FINANCE: "Finance",
  DIGITIZER: "Digitizer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
  EXECUTIVE: "Executive",
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
  PURCHASING: "PURCHASING_IN_PROGRESS",
  QA_PENDING: "QA_PENDING",
  QA_APPROVED: "QA_APPROVED",
};

/**
 * Pre-order Status Enums
 */
export const PreorderStatus = {
  NONE: "NONE",
  WAITING_PURCHASE_INPUT: "WAITING_PURCHASE_INPUT",
  WAITING_ARRIVAL: "WAITING_ARRIVAL",
  PURCHASE_CONFIRMED: "PURCHASE_CONFIRMED",
  DELAYED_ROUND_1: "DELAYED_ROUND_1",
  DELAYED_ROUND_2: "DELAYED_ROUND_2",
  ARRIVED: "ARRIVED",
};

/**
 * Pre-order Status Labels
 */
export const PreorderStatusLabels = {
  NONE: "-",
  WAITING_PURCHASE_INPUT: "Waiting purchase input",
  WAITING_ARRIVAL: "Waiting arrival",
  PURCHASE_CONFIRMED: "Purchase confirmed",
  DELAYED_ROUND_1: "Delayed round 1",
  DELAYED_ROUND_2: "Delayed round 2",
  ARRIVED: "Arrived",
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
