# Phase 5: Plan 04 Summary — Prescription & Inventory Stock Deduction

**Completed:** 2026-07-02
**Status:** Success

## 🛠️ What Was Done

1. **Created Resep Controller:**
   - Created [resep.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/controllers/tps/resep.ts) implementing the `createResep` handler.
   - The handler enforces:
     - **Role-based Access Control:** Only users with role `apoteker` or `admin` are authorized. Other roles return a 403 Forbidden.
     - **XOR Validation:** Verifies that every prescription item has either `obat_id` OR `formula_id` specified, not both, and not neither.
     - **Pre-check Stock Verification:** Checks aggregate quantity requirements of all requested medicines (including formula components mapped to their base medicine components) in the user's `faskes_id`. Returns a 400 Bad Request detailing insufficient stocks if any item is short.
     - **Database Transactions:** Employs a Sequelize transaction `sequelize.transaction` for atomic database updates. If the transaction succeeds, it creates the `Resep` header, `ResepItem` list, decrements stock in the `Stok` table using the FEFO (First Expired, First Out) principle, and writes audit trails to the `PergerakanStok` table (type `keluar`). If any error occurs, the entire transaction rollbacks.
     - **Duplicate Prevention:** Enforces that a visit (`RekamMedis` record) can only have one prescription (returns 409 Conflict if one already exists).

2. **Registered Route & Swagger Documentation:**
   - Registered `POST /kunjungan/:id/resep` in [tps.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/routes/tps.ts).
   - Added complete Swagger OpenAPI JSDoc annotations detailing body schema, role guards, and response statuses.

## 🧪 Verification Results

- Verified clean TypeScript compilation.
- Confirmed correct transaction, validation, and role guard mechanics.
