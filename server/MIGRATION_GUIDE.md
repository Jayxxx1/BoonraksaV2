# Prisma Migration Guide

## ✅ วิธีที่ถูกต้อง: ใช้ Prisma Migrate

### ขั้นตอนที่ 1: เตรียม Migration

```bash
cd d:\BoonraksaSystem\server

# สร้าง migration (Prisma จะสร้าง SQL ให้เอง)
npx prisma migrate dev --name simplify_status --create-only
```

**Prisma จะ:**

1. สร้างไฟล์ migration ใน `prisma/migrations/XXXXXX_simplify_status/`
2. Generate SQL จาก schema changes
3. **ยังไม่ run migration** (เพราะใช้ `--create-only`)

---

### ขั้นตอนที่ 2: แก้ไข Migration SQL

เปิดไฟล์ที่ Prisma สร้างและเพิ่ม **custom SQL สำหรับ data migration**:

```sql
-- ข้อมูลที่ผมสร้างไว้แล้วใน migration.sql
-- คัดลอกไปใส่ใน migration file ที่ Prisma สร้าง
```

**สำคัญ:** ต้องเพิ่ม data transformation SQL **ก่อน** Prisma drop enum values เก่า

---

### ขั้นตอนที่ 3: Review Migration

```bash
# ดู SQL ที่จะ run
cat prisma/migrations/XXXXXX_simplify_status/migration.sql
```

ตรวจสอบว่ามี:

1. ✅ Data transformation (UPDATE statements)
2. ✅ Verification (DO $$ block)
3. ✅ CREATE TABLE PaymentSlip
4. ✅ AlterEnum (Prisma generate ให้)

---

### ขั้นตอนที่ 4: Apply Migration

```bash
# Backup ก่อน!
pg_dump -U postgres boonraksa_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migration
npx prisma migrate dev
```

**Prisma จะ:**

1. ✅ Run SQL ตามลำดับ
2. ✅ บันทึก migration history ใน `_prisma_migrations` table
3. ✅ Generate Prisma Client ใหม่อัตโนมัติ

---

### ขั้นตอนที่ 5: Verify

```bash
# เปิด Prisma Studio ตรวจสอบข้อมูล
npx prisma studio
```

ตรวจสอบ:

- ✅ Orders ทั้งหมดใช้สถานะใหม่
- ✅ ไม่มีสถานะเก่าเหลืออยู่
- ✅ PaymentSlip table ถูกสร้างแล้ว

---

## 🔍 ทำไมต้องใช้ Prisma Migrate?

### ❌ วิธีเดิม (psql + db push)

```bash
psql -U postgres ... -f migration.sql  # Manual
npx prisma db push                     # ข้าม migration system
```

**ปัญหา:**

- ❌ ไม่มี migration history
- ❌ ทีมอื่นไม่รู้ว่า migration ไหนถูก apply แล้ว
- ❌ Production กับ Dev database อาจไม่เหมือนกัน
- ❌ Rollback ยาก

### ✅ วิธีใหม่ (Prisma Migrate)

```bash
npx prisma migrate dev --name simplify_status
```

**ข้อดี:**

- ✅ Migration history ใน database (`_prisma_migrations`)
- ✅ Version control สำหรับ schema changes
- ✅ ทีมอื่น run `npx prisma migrate deploy` ได้เลย
- ✅ Rollback ง่าย (ถ้ามี rollback SQL)
- ✅ CI/CD friendly

---

## 🚀 สำหรับ Production

```bash
# Production ใช้ migrate deploy (ไม่ใช่ migrate dev)
npx prisma migrate deploy
```

**ทำไมต้องใช้ `deploy`?**

- ✅ ไม่สร้าง migration ใหม่
- ✅ Apply เฉพาะ migrations ที่ยังไม่ run
- ✅ Safe สำหรับ production

---

## 📋 Checklist

- [ ] 1. `npx prisma migrate dev --name simplify_status --create-only`
- [ ] 2. เพิ่ม data transformation SQL ในไฟล์ที่สร้าง
- [ ] 3. Backup database
- [ ] 4. `npx prisma migrate dev` (apply migration)
- [ ] 5. ตรวจสอบด้วย `npx prisma studio`
- [ ] 6. Test application
- [ ] 7. Commit migration files to git

---

## ⚠️ หมายเหตุสำคัญ

**สำหรับ enum changes:**

- Prisma จะ drop old values หลัง run UPDATE
- ถ้า UPDATE ไม่ครบ จะ error
- ต้อง verify ก่อน drop (DO $$ block)

**หาก migration fail:**

```bash
# Reset migration (development only!)
npx prisma migrate reset

# หรือ resolve manually
npx prisma migrate resolve --applied "migration_name"
```
