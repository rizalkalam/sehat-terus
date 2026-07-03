---
phase: 3
slug: core-surveillance-gis-visualizations
status: approved
nyquist_compliant: true
wave_0_complete: true
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
| **Quick run command** | `npx tsx scripts/test-endpoints.ts` |
| **Full suite command** | `cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run TypeScript type verification (`npx tsc --noEmit`)
- **After every plan wave:** Run full type check and endpoint validation scripts
- **Before `/gsd-verify-work`:** Full type verification must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | API-03 | - | N/A | integration | `npx tsx scripts/test-endpoints.ts` | exists | green |
| 03-02-01 | 02 | 2 | MAP-01 | - | N/A | compile | `cd frontend && npx tsc --noEmit` | exists | green |
| 03-03-01 | 03 | 2 | MAP-02, MAP-03 | - | N/A | compile | `cd frontend && npx tsc --noEmit` | exists | green |

*Status: green*

---

## Wave 0 Requirements

- [x] `scripts/test-endpoints.ts` — script to trigger REST API requests against running local containers
- [x] `scripts/test-db-connection.ts` — verification script for database indexes and connections

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
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-24
