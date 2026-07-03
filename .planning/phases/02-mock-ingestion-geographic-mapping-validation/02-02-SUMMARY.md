---
phase: 02-mock-ingestion-geographic-mapping-validation
plan: "02"
subsystem: database
tags: [seeder, faker, pg, sequelize]
requires:
  - 02-01
provides:
  - Faker.js-powered database seeder to populate patient records
  - Seed command integration in backend package.json
affects:
  - 02-mock-ingestion-geographic-mapping-validation
tech-stack:
  added: [@faker-js/faker]
  patterns: [weighted random data selection, batch database insertion]
key-files:
  created:
    - backend/src/seed.ts
  modified:
    - backend/package.json
    - backend/src/config/database.ts
key-decisions:
  - "Configured database config to resolve fallback .env path up to the monorepo root to allow workspace-level execution of CLI commands."
  - "Used weighted random distribution for common diseases to simulate realistic caseload ratios and introduced small chance for rare diseases to feed the warning board."
patterns-established:
  - "Bulk-create chunking pattern (1,000 records per batch) to ensure memory efficiency and quick PostgreSQL ingestion."
requirements-completed:
  - SEED-01
duration: 10min
completed: 2026-06-22
---

# Phase 02: Plan 02 Summary

**Implemented the Faker.js-powered database seeder script and seeded 5,500 realistic medical records.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-06-22T12:33:00+07:00
- **Completed:** 2026-06-22T12:43:00+07:00
- **Tasks:** 2 completed
- **Files modified:** 3 created / modified

## Accomplishments
- **Faker Dependency:** Installed `@faker-js/faker@10.4.0` in the backend workspace.
- **Seeder Implementation:** Built [seed.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/seed.ts) to generate UUIDs, dates spanning the last 12 months, and random sub-districts from Sleman Regency.
- **Weighted Disease Generation:** Modeled realistic health distributions with common cases (ISPA, Flu, DBD) and rare diseases (Leptospirosis, Polio, Campak).
- **Execution & Verification:** Successfully executed the seed command (`npm run seed`), clearing prior records and bulk-inserting exactly 5,500 new entries under 15 seconds.

## Task Commits

1. **Task 1: Install @faker-js/faker in backend** - `bb3f82a` (chore)
2. **Task 2: Implement and run the database seed script** - `fb8a61d` (feat)

## Files Created/Modified
- `backend/src/seed.ts` - Seeder generation logic
- `backend/package.json` - Added npm script `seed`
- `backend/src/config/database.ts` - Updated env resolver path

## Decisions Made
- Added a fallback path configuration in Sequelize config to look up 3 levels so that `process.cwd()` in backend workspaces reads environment variables successfully.

## Deviations from Plan
- Adjusted `database.ts` environment variable resolution to prevent loading errors during workspace-scoped CLI execution.
