# Phase 1: Environment & Database Bedrock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 1-Environment & Database Bedrock
**Areas discussed:** Monorepo vs separate repos, Backend framework selection (Express.js vs others), ORM selection (Sequelize vs Prisma)

---

## Monorepo vs Polyrepo

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo | Frontend and Backend in subfolders within a single repository, managed by a root Docker Compose | ✅ |
| Polyrepo | Frontend and Backend in completely separate repositories | |

**User's choice:** Monorepo (Struktur Monorepo dengan subfolder 'frontend/' dan 'backend/')
**Notes:** Helps in keeping all changes atomic, makes git history straightforward, and allows standard container coordination.

---

## Backend Framework & ORM

| Option | Description | Selected |
|--------|-------------|----------|
| Express.js + Sequelize | Classic, lightweight Express REST API with Sequelize ORM for PostgreSQL mapping | ✅ |
| Next.js standalone API | Built-in Next.js endpoints (monolithic/RSC direct connections) | |

**User's choice:** Express.js + Sequelize + PostgreSQL
**Notes:** Decouples API services from the Next.js UI, allowing independent scaling and traditional database model structures in PostgreSQL.
