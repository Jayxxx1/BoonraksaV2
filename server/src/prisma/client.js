import { PrismaClient } from '@prisma/client';
import config from '../config/config.js';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
