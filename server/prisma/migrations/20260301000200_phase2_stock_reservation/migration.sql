-- Phase 2: stock reservation support (soft lock while sales prepare order)
CREATE TABLE IF NOT EXISTS "StockReservation" (
  "id" SERIAL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "variantId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockReservation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockReservation_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StockReservation_sessionId_idx"
  ON "StockReservation"("sessionId");
CREATE INDEX IF NOT EXISTS "StockReservation_variantId_expiresAt_idx"
  ON "StockReservation"("variantId", "expiresAt");
CREATE INDEX IF NOT EXISTS "StockReservation_userId_expiresAt_idx"
  ON "StockReservation"("userId", "expiresAt");