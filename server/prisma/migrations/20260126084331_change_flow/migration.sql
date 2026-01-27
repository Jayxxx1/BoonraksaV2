/*
  Warnings:

  - The values [PENDING,DESIGNING,DESIGNED,CONFIRMED,PRODUCTION,QC,PACKING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `blockPrice` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

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

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PURCHASING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "depositSlipUrl" TEXT,
ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "purchasingEta" TIMESTAMP(3),
ADD COLUMN     "purchasingReason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'CREATED',
ALTER COLUMN "blockPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2);
