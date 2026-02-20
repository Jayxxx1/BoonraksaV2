import { PreorderStatus } from "../modules/orders/order.constants.js";

/**
 * Shared Order Logic Utility
 * Ensures single source of truth for complex order conditions.
 */

export const getPreorderItems = (orderItems, purchaseRequests) => {
  return orderItems.map((item) => {
    const pr = purchaseRequests?.find((p) => p.variantId === item.variantId);
    return {
      ...item,
      isPreorder: !!pr,
      preorderQty: pr ? pr.quantity : 0,
      prStatus: pr ? pr.status : null,
    };
  });
};

export const hasPreorder = (order, itemsWithPreorderInfo) => {
  return (
    (order.preorderSubStatus &&
      order.preorderSubStatus !== PreorderStatus.NONE) ||
    itemsWithPreorderInfo.some((item) => item.isPreorder)
  );
};

export const getIsReadyForProduction = (order) => {
  return !!(
    order.stockRechecked &&
    order.physicalItemsReady &&
    order.graphicJobSheetAttached
  );
};

export const getProductionStatus = (order) => {
  if (order.productionCompletedAt) return "PRODUCTION_DONE";
  if (order.productionStartedAt) return "IN_PRODUCTION";
  if (getIsReadyForProduction(order)) return "READY_FOR_PRODUCTION";
  return "NOT_READY";
};
