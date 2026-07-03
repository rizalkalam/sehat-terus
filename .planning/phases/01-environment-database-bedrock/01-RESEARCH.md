# Phase 1: Environment & Database Bedrock - Research

**Researched:** 2026-06-21
<<<<<<< HEAD
**Domain:** Next.js, Express.js, Sequelize ORM, PostgreSQL, Docker Compose
=======
**Domain:** Next.js, TypeScript, PostgreSQL, Prisma, Docker Compose
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
<<<<<<< HEAD
- **D-01:** Use **npm** as the package manager for both `frontend/` and `backend/`.
- **D-02:** Expose PostgreSQL port **5432** directly to the host machine to allow external database clients and migrations to connect.
- **D-03:** Enable full strict TypeScript compiler checks (`strict: true`) in both `frontend/` and `backend/` tsconfig.json configurations.
- **D-04:** Use a monorepo directory layout with `frontend/` (Next.js), `backend/` (Express.js), and root `docker-compose.yml`.

### the agent's Discretion
- Configurations for Dockerfiles, package scripts, and internal folder structure layouts within `frontend/` and `backend/` are at the agent's discretion, provided standard conventions are met.
=======
- **D-01:** Use **npm** as the package manager for the project.
- **D-02:** Expose PostgreSQL port **5432** directly to the host machine to allow external database clients and Prisma Studio to connect easily.
- **D-03:** Enable full strict TypeScript compiler checks (`strict: true`) in tsconfig.json to catch type issues early.
- **D-04:** Use standard Next.js ESLint linting configuration without custom strict rules to prevent build blocks for minor warnings during development.

### the agent's Discretion
- Downstream planning/executing agents have flexibility over specific multi-stage Dockerfile configurations and the precise Next.js App Router folders structure, provided standard conventions and requirements are followed.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

### Deferred Ideas (OUT OF SCOPE)
- User authentication (Login/Register) – The dashboard is public-facing and read-only for all users.
- CRUD forms for data entry – The system assumes raw data is synced from an external Transaction Processing System (TPS).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
<<<<<<< HEAD
| Next.js Frontend | Browser/Client | Frontend Server | Renders UI (Leaflet, Recharts) and routes pages. |
| Express.js Backend | API/Backend | - | Exposes REST API endpoints for data retrieval and analysis. |
| Sequelize ORM | Database/Storage | API/Backend | Manages PostgreSQL database schemas, indexes, and queries. |
| Docker Compose Orchestration | Infrastructure | - | Coordinates networks and local running states of all services. |
=======
| Next.js App Scaffolding | Frontend Server | Browser/Client | Serves React Server Components (RSC) and Client Components. |
| Docker Compose Environment | Infrastructure | API/Backend | Coordinates Next.js web application and PostgreSQL database containers. |
| Prisma Schema & Migrations | Database/Storage | API/Backend | Manages relational database mapping, migrations, and type-safe query interface. |
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
</architectural_responsibility_map>

<research_summary>
## Summary

<<<<<<< HEAD
This phase establishes the microservices-style monorepo structure. We split the workspace into `frontend/` (Next.js) and `backend/` (Express.js). A PostgreSQL database is managed via Sequelize ORM, defining the `RekamMedis` schema with B-Tree indexes. A root Docker Compose orchestrates the three containers (`db`, `backend`, `frontend`) to ensure seamless local hot-reloading and service communication.

**Primary recommendation:** Use standard TypeScript setups in both directories and set up `sequelize-cli` inside the `backend/` directory to manage database migrations cleanly. Ensure the Express.js backend handles CORS requests from the Next.js frontend.
=======
This phase establishes the foundational developer environment for the Sehat Terus project. We configure a containerized environment utilizing Docker Compose to link a PostgreSQL database and a Next.js (v15.2.13) application. Prisma ORM (v7.8.0) is configured to map the `RekamMedis` database model with B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili`.

**Primary recommendation:** Build a multi-stage Dockerfile that supports local development with hot-reloading (via volume mounts) as well as production optimization. Ensure that Next.js doesn't attempt to connect to the database at build time by using dynamic rendering or proper route configuration for database-accessing endpoints.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
<<<<<<< HEAD
| **Next.js (App Router)** | `15.2.9` | Frontend Framework | Renders the dashboard and visual charts. |
| **Express.js** | `4.21.x` | Backend API | Lightweight, mature Node.js API framework. |
| **Sequelize ORM** | `6.37.x` | Database Mapping | Mature SQL ORM with robust model definition and migrations. |
| **PostgreSQL** | `16-alpine` | Relational Database | High-performance open-source SQL database. |
| **Docker Compose** | `v2.x` | Orchestration | Link database, API, and frontend containers on a bridge network. |
=======
| **Next.js (App Router)** | `15.2.13` | Web Framework | Combines React 19 server-side rendering, routing, and api routes. |
| **TypeScript** | `5.7.3` | Static Typing | Provides type safety for DB schemas and API responses. |
| **PostgreSQL** | `16.x` | Relational DB | Industry-standard SQL database with spatial capabilities if needed. |
| **Prisma ORM** | `7.8.0` | Database ORM | Provides database migrations and a type-safe database client. |
| **Docker Compose** | `24.x` / `v2.x` | Container Orchestration | Standardizes local execution environments across machines. |
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
<<<<<<< HEAD
| **pg & pg-hstore** | Latest | PostgreSQL Client | Required driver packages for Sequelize. |
| **cors** | Latest | CORS Middleware | Enable frontend-to-backend API calls. |
| **tsx** | Latest | TS Script Execution | Running seeds and migrations without manual compilation. |
=======
| **tsx** | `4.19.2` | Running TypeScript | Run the database seeding scripts directly using TypeScript. |
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
<<<<<<< HEAD
| Sequelize ORM | Prisma ORM | Prisma is popular but Sequelize offers native Model class syntax and straightforward config options mapping closer to standard SQL patterns which is preferred for Express.js API services. |

**Installation:**
```bash
# In backend/
npm install express sequelize pg pg-hstore cors
npm install -D typescript @types/express @types/node tsx sequelize-cli

# In frontend/
# Managed via standard create-next-app initialization
=======
| Prisma ORM | Drizzle ORM | Prisma offers auto-generated type-safe clients and simple migrations, but slightly more cold-start overhead than Drizzle. Given the read-heavy nature and lack of serverless cold-start constraints, Prisma's robustness is preferred. |
| Docker Setup | Local Setup | Local PostgreSQL/Node setup is faster to start but prone to version drift and configuration mismatch across development machines. Docker is chosen for environment parity. |

**Installation:**
```bash
# Initialize Next.js app in-place with npm
# Configure Prisma
npm install @prisma/client@7.8.0
npm install -D prisma@7.8.0 tsx@4.19.2 @types/node typescript
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
<<<<<<< HEAD
    User([Browser Client]) -->|HTTP Port 3000| FE[Next.js Frontend Container]
    User -->|API Requests Port 5000| BE[Express.js Backend Container]
    BE -->|SQL Port 5432| DB[(PostgreSQL Database Container)]
    
    subgraph Docker Bridge Network
        FE
        BE
        DB
    end
```

### Key Practices
- **CORS Configuration:** Enable CORS in Express.js using the `cors` middleware, allowing requests from `http://localhost:3000` (development) or dynamically via environmental configuration.
- **Sequelize Client Lifecycle:** Create a connection singleton (e.g., `backend/src/config/database.ts`) returning the database connection to avoid leaking connection pools.
- **Port mapping:** Map Next.js to port `3000`, Express API to port `5000`, and PostgreSQL to `5432`.
=======
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
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</architecture_patterns>

<avoid_pitfalls>
## Pitfalls to Avoid

<<<<<<< HEAD
### 1. Connection Failures on Boot (Docker Compose order)
If the backend starts trying to sync Sequelize models or run migrations before the PostgreSQL database container is fully healthy and accepting connections, the backend container will crash.
*Mitigation:* Use Docker Compose service health checks (`pg_isready`) on the `db` container, and make the `backend` container depend on it with `condition: service_healthy`.

### 2. CORS blocks in Frontend
Next.js running on port 3000 will not be able to fetch data from Express.js running on port 5000 if CORS headers are missing.
*Mitigation:* Configure `cors` middleware in `backend/src/index.ts`.

### 3. Missing B-Tree Indexes
Aggregations grouping by `kecamatan_domisili` or filtering by `tanggal_kunjungan` will trigger slow sequential scans as the dataset grows.
*Mitigation:* Define B-Tree indexes for `tanggal_kunjungan` and `kecamatan_domisili` inside the Sequelize model definition and the migration files.
=======
### 1. Connection Pool Exhaustion during Next.js Hot Reload
In development, Next.js runs code reloading frequently. If a new `PrismaClient` is instantiated on every reload, it will quickly exceed the maximum connections limit of PostgreSQL.
*Mitigation:* Create a singleton file (e.g., `src/lib/db.ts`) that attaches the prisma client instance to `globalThis`.

### 2. Connection Timing in Docker Compose
If the Next.js container starts and attempts to run migrations or start up before PostgreSQL is fully initialized and accepting connections, the app will crash.
*Mitigation:* Use docker-compose healthchecks for the `db` service and `depends_on: { db: { condition: service_healthy } }` on the `web` service.

### 3. Missing Indexes
Without explicit indexes on `tanggal_kunjungan` and `kecamatan_domisili`, large aggregations over historical medical records will trigger slow sequential scans.
*Mitigation:* Explicitly declare `@@index` in the `RekamMedis` schema file for these fields.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
</avoid_pitfalls>

<validation_architecture>
## Validation Architecture

<<<<<<< HEAD
To verify the setup:
1. Docker Compose config must be valid.
2. The Express.js backend must start and successfully connect to PostgreSQL.
3. Next.js frontend must compile and run in dev/prod.
4. Database tables and indexes must exist in the database.

### Test commands
```bash
# Verify Docker compose
docker compose config

# Verify Express type checks
cd backend && npx tsc --noEmit

# Verify Next.js frontend type checks
cd frontend && npx tsc --noEmit
=======
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
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
```
</validation_architecture>
