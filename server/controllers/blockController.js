
import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";

const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const searchCustomerBlocks = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return sendSuccess(res, { blocks: [] });
  }

  const blocks = await prisma.embroideryBlock.findMany({
    where: {
      orders: {
        some: {
          OR: [
            { customerPhone: { contains: q } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    },
    distinct: ["id"],
    select: {
      id: true,
      name: true,
      artworkUrl: true,
      code: true,
    },
    take: 20,
  });

  sendSuccess(res, { blocks });
});

export const listBlocks = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const blocks = await prisma.embroideryBlock.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  sendSuccess(res, { blocks });
});

export const updateBlock = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const payload = {};

  if (req.body.name !== undefined) payload.name = req.body.name;
  if (req.body.code !== undefined) payload.code = req.body.code || null;
  if (req.body.description !== undefined)
    payload.description = req.body.description || null;
  if (req.body.artworkUrl !== undefined)
    payload.artworkUrl = req.body.artworkUrl || null;

  const block = await prisma.embroideryBlock.update({
    where: { id },
    data: payload,
  });

  sendSuccess(res, { block });
});

export const linkBlockToOrder = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const blockId = parseInt(req.params.blockId);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const [order, block] = await Promise.all([
      tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, artworkUrl: true },
      }),
      tx.embroideryBlock.findUnique({
        where: { id: blockId },
        select: { id: true, name: true, artworkUrl: true },
      }),
    ]);

    if (!order) throw new Error("Order not found");
    if (!block) throw new Error("Block not found");

    return await tx.order.update({
      where: { id: orderId },
      data: {
        blockId,
        artworkUrl: order.artworkUrl || block.artworkUrl || undefined,
        logs: {
          create: {
            action: "LINK_BLOCK_LIBRARY",
            details: `Linked block ${block.name} (#${block.id})`,
            userId: req.user.id,
          },
        },
      },
      include: {
        block: true,
      },
    });
  });

  sendSuccess(res, { order: updatedOrder });
});
