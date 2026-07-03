# Phase 5: Plan 06 Summary — End-to-End Verification Test Suite

**Completed:** 2026-07-02
**Status:** Success

## 🛠️ What Was Done

1. **Created Automated Verification Script:**
   - Created [test-tps.ts](file:///D:/projects/isd-project/sehat-terus/scripts/test-tps.ts) which acts as an integration and business logic verification suite.
   - The script automates tests for:
     - **Authentication Login:** Logs in as apoteker (`apoteker@sehatterus.id`) and manager (`carmen@sehatterus.id`) and stores cookies.
     - **Auth Guard Limits:** Verifies that unauthenticated lookups yield a 401 Unauthorized status.
     - **Reference lookups:** Hits `/api/tps/referensi/penyakit`, `/wilayah`, `/obat`, and `/formula` to verify they return list payloads.
     - **Kunjungan CRUD validation:**
       - Creates a visit successfully.
       - Blocks visits with unregistered Sleman kecamatan domisili (returns 400).
       - Blocks visits with future dates (returns 400).
       - Verifies the visit is listed with `ada_resep = false`.
       - Updates visit name successfully (returns 200).
     - **Prescription & Stock Transaction mechanics:**
       - Blocks prescription creation by unauthorized roles (returns 403 for managers).
       - Successfully dispenses a prescription containing both direct medicines and racikan formulas.
       - Enforces **FEFO stock deduction** on the database and verifies that stok amounts are decremented.
       - Blocks updates or deletions to the visit once a prescription is linked (returns 409 Conflict).
       - Blocks duplicate prescription creations for the same visit (returns 409).
       - Blocks prescription items exceeding available stock (returns 400 with "Stok tidak cukup" error listing deficient items).
     - **MIS Dashboard stats integration:** Hits `/api/cases/summary` and verifies it returns calculated caseloads and disease listings.

2. **Registered Command:**
   - Added `"test:tps": "tsx scripts/test-tps.ts"` to root [package.json](file:///D:/projects/isd-project/sehat-terus/package.json).

## 🧪 Verification Results

- Execution of `npm run test:tps` completes successfully with a full green report.
- Transaction rollback verified and working properly during stock-out conditions.
