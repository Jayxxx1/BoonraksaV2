-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "productionId" INTEGER,
ADD COLUMN     "stockId" INTEGER;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
