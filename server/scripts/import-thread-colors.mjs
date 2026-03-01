import fs from "fs";
import path from "path";
import prisma from "../src/prisma/client.js";

const inputPath =
  process.argv[2] ||
  path.resolve(process.cwd(), "data", "thread-colors-from-pdf.json");

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf-8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No rows found in input JSON");
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const code = String(row.code || "").trim().toUpperCase();
    const name = String(row.name || "").trim();
    if (!code || !name) continue;

    const existing = await prisma.threadColor.findUnique({
      where: { code },
      select: { id: true },
    });

    await prisma.threadColor.upsert({
      where: { code },
      create: {
        code,
        name,
        colorCode: row.colorCode || null,
        imageUrl: row.imageUrl || null,
      },
      update: {
        name,
        colorCode: row.colorCode || null,
        imageUrl: row.imageUrl || null,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(
    `Thread colors imported successfully. Created: ${created}, Updated: ${updated}`,
  );
}

main()
  .catch((err) => {
    console.error("Import failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
