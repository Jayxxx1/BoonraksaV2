/*
  Warnings:

  - The values [CREATED,WAITING_STOCK,READY_FOR_ARTWORK,ARTWORK_UPLOADED,JOB_PRINTED,STOCK_RECHECKED,QC_PASSED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING_ARTWORK', 'DESIGNING', 'PENDING_PAYMENT', 'PENDING_STOCK_CHECK', 'STOCK_ISSUE', 'IN_PRODUCTION', 'READY_TO_SHIP', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_ARTWORK';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stockIssueReason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_ARTWORK';

-- CreateTable
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
