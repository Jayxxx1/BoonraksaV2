// server/prisma.config.js
import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// โหลด Env ให้มั่นใจว่าเจอ Database URL
dotenv.config();

export default defineConfig({
  migrations: {
    seed: {
      command: "node prisma/seed.js"
    }
  },
  earlyAccess: true, 
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});