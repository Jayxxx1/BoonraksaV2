import { PrismaClient } from '@prisma/client';

const url = "postgresql://postgres:Jay2004@127.0.0.1:5432/boonraksa_db?schema=public&connect_timeout=5";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

async function main() {
  console.log('Attempting to connect to 127.0.0.1...');
  try {
    await prisma.$connect();
    console.log('Successfully connected!');
    const users = await prisma.user.count();
    console.log('Users:', users);
  } catch (e) {
    console.error('Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
