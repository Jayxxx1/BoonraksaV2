// server/seed-orders.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sales = await prisma.user.findFirst({ where: { role: 'SALES' } });
  if (!sales) throw new Error('Please create a SALES user first');

  const channel = await prisma.salesChannel.findFirst();
  const statuses = [
    'CREATED', 'WAITING_STOCK', 'READY_FOR_ARTWORK', 'ARTWORK_UPLOADED',
    'JOB_PRINTED', 'STOCK_RECHECKED', 'IN_PRODUCTION', 'QC_PASSED',
    'READY_TO_SHIP', 'COMPLETED', 'CANCELLED'
  ];

  for (const status of statuses) {
    for (let i = 1; i <= 2; i++) {
        const jobId = `SEED-${status}-${i}-${Date.now().toString().slice(-4)}`;
        await prisma.order.create({
            data: {
                jobId,
                dailySeq: i,
                customerName: `Customer ${status} ${i}`,
                totalPrice: 1000,
                status: status,
                salesId: sales.id,
                salesChannelId: channel?.id || undefined,
                paymentStatus: 'PAID',
                balanceDue: 0
            }
        });
        console.log(`Created order: ${jobId}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
