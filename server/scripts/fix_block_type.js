
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobId = '10/002';
  console.log(`Searching for order with jobId: ${jobId}`);

  const order = await prisma.order.findFirst({
    where: { jobId: jobId }
  });

  if (!order) {
    console.log('Order not found.');
    return;
  }

  console.log(`Found order ID: ${order.id}, Current BlockType: ${order.blockType}`);

  if (order.blockType === 'OLD') {
    console.log('Updating to NEW...');
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { blockType: 'NEW' }
    });
    console.log(`Updated successfully. New BlockType: ${updated.blockType}`);
  } else {
    console.log('Order is already correct or not OLD.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
