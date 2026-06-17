# Phase 1: Environment & Database Bedrock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 1-Environment & Database Bedrock
**Areas discussed:** Package Manager Preference, PostgreSQL Port Exposure, TypeScript Configuration Strictness

---

## Package Manager Preference

| Option | Description | Selected |
|--------|-------------|----------|
| npm | Node.js default, matches script templates | ✅ |
| pnpm | Fast, disk-space efficient, strict dependencies | |
| yarn | Fast, classic yarn lock structure | |

**User's choice:** npm (Recommended: default, matches script templates)
**Notes:** Decided to use the Node.js default package manager, which aligns with standard documentation and scripts.

---

## PostgreSQL Port Exposure

| Option | Description | Selected |
|--------|-------------|----------|
| Expose to host | Expose database port 5432 to the host machine to allow external client and Prisma Studio access | ✅ |
| Internal Docker only | Isolate database to the docker-compose network for network-level isolation | |

**User's choice:** Expose to host
**Notes:** Exposing standard port 5432 makes local database tools, Prisma Studio, and client connections straightforward. We will use the default 5432 port.

---

## TypeScript Configuration Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict | Enables full TypeScript strict checks, standard for clean code bases | ✅ |
| Standard | Standard Next.js defaults, slightly relaxed to speed up initial prototyping | |

**User's choice:** Strict
**Notes:** Enabling full strict checking in tsconfig.json will enforce type safety from the beginning. ESLint is configured to use standard Next.js default rule sets.

---

## the agent's Discretion

- Dockerfile multi-stage optimization setup.
- Specific folder structure layouts of Next.js App Router directories.

## Deferred Ideas

None — discussion stayed within phase scope.
