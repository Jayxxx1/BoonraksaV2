import {
  OrderStatus,
  UserRole,
  PaymentStatus,
  PreorderStatus,
  OrderFlowType,
} from "./order.constants.js";

/**
 * Centralized Permission Engine for Orders
 * Returns an actionMap that dictates what a user can do to a specific order.
 */
export const getOrderActionMap = (order, user) => {
  if (!order || !user) return {};

  const role = user.role;
  const status = order.status;
  const isAdmin = [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.EXECUTIVE,
  ].includes(role);

  // Ownership checks
  const isCreator = order.salesId === user.id;
  const isClaimedByMe =
    order.graphicId === user.id ||
    order.stockId === user.id ||
    order.productionId === user.id ||
    order.qcId === user.id ||
    order.digitizerId === user.id;

  // Pre-order restrictions for Sales (HARD RULE)
  const isPreorderPending =
    order.preorderSubStatus &&
    order.preorderSubStatus !== PreorderStatus.NONE &&
    order.preorderSubStatus !== PreorderStatus.ARRIVED;
  const isRestrictiveSales = role === UserRole.SALES && isPreorderPending;
  const isDirectSale = order.flowType === OrderFlowType.DIRECT_SALE;
  const requiresBillingDoc =
    !!order.requireInvoice || !!order.requireReceipt || !!order.requireQuotation;
  const billingReady = !requiresBillingDoc || !!order.billingCompletedAt;
  const qaBlocked = !!order.qaRequired && !order.qaApprovedAt;

  return {
    // General Actions
    canView: true,
    canEditSpecs:
      !isDirectSale &&
      (isAdmin || role === UserRole.GRAPHIC) &&
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status),
    canCancel:
      (isAdmin ||
        (isCreator &&
          [OrderStatus.PENDING_ARTWORK, OrderStatus.STOCK_ISSUE].includes(
            status,
          ) &&
          !isRestrictiveSales)) &&
      status !== OrderStatus.CANCELLED,
    canMarkUrgent:
      isAdmin ||
      (isCreator &&
        status !== OrderStatus.COMPLETED &&
        status !== OrderStatus.CANCELLED &&
        !isRestrictiveSales),

    // Workflow Actions
    canClaim:
      !isClaimedByMe &&
      !isAdmin &&
      ((role === UserRole.GRAPHIC &&
        [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status) &&
        !order.graphicId) ||
        (role === UserRole.DIGITIZER &&
          status === OrderStatus.PENDING_DIGITIZING &&
          !order.digitizerId) ||
        (role === UserRole.STOCK &&
          [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE].includes(
            status,
          ) &&
          !order.stockId) ||
        (role === UserRole.PRODUCTION &&
          status === OrderStatus.STOCK_RECHECKED &&
          !order.productionId) ||
        (role === UserRole.SEWING_QC &&
          status === OrderStatus.PRODUCTION_FINISHED &&
          !order.qcId)),

    // Graphic Actions
    canUploadArtwork:
      !isDirectSale &&
      (isAdmin ||
        (role === UserRole.GRAPHIC && (isClaimedByMe || !order.graphicId))) &&
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status),

    canQaApprove:
      !isDirectSale &&
      (isAdmin || (role === UserRole.GRAPHIC && isClaimedByMe)) &&
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status) &&
      qaBlocked,

    canSendToStock:
      !isDirectSale &&
      (isAdmin || (role === UserRole.GRAPHIC && isClaimedByMe)) &&
      [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING].includes(status) &&
      !qaBlocked,

    // Digitizer Actions
    canUploadEmbroidery:
      (isAdmin ||
        (role === UserRole.DIGITIZER &&
          (isClaimedByMe || !order.digitizerId))) &&
      status === OrderStatus.PENDING_DIGITIZING,

    canSendToGraphic:
      (isAdmin || (role === UserRole.DIGITIZER && isClaimedByMe)) &&
      status === OrderStatus.PENDING_DIGITIZING,

    // Stock Actions
    canConfirmStock:
      (isAdmin || (role === UserRole.STOCK && isClaimedByMe)) &&
      [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE].includes(
        status,
      ),

    canReportStockIssue:
      (isAdmin || (role === UserRole.STOCK && isClaimedByMe)) &&
      status === OrderStatus.PENDING_STOCK_CHECK,

    // Production Actions
    canStartProduction:
      !isDirectSale &&
      (isAdmin || (role === UserRole.PRODUCTION && isClaimedByMe)) &&
      status === OrderStatus.STOCK_RECHECKED,

    canFinishProduction:
      !isDirectSale &&
      (isAdmin ||
        (role === UserRole.PRODUCTION &&
          (isClaimedByMe || order.productionId === user.id))) &&
      status === OrderStatus.IN_PRODUCTION,

    // QC Actions
    canPassQC:
      !isDirectSale &&
      (isAdmin || (role === UserRole.SEWING_QC && isClaimedByMe)) &&
      status === OrderStatus.PRODUCTION_FINISHED,

    canFailQC:
      !isDirectSale &&
      (isAdmin || (role === UserRole.SEWING_QC && isClaimedByMe)) &&
      status === OrderStatus.PRODUCTION_FINISHED,

    // Delivery Actions
    canReceiveForShip:
      (isAdmin || role === UserRole.DELIVERY) &&
      (status === OrderStatus.QC_PASSED ||
        (isDirectSale && status === OrderStatus.STOCK_RECHECKED)),
    canShip:
      (isAdmin || role === UserRole.DELIVERY) &&
      status === OrderStatus.READY_TO_SHIP &&
      order.paymentStatus === PaymentStatus.PAID &&
      billingReady,
    canEditBillingIndicator: isAdmin || role === UserRole.SALES,
    canMarkBillingCompleted:
      (isAdmin || role === UserRole.DELIVERY) &&
      requiresBillingDoc &&
      !order.billingCompletedAt &&
      [
        OrderStatus.STOCK_RECHECKED,
        OrderStatus.QC_PASSED,
        OrderStatus.READY_TO_SHIP,
      ].includes(status),

    // Financial Actions
    canUploadSlip:
      isAdmin || role === UserRole.SALES || role === UserRole.DELIVERY,
    canVerifyPayment: isAdmin || role === UserRole.FINANCE,

    // UI Visibility
    canViewPreorder:
      isAdmin ||
      [
        UserRole.SALES,
        UserRole.PURCHASING,
        UserRole.STOCK,
        UserRole.PRODUCTION,
      ].includes(role),
    canEditPreorder: isAdmin || role === UserRole.PURCHASING,
  };
};

/**
 * Standardize Order View Permissions
 */
export const canViewOrderItems = (order, user) => true;
export const canViewFinancial = (order, user) =>
  [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.EXECUTIVE,
    UserRole.FINANCE,
    UserRole.MARKETING,
    UserRole.SALES,
  ].includes(user.role);
export const canViewTechnical = (order, user) =>
  [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.EXECUTIVE,
    UserRole.GRAPHIC,
    UserRole.PRODUCTION,
    UserRole.STOCK,
    UserRole.SEWING_QC,
    UserRole.DIGITIZER,
  ].includes(user.role);
