# Order Module Changelog

This document tracks all significant structural changes and refactors to the Order Module.

## [2026-02-10] - Initial Production Refactor

### Changed

- **Structure**: Migrated monolithic order logic from `server/controllers/orderController.js` to a modular DDD Lite structure in `server/modules/orders/`.
- **Backend Architecture**:
  - Implemented `order.service.js` (Business Logic & Normalization).
  - Implemented `order.permissions.js` (Centralized Action Map Engine).
  - Implemented `order.constants.js` (Centralized Enums & Error Codes).
  - Implemented `order.validation.js` (Zod Schemas).
  - Implemented `order.controller.js` (Lean Request/Response handling).
  - Implemented `order.routes.js` (Consolidated modular routes).
- **Frontend Refactor**:
  - `OrderDetail.jsx`: Removed all role-based conditionals; purely driven by `actionMap`.
  - `OrderStatusBar.jsx`: Converted to `actionMap` architecture.
  - `OrderTechnicalSpecs.jsx`: Integrated `actionMap` for edit/upload permissions.
  - `CreateOrder.jsx` & `OrderList.jsx`: Updated to use centralized `api` service and modular response format.

### Fixed

- Standardized QC pass/fail workflow and automated status transitions.
- Fixed data format mismatch in `OrderList.jsx` that caused legacy "Unable to load orders" error.
- Resolved route shadowing for `/api/orders/channels` and `/api/orders/search/:jobId` by prioritizing specific routes over the generic `/:id` parameter.
- Restored 100% legacy parity by implementing modular handlers for `updatePurchasingInfo`, `logProductionAction`, and `printJobSheetSignal`.
- Resolved multiple syntax and lint errors during the transition.

### Explicitly Not Changed

- **UI Layout**: No changes to visual density, spacing, or component structure.
- **Business Logic**: Preserved original workflow logic, pricing calculations, and data relationships.
- **API Contracts**: Preserved existing data fields to ensure zero breakage of legacy extensions.

### Confirmations

- [x] No API contract changes
- [x] No UI changes
- [x] No workflow changes
