# Task History Archive

This document preserves the detailed task lists from major feature implementations for future architectural reference.

## [2026-02-12] Factory-Grade Production Workflow

### Objective

Implement a factory-grade production workflow prioritizing operational realism, simplicity for workers, and shift-level accountability.

### Tasks Completed

- **Schema & Backend**
  - Added `productionStatus` (READY_FOR_PRODUCTION, IN_PRODUCTION, PRODUCTION_DONE).
  - Added readiness flags: `stockRechecked`, `physicalItemsReady`, `graphicJobSheetAttached`.
  - Added timestamps: `readyForProductionAt`, `productionStartedAt`, `productionCompletedAt`.
  - Implemented `autoStart` transition on Order Detail view (triggering simulation of QR scan).
  - Consolidated `DailyProductionReport` into modular `OrderService`.
- **Frontend Dashboard**
  - Refactored `ProductionSearch.jsx` to be "Job Sheet" centric.
  - Implemented high-contrast technical specs display for production floor.
  - Restricted financial data (pricing, notes) for the `PRODUCTION` role.
  - Updated button logic to "ผลิตเสร็จสิ้น" (Finish Production).
- **Shift Reporting**
  - Implemented `ShiftReport.jsx` for supervisors to log aggregate output and efficiency.
- **RBAC & Privacy**
  - Implemented backend data stripping for `PRODUCTION` (Financials) and `SALES` (Staff names).

---

## [2026-02-12] Role-Based Procurement & Purchasing Workflow

### Objective

Refine the purchasing and procurement system to handle pre-orders, ETA tracking, and strict role-based data control.

### Tasks Completed

- **Purchasing Dashboard**
  - Made `OrderCard` fully clickable and increased density.
  - Restricted "Confirm Arrival" actions to Purchasing/Admin only.
- **Procurement Logic**
  - Added backend-calculated `preorderQty` (shortage) to item normalization.
  - Implemented `isDelayed` flag based on `purchasingEta` vs `dueDate`.
  - Restricted ETA editing to 1-change limit for Purchasing role.
- **UI/UX Refinement**
  - Integrated `ConfirmationModal.jsx` for critical status transitions.
  - Implemented "Emerald Theme" for arrived products in procurement.
  - Applied role-specific visibility for `Final Artwork` and `Production Files`.

---

## [2026-02-10] Order Module Modularization

### Objective

Migrate monolithic order logic to a modular DDD Lite structure.

### Tasks Completed

- Extracted logic to `order.service.js`, `order.permissions.js`, and `order.controller.js`.
- Consolidated API routes and standardized error codes.
- Implemented `actionMap` architecture for frontend control.
