-- Add order-level embroidery files array for Digitizer flow
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "embroideryFileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy single-file field for existing records
UPDATE "Order"
SET "embroideryFileUrls" = ARRAY["embroideryFileUrl"]
WHERE
  ("embroideryFileUrls" IS NULL OR cardinality("embroideryFileUrls") = 0)
  AND "embroideryFileUrl" IS NOT NULL
  AND "embroideryFileUrl" <> '';

-- Enforce non-null with empty array default
UPDATE "Order"
SET "embroideryFileUrls" = ARRAY[]::TEXT[]
WHERE "embroideryFileUrls" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "embroideryFileUrls" SET NOT NULL;

ALTER TABLE "Order"
ALTER COLUMN "embroideryFileUrls" SET DEFAULT ARRAY[]::TEXT[];
