import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";

// List products with search, pagination, and optional variant detail payload.
export const getProducts = asyncHandler(async (req, res) => {
  const { search, categoryId, page = 1, limit = 20 } = req.query;
  const includeVariants =
    req.query.includeVariants === "true" ||
    req.query.includeVariants === true ||
    req.query.includeVariants === "1" ||
    req.query.includeVariants === 1;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { codePrefix: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = parseInt(categoryId);

  const products = await prisma.product.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: {
      category: true,
      variants: includeVariants
        ? {
            select: {
              id: true,
              sku: true,
              code: true,
              color: true,
              size: true,
              stock: true,
              minStock: true,
              price: true,
            },
            orderBy: [{ color: "asc" }, { size: "asc" }],
          }
        : { select: { stock: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.product.count({ where });

  const formattedProducts = products.map((p) => {
    const formatted = {
      ...p,
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      startPrice:
        p.variants.length > 0
          ? Math.min(...p.variants.map((v) => parseFloat(v.price)))
          : 0,
    };

    if (!includeVariants) {
      formatted.variants = undefined;
    }

    return formatted;
  });

  res.json({
    success: true,
    data: formattedProducts,
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      variants: {
        orderBy: [{ color: "asc" }, { size: "asc" }],
      },
    },
  });

  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  res.json({ success: true, data: product });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: categories });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, codePrefix, description, imageUrl, categoryId, variants } =
    req.body;

  if (!name || !categoryId || !variants || variants.length === 0) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: name, categoryId, and at least one variant",
    });
  }

  const product = await prisma.product.create({
    data: {
      name,
      codePrefix,
      description,
      imageUrl,
      categoryId: parseInt(categoryId),
      variants: {
        create: variants.map((v) => ({
          sku: v.sku,
          code: v.code || `${codePrefix}-${v.color}-${v.size}`,
          color: v.color,
          size: v.size,
          price: parseFloat(v.price),
          cost: parseFloat(v.cost || 0),
          stock: parseInt(v.stock || 0),
          gender: v.gender || "unisex",
        })),
      },
    },
    include: { variants: true },
  });

  res.status(201).json({ success: true, data: product });
});
