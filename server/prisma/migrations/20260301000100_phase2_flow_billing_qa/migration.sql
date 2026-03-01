-- Phase 2: order flow mode, billing indicators, QA checkpoint, stock substitution note

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderFlowType') THEN
    CREATE TYPE "OrderFlowType" AS ENUM ('EMBROIDERY', 'DIRECT_SALE');
  END IF;
END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "flowType" "OrderFlowType" NOT NULL DEFAULT 'EMBROIDERY',
  ADD COLUMN IF NOT EXISTS "requireInvoice" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requireReceipt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "billingCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "purchaseOrder" TEXT,
  ADD COLUMN IF NOT EXISTS "taxInbox" TEXT,
  ADD COLUMN IF NOT EXISTS "qaRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "qaApprovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stockSubstitutionNote" TEXT;
