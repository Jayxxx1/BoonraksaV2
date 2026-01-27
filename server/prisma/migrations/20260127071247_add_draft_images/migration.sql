-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "draftImages" TEXT[],
ADD COLUMN     "urgentNote" TEXT;
