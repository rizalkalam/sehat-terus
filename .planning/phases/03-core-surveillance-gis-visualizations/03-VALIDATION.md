---
phase: 3
slug: core-surveillance-gis-visualizations
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-24
---

# Phase 3 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | tsx (TS execution runner for verification scripts) |
| **Config file** | none |
| **Quick run command** | `npx tsx scripts/validate-geojson.ts` |
| **Full suite command** | `cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run TypeScript type verification (`npx tsc --noEmit`)
- **After every plan wave:** Run full type check and endpoint validation scripts
- **Before `/gsd-verify-work`:** Full type verification must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | API-03 | - | N/A | integration | `npx tsx backend/src/index.ts --test` | pending | pending |
| 03-02-01 | 02 | 2 | MAP-01 | - | N/A | compile | `cd frontend && npx tsc --noEmit` | pending | pending |
| 03-03-01 | 03 | 2 | MAP-02, MAP-03 | - | N/A | compile | `cd frontend && npx tsc --noEmit` | pending | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/api.test.ts` — API endpoint tests (will create test framework setup if needed)
- [ ] `scripts/test-endpoints.ts` — script to trigger curl checks against running local containers

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Leaflet map rendering & tiles loading | MAP-01 | Requires visual check of map tiles and administrative boundaries (no broken tiles) | Open `http://localhost:3000`, verify map renders Sleman kecamatan boundaries colored per fixed thresholds. |
| Region Detail Panel dynamic updates on click | MAP-02 | Requires UI click interaction to trigger on-click dynamic state updates | Click a sub-district on the map, verify loading spinner displays, then population and incidence rates update. |
| Recharts Line Chart disease multi-select toggles | MAP-03 | Requires UI click interaction to select/deselect disease badge pills | Click pill badges (e.g. DBD, ISPA), verify chart lines add/remove dynamically and tooltip displays combined metrics. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
