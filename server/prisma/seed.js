// server/prisma/seed.js

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");

  // 1. สร้าง Categories หลัก
  const categoriesData = [
    { name: "เสื้อช็อป (Shop Shirts)" },
    { name: "เสื้อโปโล (Polo)" },
    { name: "เสื้อยืด (T-Shirts)" },
    { name: "ยูนิฟอร์ม (Uniforms)" },
    { name: "อื่นๆ (Others)" },
  ];

  console.log("📦 Seeding Categories...");
  for (const c of categoriesData) {
    await prisma.category
      .upsert({
        where: { id: categoriesData.indexOf(c) + 1 }, // This is just a mock for id if we knew them, but name is better
        // Better way since name isn't unique in schema yet, but let's just create if not exists
        update: {},
        create: c,
      })
      .catch(() => console.log(`Category ${c.name} already exists or error`));
  }

  // 2. สร้างแผนกต่างๆ (Users) - ตำแหน่งละ 5 คน
  const hashedPassword = await bcrypt.hash("password123", 10);

  const roles = [
    "ADMIN",
    "EXECUTIVE",
    "SALES",
    "GRAPHIC",
    "STOCK",
    "PRODUCTION",
    "SEWING_QC",
    "DELIVERY",
    "PURCHASING",
    "MARKETING",
    "FINANCE",
    "DIGITIZER",
  ];

  console.log("👤 Seeding Users (5 users per role)...");
  console.log("📝 Login Credentials (Dev Mode):");
  console.log("   Password for all users: password123");
  console.log("");

  for (const role of roles) {
    for (let i = 1; i <= 5; i++) {
      const username = `${role.toLowerCase()}${i}`;
      const name = `${role} User ${i}`;
      const salesNumber = role === "SALES" ? `${10 + (i - 1)}` : null;

      await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          role,
          name,
          password: hashedPassword,
          salesNumber,
          isActive: true,
        },
      });
      console.log(`   ✓ ${username.padEnd(15)} | ${role.padEnd(12)} | ${name}`);
    }
    console.log("   -------------------------------------------------");
  }

  // สร้างบัญชีหลักแบบเดิมเผื่อไว้เทส
  const legacyUsers = [
    { username: "admin", role: "ADMIN", name: "Super Admin" },
    { username: "executive", role: "EXECUTIVE", name: "ผู้บริหาร" },
    {
      username: "sales",
      role: "SALES",
      name: "ฝ่ายขาย คุณเอ",
      salesNumber: "10",
    },
  ];

  for (const u of legacyUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        ...u,
        password: hashedPassword,
        isActive: true,
      },
    });
  }
  console.log("");

  // 3. สร้างสินค้าตัวอย่าง
  const shopCategory = await prisma.category.findFirst({
    where: { name: { contains: "เสื้อช็อป" } },
  });

  if (shopCategory) {
    const commonSizes = ["S", "M", "L", "XL", "2XL"];
    const bigSizes = ["7XL", "8XL", "9XL"];

    // Helper to generate variants
    const generateVariants = (
      prefix,
      color,
      sizes,
      normalPrice,
      bigPrice = null,
    ) => {
      return sizes.map((size) => ({
        sku: `${prefix}-${color}-${size}`,
        code: prefix,
        color: color,
        size: size,
        price:
          bigPrice && ["7XL", "8XL", "9XL"].includes(size)
            ? bigPrice
            : normalPrice,
        stock: Math.floor(Math.random() * 200),
      }));
    };

    const productsToSeed = [
      {
        id: 1,
        name: "ช็อปแขนยาว A101 - กรมท่า",
        codePrefix: "A101",
        description: "เสื้อช็อปแขนยาว เนื้อผ้าเวสปอยท์ สีกรมท่า (ยอดฮิต)",
        variants: [
          ...generateVariants(
            "A101",
            "กรมท่า",
            [...commonSizes, "3XL", "4XL", ...bigSizes],
            450,
            550,
          ),
          ...generateVariants("A101", "ดำ", commonSizes, 450),
        ],
      },
      {
        id: 2,
        name: "ช็อปแขนสั้น A902 - น้ำเงินกรม",
        codePrefix: "A902",
        description: "เสื้อช็อปแขนสั้น เนื้อผ้าเวสปอยท์ สีน้ำเงินกรม",
        variants: [
          ...generateVariants(
            "A902",
            "น้ำเงินกรม",
            [...commonSizes, "3XL", "4XL", "5XL", "6XL"],
            450,
          ),
        ],
      },
      {
        id: 3,
        name: "ช็อปแขนยาว A102 - ครีม",
        codePrefix: "A102",
        description: "เสื้อช็อปแขนยาว สีครีม สะอาดตา",
        variants: [
          ...generateVariants(
            "A102",
            "ครีม",
            [...commonSizes, "3XL", "4XL", ...bigSizes],
            450,
            550,
          ),
        ],
      },
      {
        id: 4,
        name: "ช็อปแขนสั้น A904 - ส้มเทา",
        codePrefix: "A904",
        description: "เสื้อช็อปแขนสั้น ทูโทน ส้มเทา (งานสั่งทำมาตรฐาน)",
        variants: [
          ...generateVariants(
            "A904",
            "ส้ม/เทา",
            [...commonSizes, "3XL", "4XL", "6XL"],
            450,
          ),
        ],
      },
      {
        id: 5,
        name: "ช็อปแขนยาว A103 - แดง",
        codePrefix: "A103",
        description: "เสื้อช็อปแขนยาว สีแดงสดใส",
        variants: [
          ...generateVariants(
            "A103",
            "แดง",
            [...commonSizes, "3XL", "4XL", ...bigSizes],
            450,
            550,
          ),
        ],
      },
    ];

    for (const p of productsToSeed) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          codePrefix: p.codePrefix,
          description: p.description,
          categoryId: shopCategory.id,
          imageUrl: `https://placehold.co/600x400/png?text=${p.codePrefix}`,
          variants: {
            create: p.variants,
          },
        },
      });
    }
    console.log(
      `👕 Seeded ${productsToSeed.length} sample products with multiple variations.`,
    );
  }

  // 4. สร้าง Sales Channels (Facebook Pages)
  const salesChannels = [
    {
      code: "001",
      name: "เพจบ่าวบุญรักษา (หลัก)",
      url: "https://facebook.com/boonraksa.main",
    },
    {
      code: "002",
      name: "บุญรักษา สาขา 2",
      url: "https://facebook.com/boonraksa.branch2",
    },
    {
      code: "003",
      name: "Uniform by Boonraksa",
      url: "https://facebook.com/boonraksa.uniform",
    },
    {
      code: "004",
      name: "Boonraksa Premium Shop",
      url: "https://facebook.com/boonraksa.premium",
    },
    {
      code: "005",
      name: "เพจเสี่ยสั่งลุย by Boonraksa",
      url: "https://facebook.com/boonraksa.sj",
    },
  ];

  console.log("📱 Seeding Sales Channels...");
  for (const sc of salesChannels) {
    await prisma.salesChannel.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
