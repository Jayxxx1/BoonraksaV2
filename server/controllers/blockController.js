import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

/**
 * Get all blocks with search
 */
export const getBlocks = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { description: { contains: search } }
    ];
  }

  const blocks = await prisma.embroideryBlock.findMany({
    where,
    orderBy: { updatedAt: 'desc' }
  });

  res.status(200).json({ status: 'success', data: { blocks } });
});

/**
 * Create a new block (usually from Graphic)
 */
export const createBlock = asyncHandler(async (req, res) => {
  const { name, code, description, artworkUrl, productionFileUrl, productionFileName, orderId } = req.body;

  const block = await prisma.embroideryBlock.create({
    data: {
      name,
      code,
      description,
      artworkUrl,
      productionFileUrl,
      productionFileName
    }
  });

  // If created from an order, link it immediately
  if (orderId) {
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { 
        blockId: block.id,
        blockType: 'OLD' // Since it's now in the library
      }
    });
  }

  res.status(201).json({ status: 'success', data: { block } });
});

/**
 * Link an existing block to an order
 */
export const linkBlockToOrder = asyncHandler(async (req, res) => {
  const { orderId, blockId } = req.params;

  const block = await prisma.embroideryBlock.findUnique({
    where: { id: parseInt(blockId) }
  });

  if (!block) {
    return res.status(404).json({ status: 'fail', message: 'Block not found' });
  }

  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { 
      blockId: block.id,
      // Sync technical details from block to order for production convenience
      artworkUrl: block.artworkUrl,
      productionFileUrl: block.productionFileUrl,
      productionFileName: block.productionFileName
    }
  });

  res.status(200).json({ status: 'success', data: { order } });
});

/**
 * Update block details
 */
export const updateBlock = asyncHandler(async (req, res) => {
  const { blockId } = req.params;
  const data = req.body;

  const block = await prisma.embroideryBlock.update({
    where: { id: parseInt(blockId) },
    data
  });

  res.status(200).json({ status: 'success', data: { block } });
});
