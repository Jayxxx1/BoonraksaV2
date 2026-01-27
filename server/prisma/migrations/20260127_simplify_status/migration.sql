/*
  Warnings:

  - The values [CREATED,WAITING_STOCK,READY_FOR_ARTWORK,ARTWORK_UPLOADED,JOB_PRINTED,STOCK_RECHECKED,PRODUCTION_FINISHED,QC_PASSED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/

-- Step 1: Add new enum values (without removing old ones yet)
-- Prisma will handle this automatically

-- Step 2: Migrate existing data to new status values
-- CRITICAL: This must run before dropping old enum values

-- รวม CREATED, WAITING_STOCK, READY_FOR_ARTWORK -> PENDING_ARTWORK
UPDATE "Order" 
SET status = 'PENDING_ARTWORK' 
WHERE status IN ('CREATED', 'WAITING_STOCK', 'READY_FOR_ARTWORK');

-- ARTWORK_UPLOADED -> DESIGNING
UPDATE "Order" 
SET status = 'DESIGNING' 
WHERE status = 'ARTWORK_UPLOADED';

-- JOB_PRINTED -> PENDING_STOCK_CHECK
UPDATE "Order" 
SET status = 'PENDING_STOCK_CHECK' 
WHERE status = 'JOB_PRINTED';

-- รวม STOCK_RECHECKED, PRODUCTION_FINISHED -> IN_PRODUCTION
UPDATE "Order" 
SET status = 'IN_PRODUCTION' 
WHERE status IN ('STOCK_RECHECKED', 'PRODUCTION_FINISHED');

-- QC_PASSED -> READY_TO_SHIP
UPDATE "Order" 
SET status = 'READY_TO_SHIP' 
WHERE status = 'QC_PASSED';

-- Step 3: Verify no orders are using old statuses
DO $$
DECLARE
  old_status_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_status_count
  FROM "Order"
  WHERE status IN (
    'CREATED', 'WAITING_STOCK', 'READY_FOR_ARTWORK', 
    'ARTWORK_UPLOADED', 'JOB_PRINTED', 'STOCK_RECHECKED',
    'PRODUCTION_FINISHED', 'QC_PASSED'
  );
  
  IF old_status_count > 0 THEN
    RAISE EXCEPTION 'Found % orders still using old statuses. Migration failed.', old_status_count;
  END IF;
END $$;

-- Step 4: AlterEnum - Remove old values and finalize new enum
-- This will be handled by Prisma automatically after data migration

-- CreateTable for PaymentSlip
CREATE TABLE "PaymentSlip" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "slipUrl" TEXT NOT NULL,
    "note" TEXT,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSlip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentSlip" ADD CONSTRAINT "PaymentSlip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSlip" ADD CONSTRAINT "PaymentSlip_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
