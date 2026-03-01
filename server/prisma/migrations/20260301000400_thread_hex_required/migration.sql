-- Enforce HEX-driven thread colors

ALTER TABLE "ThreadColor"
  ALTER COLUMN "colorCode" SET DEFAULT '#000000';

UPDATE "ThreadColor"
SET "colorCode" = '#000000'
WHERE "colorCode" IS NULL OR LENGTH(TRIM("colorCode")) = 0;

ALTER TABLE "ThreadColor"
  ALTER COLUMN "colorCode" SET NOT NULL;
