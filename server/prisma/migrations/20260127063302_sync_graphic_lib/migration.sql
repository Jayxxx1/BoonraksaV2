/*
  Warnings:

  - The values [PENDING,CONFIRMED,DESIGNING,DESIGNED,PRODUCTION,QC,PACKING,DELIVERY] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('CREATED', 'WAITING_STOCK', 'READY_FOR_ARTWORK', 'ARTWORK_UPLOADED', 'JOB_PRINTED', 'STOCK_RECHECKED', 'IN_PRODUCTION', 'QC_PASSED', 'READY_TO_SHIP', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "blockId" INTEGER,
ADD COLUMN     "productionFileName" TEXT,
ADD COLUMN     "productionFileUrl" TEXT;

-- CreateTable
CREATE TABLE "EmbroideryBlock" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "artworkUrl" TEXT,
    "productionFileUrl" TEXT,
    "productionFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbroideryBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbroideryBlock_code_key" ON "EmbroideryBlock"("code");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "EmbroideryBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
