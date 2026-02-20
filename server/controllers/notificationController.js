import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";

/**
 * Get all notifications for current user
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          displayJobCode: true,
          customerName: true,
        },
      },
    },
    take: 50,
  });

  res.status(200).json({ status: "success", data: { notifications } });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.update({
    where: { id: parseInt(id) },
    data: { isRead: true },
  });

  res.status(200).json({ status: "success", data: { notification } });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({ status: "success", message: "All marked as read" });
});
