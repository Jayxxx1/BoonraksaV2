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
 * Roles with elevated permissions for order visibility
 */
export const PrivilegedRoles = ["ADMIN", "EXECUTIVE", "FINANCE", "MARKETING"];

/**
 * Roles that can create orders
 */
export const CreatorRoles = ["SALES", "MARKETING", "ADMIN"];
