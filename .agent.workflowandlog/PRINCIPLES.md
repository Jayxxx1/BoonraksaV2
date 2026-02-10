# Agent Memory Directive

The following principles are considered **LONG-TERM** project rules and must be applied to all future work unless explicitly revoked:

## 🏛️ Architectural Integrity

- **Backend-driven UI via actionMap is mandatory.** Frontend components must never infer permissions, roles, or status transitions locally.
- **order.service.js is the sole owner of business logic.** All calculations (prices, totals, balances), status machine transitions, and data normalization live here.
- **order.permissions.js is the sole owner of permission logic.** It generates the explicit `actionMap` consumed by the frontend.
- **order.constants.js is the single source of truth for enums.** No inline strings or magic strings are allowed for roles, statuses, or error codes.

## 🛡️ Production Standards

- **Zero UI Breakage**: Frontend visuals and user flows must remain identical during refactors.
- **Zero Logic Drift**: Business rules must behave exactly as defined in `WORKFLOW_LOGIC.md`.
- **Zero Duplication**: Shared logic must be centralized in the service layer.
- **Strict Validation**: All incoming data must be validated against schemas in `order.validation.js`.

## 🔄 Change Management

- **Incremental Refactoring**: Prefer small, safe steps over large overhauls.
- **Stability > Elegance**: If a refactor risks breaking existing behavior, prioritize preservation of original logic.
- **Document Every Change**: Every significant refactor must be logged in `.agent/ORDER_MODULE_CHANGELOG.md`.

## 🏷️ Design System

- Maintain the **Professional, Compact, Ultra-Efficient** design aesthetic.
- Use `erp-` utility classes and Tailwind CSS tokens as defined in `FRONTEND_GUIDE.md`.
