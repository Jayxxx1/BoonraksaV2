import prisma from './src/prisma/client.js';

async function diagnose() {
  console.log('--- Timezone Info ---');
  console.log('Server Time:', new Date().toString());
  console.log('Server ISO:', new Date().toISOString());
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  console.log('Start of Day (Local):', startOfDay.toString());
  console.log('Start of Day (ISO):', startOfDay.toISOString());

  console.log('\n--- Recent Orders ---');
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      jobId: true,
      dailySeq: true,
      createdAt: true
    }
  });

  recentOrders.forEach(o => {
    console.log(`ID: ${o.id} | JobID: ${o.jobId} | Seq: ${o.dailySeq} | CreatedAt: ${o.createdAt.toISOString()}`);
  });

  console.log('\n--- Checking DailySeq Logic Simulation ---');
  const lastOrderToday = await prisma.order.findFirst({
    where: {
      createdAt: {
        gte: startOfDay
      }
    },
    orderBy: {
      dailySeq: 'desc'
    },
    select: { dailySeq: true }
  });

  console.log('Last Order Found with GTE startOfDay:', lastOrderToday);
  const nextSeq = (lastOrderToday?.dailySeq || 0) + 1;
  console.log('Next calculated Seq:', nextSeq);

  process.exit(0);
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
