import { PrismaClient } from '@prisma/client';
import config from '../config/config.js';

const prisma = new PrismaClient({
  log: ['error'], // Disable query, info, warn for cleaner console
});

export default prisma;
