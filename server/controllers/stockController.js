import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

/**
 * Goods Receipt: Stock receives items (one or many)
 * Trigger: Update stock and auto-fulfill WAITING_STOCK orders
 */
export const receiveStock = asyncHandler(async (req, res) => {
  let items = req.body.items; // Expecting [{ variantId, quantity, location }]
  
  // Backward compatibility for single item calls
  if (!items && req.body.variantId) {
    items = [{ variantId: req.body.variantId, quantity: req.body.quantity, location: req.body.location }];
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 'fail', message: 'No items provided' });
  }

  const results = [];
  const totalFulfilled = [];

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const { variantId, quantity, location } = item;
      
      if (!variantId || !quantity) continue;

      // 1. Update the actual stock
      const variant = await tx.productVariant.update({
        where: { id: parseInt(variantId) },
        data: { 
          stock: { increment: parseInt(quantity) },
          location: location || undefined
        }
      });

      // 2. Find PENDING purchase requests for this variant
      const pendingPRs = await tx.purchaseRequest.findMany({
        where: { variantId: parseInt(variantId), status: 'PENDING' },
        include: { order: true },
        orderBy: { createdAt: 'asc' }
      });

      let remainingNewStock = parseInt(quantity);
      const fulfilledInThisStep = [];

      // 3. System Trigger: Auto-fulfill
      for (const pr of pendingPRs) {
        if (remainingNewStock <= 0) break;

        if (remainingNewStock >= pr.quantity) {
          await tx.purchaseRequest.update({
            where: { id: pr.id },
            data: { status: 'COMPLETED' }
          });

          remainingNewStock -= pr.quantity;
          
          const otherPRs = await tx.purchaseRequest.count({
            where: { orderId: pr.orderId, status: 'PENDING' }
          });

          if (otherPRs === 0) {
            await tx.order.update({
              where: { id: pr.orderId },
              data: { status: 'PENDING_ARTWORK' }
            });
            fulfilledInThisStep.push(pr.order.jobId);
            totalFulfilled.push(pr.order.jobId);
          }

          await tx.productVariant.update({
            where: { id: pr.variantId },
            data: { stock: { decrement: pr.quantity } }
          });
        }
      }

      results.push({ variant: variant.sku, added: quantity, fulfilled: fulfilledInThisStep });
    }

    // 4. Batch Log
    await tx.activityLog.create({
      data: {
        action: 'GOODS_RECEIPT_BULK',
        details: `Stock ${req.user.name} processed ${items.length} items. Total fulfilled orders: ${[...new Set(totalFulfilled)].join(', ') || 'None'}`,
        userId: req.user.id
      }
    });
  });

  res.status(200).json({
    status: 'success',
    data: { results, fulfilledCount: totalFulfilled.length }
  });
});
