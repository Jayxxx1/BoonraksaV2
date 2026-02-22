import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(8000),

  // Database (Prisma connection string is NOT a normal URL)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth
  JWT_SECRET: isProd
    ? z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters in production")
    : z.string().min(1),

  // CORS
  CORS_ORIGIN: z.string().default("*"),

  // S3 / NIPA / Supabase S3
  S3_ENDPOINT: isProd
    ? z.string().url("S3_ENDPOINT must be a valid URL in production")
    : z.string().min(1),

  S3_REGION: z.string().default("ap-southeast-1"),

  S3_ACCESS_KEY: isProd ? z.string().min(1) : z.string().optional(),
  S3_SECRET_KEY: isProd ? z.string().min(1) : z.string().optional(),
  S3_BUCKET: isProd ? z.string().min(1) : z.string().optional(),

  S3_PUBLIC_URL: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // พิมพ์ Error ออกมาให้ชัดเจนใน Log ของ Railway
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  // ในระหว่าง Deploy เราอาจจะไม่ต้องสั่ง exit ทันทีเพื่อให้พอรันได้บ้าง
  // process.exit(1); 
}

export const config = result.success ? result.data : process.env;
export default config;
