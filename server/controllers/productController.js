import prisma from '../src/prisma/client.js';
import { asyncHandler } from '../src/middleware/error.middleware.js';

// ดึงสินค้าทั้งหมด (รองรับการค้นหาและ Pagination)
export const getProducts = asyncHandler(async (req, res) => {
  const { search, categoryId, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // เงื่อนไขการค้นหา
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { codePrefix: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (categoryId) where.categoryId = parseInt(categoryId);

  // Query ข้อมูล
  const products = await prisma.product.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: {
      category: true,
      variants: { select: { stock: true, price: true } } // ดึงมาคำนวณหน้าบ้าน
    },
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.product.count({ where });

  // ปรับแต่งข้อมูลก่อนส่ง (คำนวณราคากับสต็อกรวม)
  const formattedProducts = products.map(p => ({
    ...p,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    startPrice: p.variants.length > 0 ? Math.min(...p.variants.map(v => parseFloat(v.price))) : 0,
    variants: undefined // ลบ variants ทิ้งเพื่อลดขนาดไฟล์ JSON
  }));

  res.json({
    success: true,
    data: formattedProducts,
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ดึงรายละเอียดสินค้า 1 ชิ้น (เจาะจง ID)
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      variants: {
        orderBy: [{ color: 'asc' }, { size: 'asc' }]
      }
    }
  });

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  res.json({ success: true, data: product });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: categories });
});

// สร้างสินค้าใหม่ (พร้อม Variants)
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name, codePrefix, description, imageUrl, categoryId,
    variants // รับเป็น Array ของ objects [{ sku, color, size, price, ... }]
  } = req.body;

  // Validate ข้อมูลเบื้องต้น
  if (!name || !categoryId || !variants || variants.length === 0) {
    return res.status(400).json({ success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องมีชื่อ, หมวดหมู่ และสินค้าอย่างน้อย 1 รายการ)' });
  }

  // สร้าง Product พร้อม Variants ในคำสั่งเดียว (Nested Write)
  const product = await prisma.product.create({
    data: {
      name,
      codePrefix,
      description,
      // FUTURE INTEGRATION: imageUrl should store S3 keys/paths generated 
      // via storagePath.generateProductPath(id, filename)
      imageUrl,
      categoryId: parseInt(categoryId),
      variants: {
        create: variants.map(v => ({
          sku: v.sku,
          code: v.code || `${codePrefix}-${v.color}-${v.size}`,
          color: v.color,
          size: v.size,
          price: parseFloat(v.price),
          cost: parseFloat(v.cost || 0),
          stock: parseInt(v.stock || 0),
          gender: v.gender || 'unisex'
        }))
      }
    },
    include: { variants: true }
  });

  res.status(201).json({ success: true, data: product });
});
