import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { autoUpdateUrgentOrders } from './orderController.js'; // 🆕 Import helper

export const getMyStats = async (req, res) => {
  try {
    // 🆕 Auto-update urgency for stale orders
    await autoUpdateUrgentOrders();

    const { id, role } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let stats = {
      todayCount: 0,
      totalCount: 0,
      totalSales: 0,
      urgentCount: 0
    };

    // Determine which field to filter by based on role
    let filterField = null;
    switch (role) {
      case "SALES":
        filterField = "salesId";
        break;
      case "GRAPHIC":
        filterField = "graphicId";
        break;
      case "PRODUCTION":
        filterField = "productionId";
        break;
      case "SEWING_QC":
        filterField = "qcId";
        break;
      case "STOCK":
        filterField = "stockId";
        break;
      case "DELIVERY":
        filterField = "deliveryId";
        break; // Check if this field exists, otherwise use activity logs maybe?
      default:
        filterField = null;
    }

    // If it's a role assigned to specific orders
    if (filterField) {
      // Safety check: only use field if it actually exists in schema
      // (Simplified for now, using known fields)
      const validFields = [
        "salesId",
        "graphicId",
        "productionId",
        "qcId",
        "stockId",
      ];
      if (validFields.includes(filterField)) {
        const whereBase = { [filterField]: id };

        stats.totalCount = await prisma.order.count({
          where: whereBase,
        });

        stats.todayCount = await prisma.order.count({
          where: {
            ...whereBase,
            createdAt: {
              gte: today,
            },
          },
        });

        stats.urgentCount = await prisma.order.count({
          where: {
            ...whereBase,
            isUrgent: true,
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
          },
        });

        if (role === "SALES") {
          const salesData = await prisma.order.aggregate({
            where: whereBase,
            _sum: {
              totalPrice: true,
            },
          });
          stats.totalSales = Number(salesData._sum.totalPrice || 0);
        }
      }
    } else if (["ADMIN", "EXECUTIVE", "MARKETING", "FINANCE"].includes(role)) {
      // Global stats for management roles
      stats.totalCount = await prisma.order.count();
      stats.todayCount = await prisma.order.count({
        where: { createdAt: { gte: today } },
      });

      stats.urgentCount = await prisma.order.count({
        where: {
          isUrgent: true,
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        },
      });

      const salesData = await prisma.order.aggregate({
        _sum: { totalPrice: true },
      });
      stats.totalSales = Number(salesData._sum.totalPrice || 0);
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
