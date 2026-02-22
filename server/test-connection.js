import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function test() {
  console.log(
    "Testing connection to:",
    process.env.DATABASE_URL.replace(/:(.*)@/, ":****@"),
  );
  try {
    const userCount = await prisma.user.count();
    console.log("✅ Success! Number of users:", userCount);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
