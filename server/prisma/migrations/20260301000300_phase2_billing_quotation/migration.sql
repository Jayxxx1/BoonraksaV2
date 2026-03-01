-- Phase 2: add quotation billing indicator

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "requireQuotation" BOOLEAN NOT NULL DEFAULT false;
