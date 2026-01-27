import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getSalesChannels = async (req, res) => {
  try {
    const channels = await prisma.salesChannel.findMany({
      orderBy: { code: 'asc' }
    });
    res.status(200).json({
      success: true,
      data: channels
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
