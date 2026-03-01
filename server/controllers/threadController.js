import prisma from "../src/prisma/client.js";
import { asyncHandler } from "../src/middleware/error.middleware.js";

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const normalizeThreadName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const getThreads = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();

  const threads = await prisma.threadColor.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ code: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      colorCode: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { threads },
  });
});

export const createThread = asyncHandler(async (req, res) => {
  const { code, name, colorCode } = req.body;
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  const normalizedName = String(name || "").trim();
  const normalizedColorCode = String(colorCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedCode || !normalizedName) {
    return res
      .status(400)
      .json({ status: "fail", message: "Code and name are required." });
  }

  if (!HEX_COLOR_REGEX.test(normalizedColorCode)) {
    return res.status(400).json({
      status: "fail",
      message: "colorCode must be HEX format, for example #FF0000",
    });
  }

  const existing = await prisma.threadColor.findUnique({
    where: { code: normalizedCode },
  });
  if (existing) {
    return res.status(400).json({
      status: "fail",
      message: "This thread code already exists.",
    });
  }

  const thread = await prisma.threadColor.create({
    data: {
      code: normalizedCode,
      name: normalizedName,
      colorCode: normalizedColorCode,
    },
    select: {
      id: true,
      code: true,
      name: true,
      colorCode: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    status: "success",
    data: { thread },
  });
});

export const deleteThread = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return res
      .status(400)
      .json({ status: "fail", message: "Invalid thread id." });
  }

  await prisma.threadColor.delete({ where: { id } });
  res.status(204).json({ status: "success", data: null });
});

export const bulkUpdateThreadColors = asyncHandler(async (req, res) => {
  const mappings = Array.isArray(req.body?.mappings) ? req.body.mappings : [];
  if (mappings.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "mappings is required and must be a non-empty array.",
    });
  }

  const normalized = [];
  const invalid = [];

  for (const item of mappings) {
    const name = String(item?.name || "").trim();
    const colorCode = String(item?.colorCode || "")
      .trim()
      .toUpperCase();

    if (!name || !HEX_COLOR_REGEX.test(colorCode)) {
      invalid.push({ name, colorCode });
      continue;
    }
    normalized.push({
      name,
      normalizedName: normalizeThreadName(name),
      colorCode,
    });
  }

  if (normalized.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "No valid mappings. Expected [{ name, colorCode: '#RRGGBB' }].",
      data: { invalid },
    });
  }

  // If the same name is provided multiple times, keep the latest one only.
  const dedupMap = new Map();
  for (const row of normalized) {
    dedupMap.set(row.normalizedName, row);
  }
  const deduplicatedMappings = [...dedupMap.values()];

  const updates = [];
  const notFound = [];
  const ambiguous = [];
  let unchanged = 0;
  let updated = 0;

  const allThreads = await prisma.threadColor.findMany({
    select: { id: true, code: true, name: true, colorCode: true },
  });
  const nameIndex = new Map();
  for (const thread of allThreads) {
    const key = normalizeThreadName(thread.name);
    if (!nameIndex.has(key)) {
      nameIndex.set(key, []);
    }
    nameIndex.get(key).push(thread);
  }

  for (const row of deduplicatedMappings) {
    const matches = nameIndex.get(row.normalizedName) || [];
    if (matches.length === 0) {
      notFound.push({ name: row.name });
      continue;
    }
    if (matches.length > 1) {
      ambiguous.push({
        name: row.name,
        matches: matches.map((m) => ({ code: m.code, name: m.name })),
      });
      continue;
    }

    const target = matches[0];
    if (String(target.colorCode || "").toUpperCase() === row.colorCode) {
      unchanged += 1;
      continue;
    }
    updates.push(
      prisma.threadColor.update({
        where: { id: target.id },
        data: { colorCode: row.colorCode },
      }),
    );
    updated += 1;
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return res.status(200).json({
    status: "success",
    message: "Bulk thread color update completed by name.",
    data: {
      requested: mappings.length,
      valid: normalized.length,
      deduplicated: deduplicatedMappings.length,
      updated,
      unchanged,
      notFound,
      ambiguous,
      invalid,
    },
  });
});
