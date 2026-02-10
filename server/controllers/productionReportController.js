import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

export const getReports = asyncHandler(async (req, res) => {
  const reports = await prisma.dailyProductionReport.findMany({
    include: {
      foreman: { select: { id: true, name: true, nickname: true } }
    },
    orderBy: { date: 'desc' }
  });

  res.status(200).json({
    status: 'success',
    data: { reports }
  });
});

export const createReport = asyncHandler(async (req, res) => {
  const { 
    date, 
    shift, 
    staffCount, 
    machineCount, 
    targetOutput, 
    actualOutput, 
    missingReason, 
    solution 
  } = req.body;

  const report = await prisma.dailyProductionReport.create({
    data: {
      date: new Date(date),
      shift,
      staffCount: parseInt(staffCount),
      machineCount: parseInt(machineCount),
      targetOutput: parseInt(targetOutput),
      actualOutput: parseInt(actualOutput),
      missingReason: missingReason || '',
      solution: solution || '',
      foremanId: req.user.id
    },
    include: {
      foreman: { select: { name: true } }
    }
  });

  res.status(201).json({
    status: 'success',
    data: { report }
  });
});
