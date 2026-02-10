/*
  Warnings:

  - You are about to drop the column `dailySeq` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[systemJobNo]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayJobCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayJobCode` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'COD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'STOCK_RECHECKED';
ALTER TYPE "OrderStatus" ADD VALUE 'PRODUCTION_FINISHED';
ALTER TYPE "OrderStatus" ADD VALUE 'QC_PASSED';

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropIndex
DROP INDEX "Order_jobId_key";

-- AlterTable
ALTER TABLE "ActivityLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "dailySeq",
DROP COLUMN "jobId",
ADD COLUMN     "displayJobCode" TEXT NOT NULL,
ADD COLUMN     "legacyJobCode" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
ADD COLUMN     "subStatus" TEXT,
ADD COLUMN     "systemJobNo" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "OrderEmbroideryPosition" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "textToEmb" TEXT,
    "logoUrl" TEXT,
    "mockupUrl" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderEmbroideryPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadColor" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "colorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProductionReport" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shift" TEXT NOT NULL,
    "foremanId" INTEGER NOT NULL,
    "staffCount" INTEGER NOT NULL,
    "machineCount" INTEGER NOT NULL,
    "targetOutput" INTEGER NOT NULL,
    "actualOutput" INTEGER NOT NULL,
    "missingReason" TEXT,
    "solution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProductionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreadColor_code_key" ON "ThreadColor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_systemJobNo_key" ON "Order"("systemJobNo");

-- CreateIndex
CREATE UNIQUE INDEX "Order_displayJobCode_key" ON "Order"("displayJobCode");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEmbroideryPosition" ADD CONSTRAINT "OrderEmbroideryPosition_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProductionReport" ADD CONSTRAINT "DailyProductionReport_foremanId_fkey" FOREIGN KEY ("foremanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
