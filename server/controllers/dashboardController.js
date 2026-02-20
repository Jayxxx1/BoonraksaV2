import prisma from "../src/prisma/client.js";
import { autoUpdateUrgentOrders } from "./orderController.js";
import { OrderStatus } from "../constants/orderConstants.js";

/**
 * Get statistics for the current user's role
 */
export const getMyStats = async (req, res) => {
  try {
    // 🆕 Auto-update urgency for stale orders
    await autoUpdateUrgentOrders();

    const { id, role } = req.user;
    const userId = parseInt(id); // Defensive: ensure ID is an integer
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let stats = {
      todayCount: 0,
      totalCount: 0,
      totalSales: 0,
      urgentCount: 0,
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
      case "DIGITIZER":
        filterField = "digitizerId";
        break;
      case "PURCHASING":
        // Purchasing doesn't track assigned orders in the same way yet,
        // but we can add logic here if needed.
        break;
      case "DELIVERY":
        // Delivery doesn't have a deliveryId in the Order model yet.
        break;
      default:
        filterField = null;
    }

    // Management/Administrative roles see global stats
    const managementRoles = [
      "ADMIN",
      "EXECUTIVE",
      "MARKETING",
      "FINANCE",
      "SUPER_ADMIN",
    ];

    if (filterField) {
      // 🆕 Define "Available" criteria for each role to include in counts
      let availableCriteria = null;
      if (role === "GRAPHIC") {
        availableCriteria = {
          graphicId: null,
          status: {
            in: [OrderStatus.PENDING_ARTWORK, OrderStatus.DESIGNING],
          },
        };
      } else if (role === "DIGITIZER") {
        availableCriteria = {
          digitizerId: null,
          status: OrderStatus.PENDING_DIGITIZING,
        };
      } else if (role === "STOCK") {
        availableCriteria = {
          stockId: null,
          status: {
            in: [OrderStatus.PENDING_STOCK_CHECK, OrderStatus.STOCK_ISSUE],
          },
        };
      } else if (role === "SEWING_QC") {
        availableCriteria = {
          qcId: null,
          status: OrderStatus.PRODUCTION_FINISHED,
        };
      }

      const assignedFilter = { [filterField]: userId };

      const visibilityFilter = availableCriteria
        ? { OR: [assignedFilter, availableCriteria] }
        : assignedFilter;

      const baseQuery = {
        ...visibilityFilter,
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      };

      // Run counts in parallel to reduce sequential DB roundtrips
      const [totalCount, todayCount, urgentCount] = await Promise.all([
        prisma.order.count({ where: baseQuery }),
        prisma.order.count({
          where: { ...baseQuery, createdAt: { gte: today } },
        }),
        prisma.order.count({ where: { ...baseQuery, isUrgent: true } }),
      ]);

      stats.totalCount = totalCount;
      stats.todayCount = todayCount;
      stats.urgentCount = urgentCount;

      // 4. Total Sales (Only for Sales role)
      if (role === "SALES") {
        const salesData = await prisma.order.aggregate({
          where: baseQuery,
          _sum: { totalPrice: true },
        });
        stats.totalSales = Number(salesData._sum.totalPrice || 0);
      }
    } else if (managementRoles.includes(role)) {
      // Global stats for management roles
      stats.totalCount = await prisma.order.count({
        where: {
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        },
      });

      stats.todayCount = await prisma.order.count({
        where: { createdAt: { gte: today } },
      });

      stats.urgentCount = await prisma.order.count({
        where: {
          isUrgent: true,
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        },
      });

      const salesData = await prisma.order.aggregate({
        _sum: { totalPrice: true },
      });
      stats.totalSales = Number(salesData._sum.totalPrice || 0);
    }

    res.json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

/**
 * Get SLA KPI data
 */
export const getSLAKPIs = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        dueDate: { not: null },
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
        slaBufferLevel: true,
      },
    });

    const now = new Date().getTime();
    const kpi = {
      STOCK: { total: 0, late: 0, label: "ฝ่ายสต็อก" },
      GRAPHIC: { total: 0, late: 0, label: "ฝ่ายกราฟิก/ตีลาย" },
      PRODUCTION: { total: 0, late: 0, label: "ฝ่ายผลิต" },
      QC: { total: 0, late: 0, label: "ฝ่าย QC" },
    };

    orders.forEach((order) => {
      const dueDate = new Date(order.dueDate);
      const bufferDays = parseInt(order.slaBufferLevel || 0);
      const internalDeadline = new Date(dueDate);
      internalDeadline.setDate(internalDeadline.getDate() - bufferDays);

      const deptDeadlines = {
        STOCK: new Date(internalDeadline).getTime() - 5 * 24 * 60 * 60 * 1000,
        GRAPHIC: new Date(internalDeadline).getTime() - 4 * 24 * 60 * 60 * 1000,
        PRODUCTION:
          new Date(internalDeadline).getTime() - 2 * 24 * 60 * 60 * 1000,
        QC: new Date(internalDeadline).getTime() - 0.5 * 24 * 60 * 60 * 1000,
      };

      let dept = null;
      let deadline = null;

      if (order.status === OrderStatus.PENDING_STOCK_CHECK) {
        dept = "STOCK";
        deadline = deptDeadlines.STOCK;
      } else if (
        [
          OrderStatus.PENDING_ARTWORK,
          OrderStatus.DESIGNING,
          OrderStatus.PENDING_DIGITIZING,
        ].includes(order.status)
      ) {
        dept = "GRAPHIC";
        deadline = deptDeadlines.GRAPHIC;
      } else if (
        [OrderStatus.STOCK_RECHECKED, OrderStatus.IN_PRODUCTION].includes(
          order.status,
        )
      ) {
        dept = "PRODUCTION";
        deadline = deptDeadlines.PRODUCTION;
      } else if (order.status === OrderStatus.PRODUCTION_FINISHED) {
        dept = "QC";
        deadline = deptDeadlines.QC;
      }

      if (dept) {
        kpi[dept].total++;
        if (now > deadline) {
          kpi[dept].late++;
        }
      }
    });

    res.json(kpi);
  } catch (error) {
    console.error("SLA KPI Error:", error);
    res.status(500).json({ error: "Failed to fetch SLA KPIs" });
  }
};

/**
 * Get KPIs for Executive Dashboard
 */
export const getExecutiveKPIs = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. SLA Health (Current active orders)
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        dueDate: { not: null },
      },
      select: {
        status: true,
        dueDate: true,
        slaBufferLevel: true,
      },
    });

    const now = new Date().getTime();
    const slaHealth = { GREEN: 0, YELLOW: 0, RED: 0 };

    activeOrders.forEach((order) => {
      const dueDate = new Date(order.dueDate);
      const bufferDays = parseInt(order.slaBufferLevel || 0);
      const internalDeadline = new Date(dueDate);
      internalDeadline.setDate(internalDeadline.getDate() - bufferDays);

      const deptDeadlines = {
        STOCK: new Date(internalDeadline).getTime() - 5 * 24 * 60 * 60 * 1000,
        GRAPHIC: new Date(internalDeadline).getTime() - 4 * 24 * 60 * 60 * 1000,
        PRODUCTION:
          new Date(internalDeadline).getTime() - 2 * 24 * 60 * 60 * 1000,
        QC: new Date(internalDeadline).getTime() - 0.5 * 24 * 60 * 60 * 1000,
      };

      let targetDeadline = deptDeadlines.QC;
      if ([OrderStatus.PENDING_STOCK_CHECK].includes(order.status)) {
        targetDeadline = deptDeadlines.STOCK;
      } else if (
        [
          OrderStatus.PENDING_ARTWORK,
          OrderStatus.DESIGNING,
          OrderStatus.PENDING_DIGITIZING,
        ].includes(order.status)
      ) {
        targetDeadline = deptDeadlines.GRAPHIC;
      } else if (
        [OrderStatus.STOCK_RECHECKED, OrderStatus.IN_PRODUCTION].includes(
          order.status,
        )
      ) {
        targetDeadline = deptDeadlines.PRODUCTION;
      }

      const timeLeft = targetDeadline - now;
      if (timeLeft < 0) slaHealth.RED++;
      else if (timeLeft < 24 * 60 * 60 * 1000) slaHealth.YELLOW++;
      else slaHealth.GREEN++;
    });

    // 2. Rejection Trends (Last 30 days)
    const rejections = await prisma.rejectionLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { reason: true, isSalesError: true },
    });

    const reasonsMap = {};
    let salesErrorCount = 0;
    rejections.forEach((r) => {
      reasonsMap[r.reason] = (reasonsMap[r.reason] || 0) + 1;
      if (r.isSalesError) salesErrorCount++;
    });

    const topReasons = Object.entries(reasonsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    // 3. Overall Order Stats & Waste (Last 30 days)
    const orderStats = await prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { damagedCount: true },
      _count: { id: true },
    });

    res.json({
      slaHealth,
      rejectionTrends: {
        total: rejections.length,
        salesErrorCount,
        topReasons,
      },
      productionWaste: {
        totalDamaged: orderStats._sum.damagedCount || 0,
        totalOrders: orderStats._count.id,
      },
    });
  } catch (error) {
    console.error("Executive KPI Error:", error);
    res.status(500).json({ error: "Failed to fetch Executive KPIs" });
  }
};
