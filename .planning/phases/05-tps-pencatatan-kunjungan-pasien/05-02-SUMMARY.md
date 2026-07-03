# Phase 5: Plan 02 Summary — Reference Endpoints

**Completed:** 2026-07-02
**Status:** Success

## 🛠️ What Was Done

1. **Created Referensi Controller:**
   - Created [referensi.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/controllers/tps/referensi.ts) containing four lookup handlers:
     - `listPenyakit`: Merges a static list of common primary care diseases with distinct diseases found in the `RekamMedis` table.
     - `listWilayah`: Returns all districts (kecamatan) in Sleman from the `Wilayah` table.
     - `listObat`: Returns active medicines that have `stok.jumlah_tersedia > 0` in the user's `faskes_id`. Supports text query `q` and medicine group `golongan` filters.
     - `listFormula`: Returns formula recipes that have sufficient stock (>= takaran) for all their components in the user's faskes.

2. **Registered & Documented Routes:**
   - Created [tps.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/routes/tps.ts) which mounts all TPS endpoints and enforces `requireAuth` middleware.
   - Mounted `tpsRouter` under `/api/tps` in the main Express [app.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/app.ts).
   - Added complete OpenAPI JSDoc Swagger annotations for the lookup endpoints.

## 🧪 Verification Results

- Verified clean TypeScript compilation.
- Checked route availability and correct routing mounting.
