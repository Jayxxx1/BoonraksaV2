import process from "process";
import dotenv from "dotenv";

dotenv.config();

const requiredAlways = ["NODE_ENV", "DATABASE_URL", "JWT_SECRET"];
const requiredInProd = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "S3_BUCKET",
];

const missing = [];

for (const key of requiredAlways) {
  if (!process.env[key] || String(process.env[key]).trim() === "") {
    missing.push(key);
  }
}

if (process.env.NODE_ENV === "production") {
  for (const key of requiredInProd) {
    if (!process.env[key] || String(process.env[key]).trim() === "") {
      missing.push(key);
    }
  }
}

if (missing.length > 0) {
  console.error("[PREFLIGHT] Missing required env vars:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("[PREFLIGHT] Environment looks valid.");
