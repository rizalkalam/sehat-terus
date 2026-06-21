# Phase 1: Environment & Database Bedrock - Research

**Researched:** 2026-06-21
**Domain:** Next.js, TypeScript, PostgreSQL, Prisma, Docker Compose
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **npm** as the package manager for the project.
- **D-02:** Expose PostgreSQL port **5432** directly to the host machine to allow external database clients and Prisma Studio to connect easily.
- **D-03:** Enable full strict TypeScript compiler checks (`strict: true`) in tsconfig.json to catch type issues early.
- **D-04:** Use standard Next.js ESLint linting configuration without custom strict rules to prevent build blocks for minor warnings during development.

### the agent's Discretion
- Downstream planning/executing agents have flexibility over specific multi-stage Dockerfile configurations and the precise Next.js App Router folders structure, provided standard conventions and requirements are followed.

### Deferred Ideas (OUT OF SCOPE)
- User authentication (Login/Register) – The dashboard is public-facing and read-only for all users.
- CRUD forms for data entry – The system assumes raw data is synced from an external Transaction Processing System (TPS).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Next.js App Scaffolding | Frontend Server | Browser/Client | Serves React Server Components (RSC) and Client Components. |
| Docker Compose Environment | Infrastructure | API/Backend | Coordinates Next.js web application and PostgreSQL database containers. |
| Prisma Schema & Migrations | Database/Storage | API/Backend | Manages relational database mapping, migrations, and type-safe query interface. |
</architectural_responsibility_map>

<research_summary>
## Summary

This phase establishes the foundational developer environment for the Sehat Terus project. We configure a containerized environment utilizing Docker Compose to link a PostgreSQL database and a Next.js (v15.2.13) application. Prisma ORM (v7.8.0) is configured to map the `RekamMedis` database model with B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili`.

**Primary recommendation:** Build a multi-stage Dockerfile that supports local development with hot-reloading (via volume mounts) as well as production optimization. Ensure that Next.js doesn't attempt to connect to the database at build time by using dynamic rendering or proper route configuration for database-accessing endpoints.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js (App Router)** | `15.2.13` | Web Framework | Combines React 19 server-side rendering, routing, and api routes. |
| **TypeScript** | `5.7.3` | Static Typing | Provides type safety for DB schemas and API responses. |
| **PostgreSQL** | `16.x` | Relational DB | Industry-standard SQL database with spatial capabilities if needed. |
| **Prisma ORM** | `7.8.0` | Database ORM | Provides database migrations and a type-safe database client. |
| **Docker Compose** | `24.x` / `v2.x` | Container Orchestration | Standardizes local execution environments across machines. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **tsx** | `4.19.2` | Running TypeScript | Run the database seeding scripts directly using TypeScript. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma ORM | Drizzle ORM | Prisma offers auto-generated type-safe clients and simple migrations, but slightly more cold-start overhead than Drizzle. Given the read-heavy nature and lack of serverless cold-start constraints, Prisma's robustness is preferred. |
| Docker Setup | Local Setup | Local PostgreSQL/Node setup is faster to start but prone to version drift and configuration mismatch across development machines. Docker is chosen for environment parity. |

**Installation:**
```bash
# Initialize Next.js app in-place with npm
# Configure Prisma
npm install @prisma/client@7.8.0
npm install -D prisma@7.8.0 tsx@4.19.2 @types/node typescript
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
    User([Browser Client]) -->|HTTP Requests| Web[Next.js App Server Container]
    Web -->|Prisma Client SQL| DB[(PostgreSQL Database Container)]
    
    subgraph Docker Network
        Web
        DB
    end
    
    PrismaStudio[Prisma Studio / Local Client] -->|Port 5432| DB
```

### Key Practices
- **Prisma Client Lifecycle**: Ensure the Prisma Client is instantiated as a singleton in development to prevent exhausting PostgreSQL connection pools due to Next.js hot-reloading.
- **Port Exposure**: Expose `5432` only on local/development environment to the host network (per D-02).
- **Environment Variables**: Use `.env` file containing `DATABASE_URL` (e.g., `postgresql://postgres:postgres@localhost:5432/sehat_terus?schema=public`) for local prisma CLI, and a docker-compose version utilizing the container hostname `db` for container-to-container communication.

</architecture_patterns>

<avoid_pitfalls>
## Pitfalls to Avoid

### 1. Connection Pool Exhaustion during Next.js Hot Reload
In development, Next.js runs code reloading frequently. If a new `PrismaClient` is instantiated on every reload, it will quickly exceed the maximum connections limit of PostgreSQL.
*Mitigation:* Create a singleton file (e.g., `src/lib/db.ts`) that attaches the prisma client instance to `globalThis`.

### 2. Connection Timing in Docker Compose
If the Next.js container starts and attempts to run migrations or start up before PostgreSQL is fully initialized and accepting connections, the app will crash.
*Mitigation:* Use docker-compose healthchecks for the `db` service and `depends_on: { db: { condition: service_healthy } }` on the `web` service.

### 3. Missing Indexes
Without explicit indexes on `tanggal_kunjungan` and `kecamatan_domisili`, large aggregations over historical medical records will trigger slow sequential scans.
*Mitigation:* Explicitly declare `@@index` in the `RekamMedis` schema file for these fields.
</avoid_pitfalls>

<validation_architecture>
## Validation Architecture

For Phase 1, the validation will verify:
1. Docker Compose setup compiles and runs.
2. Next.js server resolves successfully and runs.
3. Database connection works and migrations successfully created the `RekamMedis` table with indexes.

We will write a simple node script `test-db-connection.ts` that will query the database via Prisma and verify the presence of the `RekamMedis` table and its schema.

### Test Command
```bash
# Verify Prisma schema is valid
npx prisma validate

# Run database schema connection check script
npx tsx scripts/test-db-connection.ts
```
</validation_architecture>
