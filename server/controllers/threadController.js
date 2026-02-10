import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

export const getThreads = asyncHandler(async (req, res) => {
  const threads = await prisma.threadColor.findMany({
    orderBy: { code: 'asc' }
  });

  res.status(200).json({
    status: 'success',
    data: { threads }
  });
});

export const createThread = asyncHandler(async (req, res) => {
  const { code, name, imageUrl, colorCode } = req.body;

  const existing = await prisma.threadColor.findUnique({ where: { code } });
  if (existing) {
    return res.status(400).json({ status: 'fail', message: 'รหัสสีด้ายนี้มีอยู่แล้ว' });
  }

  const thread = await prisma.threadColor.create({
    data: { code, name, imageUrl, colorCode }
  });

  res.status(201).json({
    status: 'success',
    data: { thread }
  });
});

export const deleteThread = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.threadColor.delete({ where: { id: parseInt(id) } });
  res.status(204).json({ status: 'success', data: null });
});
