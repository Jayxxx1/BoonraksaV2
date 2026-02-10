import { OrderStatus, UserRole, PaymentStatus } from './order.constants.js';

/**
 * Centralized Permission Engine for Orders
 * Returns an actionMap that dictates what a user can do to a specific order.
 */
export const getOrderActionMap = (order, user) => {
  if (!order || !user) return {};

  const role = user.role;
  const status = order.status;
  const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EXECUTIVE].includes(role);
  
  // Ownership checks
  const isCreator = order.salesId === user.id;
  const isClaimedByMe = (
    order.graphicId === user.id ||
    order.stockId === user.id ||
    order.productionId === user.id ||
    order.qcId === user.id
  );

  return {
    // General Actions
    canView: true,
    canEditSpecs: (isAdmin || role === UserRole.GRAPHIC) && [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status),
    canCancel: (isAdmin || (isCreator && [OrderStatus.PENDING_ARTWORK, OrderStatus.STOCK_ISSUE].includes(status))) && status !== OrderStatus.CANCELLED,
    canMarkUrgent: isAdmin || (isCreator && status !== OrderStatus.COMPLETED && status !== OrderStatus.CANCELLED),
    
    // Workflow Actions
    canClaim: !isClaimedByMe && !isAdmin && (
      (role === UserRole.GRAPHIC && [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status) && !order.graphicId) ||
      (role === UserRole.STOCK && [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE].includes(status) && !order.stockId) ||
      (role === UserRole.PRODUCTION && status === OrderStatus.STOCK_RECHECKED && !order.productionId) ||
      (role === UserRole.SEWING_QC && status === OrderStatus.PRODUCTION_FINISHED && !order.qcId)
    ),
    
    // Graphic Actions
    canUploadArtwork: (isAdmin || (role === UserRole.GRAPHIC && (isClaimedByMe || !order.graphicId))) && 
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status),
      
    canSendToStock: (isAdmin || (role === UserRole.GRAPHIC && isClaimedByMe)) && 
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status),

    // Stock Actions
    canConfirmStock: (isAdmin || (role === UserRole.STOCK && isClaimedByMe)) && 
      [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE].includes(status),
    
    canReportStockIssue: (isAdmin || (role === UserRole.STOCK && isClaimedByMe)) && 
      status === OrderStatus.PENDING_STOCK_CHECK,

    // Production Actions
    canStartProduction: (isAdmin || (role === UserRole.PRODUCTION && isClaimedByMe)) && 
      status === OrderStatus.STOCK_RECHECKED,
      
    canFinishProduction: (isAdmin || (role === UserRole.PRODUCTION && (isClaimedByMe || order.productionId === user.id))) && 
      status === OrderStatus.IN_PRODUCTION,

    // QC Actions
    canPassQC: (isAdmin || (role === UserRole.SEWING_QC && isClaimedByMe)) && 
      status === OrderStatus.PRODUCTION_FINISHED,
      
    canFailQC: (isAdmin || (role === UserRole.SEWING_QC && isClaimedByMe)) && 
      status === OrderStatus.PRODUCTION_FINISHED,

    // Delivery Actions
    canReceiveForShip: (isAdmin || role === UserRole.DELIVERY) && status === OrderStatus.QC_PASSED,
    canShip: (isAdmin || role === UserRole.DELIVERY) && status === OrderStatus.READY_TO_SHIP && order.paymentStatus === PaymentStatus.PAID,
    
    // Financial Actions
    canUploadSlip: true, // Anyone can upload a slip usually, or restricted to Sales/Admin
    canVerifyPayment: isAdmin || role === UserRole.FINANCE,
  };
};

/**
 * Standardize Order View Permissions
 */
export const canViewOrderItems = (order, user) => true;
export const canViewFinancial = (order, user) => 
  [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.FINANCE, UserRole.MARKETING, UserRole.SALES].includes(user.role);
export const canViewTechnical = (order, user) => 
  [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EXECUTIVE, UserRole.GRAPHIC, UserRole.PRODUCTION, UserRole.STOCK, UserRole.SEWING_QC].includes(user.role);
