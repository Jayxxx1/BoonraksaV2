// server/prisma/seed.js

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

// เรียกใช้ Prisma (V7 Early Access อ่านจาก Config)
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. สร้าง Categories หลัก
  const categoriesData = [
    { name: 'เสื้อช็อป (Shop Shirts)' },
    { name: 'เสื้อโปโล (Polo)' },
    { name: 'เสื้อยืด/คนงาน (T-Shirts)' },
    { name: 'ยูนิฟอร์มราชการ (Official Uniforms)' },
    { name: 'แจ็คเก็ต/สูท (Jackets)' },
    { name: 'อุปกรณ์ความปลอดภัย (Safety Gear)' },
    { name: 'อื่นๆ (Others)' },
  ];

  console.log('📦 Seeding Categories...');
  for (const c of categoriesData) {
    await prisma.category.create({ data: c });
  }

  // 2. สร้าง Admin User
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN', 
      isActive: true,
    },
  });
  console.log(`👤 Created User: ${adminUser.username} (Role: ${adminUser.role})`);

  // 3. สร้างสินค้าตัวอย่าง (เสื้อช็อป A)
  const shopCategory = await prisma.category.findFirst({ 
    where: { name: { contains: 'เสื้อช็อป' } } 
  });

  if (shopCategory) {
    const product = await prisma.product.create({
      data: {
        name: 'เสื้อช็อปแขนยาว A (ตัวอย่าง)',
        codePrefix: 'A',
        description: 'เสื้อช็อปเนื้อผ้าเวสปอยท์ ทนทาน',
        categoryId: shopCategory.id,
        imageUrl: 'https://placehold.co/600x400/png',
        variants: {
          create: [
            {
              sku: 'A101-M',
              code: 'A101',
              color: 'กรมท่า',
              size: 'M',
              gender: 'unisex',
              price: 450,
              stock: 100,
              minStock: 10,
              location: 'A1-01'
            },
            {
              sku: 'A101-L',
              code: 'A101',
              color: 'กรมท่า',
              size: 'L',
              gender: 'unisex',
              price: 450,
              stock: 50,
              minStock: 10,
              location: 'A1-02'
            }
          ]
        }
      }
    });
    console.log(`👕 Created Product: ${product.name}`);
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });