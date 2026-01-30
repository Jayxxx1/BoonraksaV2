
import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";

// @desc    Search customer blocks by phone or name
// @route   GET /api/blocks/customer-search
// @access  Private
export const searchCustomerBlocks = asyncHandler(async (req, res) => {
  const { q } = req.query; // query string (phone or name)

  if (!q) {
    return res.status(200).json({ status: "success", data: { blocks: [] } });
  }

  // Find orders by this customer that have a linked block
  const blocks = await prisma.embroideryBlock.findMany({
    where: {
      orders: {
        some: {
          OR: [
            { customerPhone: { contains: q } },
            { customerName: { contains: q, mode: 'insensitive' } }
          ]
        }
      }
    },
    distinct: ['id'],
    select: {
      id: true,
      name: true,
      artworkUrl: true, // Show the final artwork as reference
      code: true
    },
    take: 20
  });

  res.status(200).json({
    status: "success",
    data: { blocks }
  });
});
