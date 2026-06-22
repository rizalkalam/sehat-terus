---
phase: 2
slug: mock-ingestion-geographic-mapping-validation
status: green
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-22
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom TS validation script & CLI npm runners |
| **Config file** | scripts/validate-geojson.ts / backend/src/seed.ts |
| **Quick run command** | `npx tsx scripts/validate-geojson.ts` |
| **Full suite command** | `npx tsx scripts/validate-geojson.ts; npm run seed -w backend` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run compile checks or test scripts
- **After every plan wave:** Run `npx tsx scripts/validate-geojson.ts` or `npm run seed -w backend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SEED-02 | - | N/A | unit | `node -e "JSON.parse(require('fs').readFileSync('frontend/public/geojson/sleman-kecamatan.geojson'))"` | frontend/public/geojson/sleman-kecamatan.geojson | ✅ green |
| 02-01-02 | 01 | 1 | SEED-02 | - | N/A | integration | `npx tsx scripts/validate-geojson.ts` | scripts/validate-geojson.ts | ✅ green |
| 02-02-01 | 02 | 2 | SEED-01 | - | N/A | integration | `cd backend && npm list @faker-js/faker` | backend/package.json | ✅ green |
| 02-02-02 | 02 | 2 | SEED-01 | - | N/A | unit | `npm run seed -w backend` | backend/src/seed.ts | ✅ green |

*Status: ░ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/public/geojson/sleman-kecamatan.geojson` — Sleman boundary GeoJSON
- [ ] `scripts/validate-geojson.ts` — GeoJSON validation script
- [ ] `backend/src/seed.ts` — Database seeder script

---

## Manual-Only Verifications

*None: All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** green ✓
