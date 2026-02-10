---
description: Garment Production Workflow Logic (5 Steps + Pre-order)
---

# Garment Production Workflow Documentation

This document describes the core business logic and API flow for the Boonraksa Garment System.

## 🏢 Role-Based Access Control (RBAC)

The system uses 8 specific roles:
`ADMIN`, `EXECUTIVE`, `SALES`, `GRAPHIC`, `STOCK`, `PRODUCTION`, `SEWING_QC`, `DELIVERY`.

## 🔄 The 5-Step Workflow

### 1. Sales (Billing & Initial Stock)

- **Status**: `PENDING` (if stock available) or `WAITING_STOCK` (if any item is missing).
- **Trigger**: `POST /api/orders`.
- **Logic**:
  - Atomically deducts stock from `ProductVariant`.
  - If `stock < requested`, creates `PurchaseRequest` entries and sets status to `WAITING_STOCK`.

### 2. Graphic (Design & Artwork)

- **Status**: `DESIGNING` -> `DESIGNED`.
- **Trigger**: `PATCH /api/orders/:id/artwork`.
- **Output**:
  - Artwork URL (S3) saved.
  - Job Sheet PDF generated (`GET /api/orders/:id/jobsheet`) with QR Code.

### 3. Stock (Verification & Goods Receipt)

- **Status**: `DESIGNED` -> `CONFIRMED`.
- **Trigger**: `PATCH /api/orders/:id/stock-confirm`.
- **Goods Receipt Trigger**: `POST /api/stock/receive`.
  - Receives new inventory.
  - **Auto-Fulfillment**: Automatically checks `PurchaseRequest` (FIFO), locks stock to `WAITING_STOCK` orders, and moves them to `PENDING` once fully supplied.

### 4. Production (Manufacturing)

- **Status**: `CONFIRMED` -> `PRODUCTION` -> `PACKING`.
- **Trigger**: `PATCH /api/orders/:id/production-status`.

### 5. QC & Delivery (Shipment)

- **Status**: `PACKING` -> `COMPLETED`.
- **Trigger**: `PATCH /api/orders/:id/complete`.
- **Logic**: Input `trackingNo` and finalize.

## 📝 Critical Rules

- **No Hardcoding**: All configs must come from `src/config/config.js` via `.env`.
- **Audit Logging**: All status changes MUST be logged in the `ActivityLog` table.
- **Data Integrity**: Stock management must happen within Prisma transactions.
- **S3 Storage**: Artwork and PDF files should be managed via `storage.service.js`.

## 🛠 Commands

- `npm run dev`: Start development server.
- `npx prisma studio`: UI for database inspection.
- `npx prisma migrate dev`: Run migrations.
