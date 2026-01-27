-- Migration: Simplify Order Status
-- จาก 13 สถานะ เหลือ 9 สถานะ
-- Run this BEFORE deploying new code

-- Step 1: แปลงสถานะเก่าเป็นใหม่
UPDATE "Order" SET status = 'PENDING_ARTWORK' 
WHERE status IN ('CREATED', 'READY_FOR_ARTWORK', 'WAITING_STOCK');

UPDATE "Order" SET status = 'DESIGNING' 
WHERE status = 'ARTWORK_UPLOADED';

UPDATE "Order" SET status = 'PENDING_STOCK_CHECK' 
WHERE status = 'JOB_PRINTED';

UPDATE "Order" SET status = 'IN_PRODUCTION' 
WHERE status IN ('STOCK_RECHECKED', 'PRODUCTION_FINISHED');

UPDATE "Order" SET status = 'READY_TO_SHIP' 
WHERE status = 'QC_PASSED';

-- STOCK_ISSUE, COMPLETED, CANCELLED เก็บไว้เหมือนเดิม (ไม่ต้องทำอะไร)

-- Step 2: ตรวจสอบว่าไม่มีสถานะเก่าเหลือ
-- ควรได้ผลลัพธ์ 0 rows
SELECT status, COUNT(*) 
FROM "Order" 
WHERE status NOT IN (
  'PENDING_ARTWORK', 
  'DESIGNING', 
  'PENDING_PAYMENT', 
  'PENDING_STOCK_CHECK', 
  'STOCK_ISSUE', 
  'IN_PRODUCTION', 
  'READY_TO_SHIP', 
  'COMPLETED', 
  'CANCELLED'
)
GROUP BY status;

-- Step 3: หลังจากนั้นให้ run: npx prisma db push
-- เพื่ออัปเดต enum ใน database
