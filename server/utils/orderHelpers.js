/**
 * Helper to ensure numbers are safe for Prisma Decimal/Int
 */
export const safeNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

/**
 * Helper to get the start of the current day in Asia/Bangkok
 * Stored as a UTC date marker (00:00:00 UTC) representing the local day.
 */
export const getBangkokStartOfDay = () => {
  const now = new Date();
  const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  bangkokTime.setHours(0, 0, 0, 0);
  return bangkokTime;
};

/**
 * Helper to mask staff names for Sales role
 */
export const maskStaffNamesForSales = (order, userRole) => {
  if (!order) return order;
  const privilegedRoles = ["ADMIN", "EXECUTIVE", "MARKETING", "FINANCE", "SUPER_ADMIN"];
  
  // If user is privileged, return original
  if (privilegedRoles.includes(userRole)) return order;

  const maskedOrder = { ...order };
  
  // Helper to mask a single user object
  const maskUser = (u, fallbackRole) => {
    if (!u) return null;
    const roleLabels = {
      SALES: "ฝ่ายขาย",
      GRAPHIC: "ฝ่ายกราฟิก",
      STOCK: "ฝ่ายสต็อก",
      PRODUCTION: "ฝ่ายผลิต",
      SEWING_QC: "ฝ่ายตัดเย็บ/QC",
      DELIVERY: "ฝ่ายจัดส่ง",
    };
    const roleName = roleLabels[u.role] || fallbackRole || u.role;
    const code = u.salesNumber || u.code || String(u.id).padStart(3, '0').slice(-3);
    return { ...u, name: `${roleName} #${code}` };
  };

  if (maskedOrder.graphic) maskedOrder.graphic = maskUser(maskedOrder.graphic, "ฝ่ายกราฟิก");
  if (maskedOrder.stock) maskedOrder.stock = maskUser(maskedOrder.stock, "ฝ่ายสต็อก");
  if (maskedOrder.production) maskedOrder.production = maskUser(maskedOrder.production, "ฝ่ายผลิต");
  if (maskedOrder.qc) maskedOrder.qc = maskUser(maskedOrder.qc, "ฝ่ายตัดเย็บ/QC");

  return maskedOrder;
};

/**
 * Generate a new Job ID ([salesNumber]/[dailyRunning])
 */
export const generateJobId = async (tx, user) => {
  const todayStart = getBangkokStartOfDay();
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  // Use a lock to prevent duplicate numbering
  const lastOrder = await tx.order.findFirst({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { dailyRunning: "desc" },
    select: { dailyRunning: true },
  });

  const nextRunning = (lastOrder?.dailyRunning || 0) + 1;
  const salesCode = user.salesNumber || String(user.id).padStart(2, "0");
  const jobId = `${salesCode}/${String(nextRunning).padStart(3, "0")}`;

  return {
    jobId,
    dailyRunning: nextRunning,
    orderDate: todayStart,
  };
};
