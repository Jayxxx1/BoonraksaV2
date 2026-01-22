import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export default defineConfig({
  migrations: {
    seed: {
      command: "node prisma/seed.js"
    }
  },
  
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasources: [
    {
      name: 'db',
      url: process.env.DATABASE_URL
    }
  ]
});
