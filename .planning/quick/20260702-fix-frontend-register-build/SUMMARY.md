---
title: Fix Frontend Register Build & Rebuild Docker
date: 2026-07-02
status: complete
---

# Summary: Fix Frontend Register Build & Rebuild Docker

## Achievements
1. **Resolved Frontend Compilation Blocker**: Added a mock `registerUser` function in [auth.client.ts](file:///D:/projects/isd-project/sehat-terus/frontend/src/lib/auth.client.ts) that rejects self-registration (enforcing administrative account creation as per scope).
2. **Fixed ESLint & TypeScript Warnings**: Addressed unused variable `_data` and explicit `any` types in the signature of `registerUser` to pass strict linter checks in Next.js production build.
3. **Successfully Rebuilt & Recreated Docker Containers**: Ran `docker compose up -d --build` successfully. All containers (`db`, `backend`, `frontend`) are compiled, optimized, and active.
