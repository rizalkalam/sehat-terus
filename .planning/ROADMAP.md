# Roadmap: Sehat Terus (Public Health Radar)

## Overview

Sehat Terus is structured as a decoupled monorepo containing a Next.js (Frontend) service and an Express.js (Backend) service. The implementation roadmap is structured as follows: establishing the containerized development environment for both services along with the base Sequelize setup (Phase 1); creating the backend database seeding script and validating regional sub-district mappings (Phase 2); implementing high-performance aggregation APIs on the backend and building the core interactive map and trend line dashboards on the frontend (Phase 3); adding predictive forecasting models and statistical Z-score anomaly alarms to complete the early warning system (Phase 4); and securing the system with user authentication and introducing configurable administrative settings for managers/admins (Phase 5).

## Phases

- [x] **Phase 1: Environment & Database Bedrock** - Set up Next.js frontend scaffolding, Express.js backend scaffolding with Sequelize configuration, and root Docker Compose orchestration.
- [x] **Phase 2: Mock Ingestion & Geographic Mapping Validation** - Seed realistic clinical records using Sequelize + Faker.js in the backend, and validate GeoJSON sub-district names.
- [x] **Phase 3: Core Surveillance & GIS Visualizations** - Build backend aggregation endpoints, Leaflet choropleth heatmap, and historical Recharts charts.
- [ ] **Phase 4: Early Warning System & Forecasting Analytics** - Implement backend forecasting projections, Z-score anomaly logic, and the Early Warning dashboard UI.
- [ ] **Phase 5: Authentication & Administrative Settings** - Implement login page, JWT/session authentication, database-persisted mitigation task toggles, and configurable threshold settings.

## Phase Details

### Phase 1: Environment & Database Bedrock
**Goal**: Establish containerized PostgreSQL, Next.js frontend, and Express.js backend services, set up Sequelize ORM, and verify end-to-end database connectivity.
**Depends on**: Nothing (first phase)
**Requirements**: [API-01, API-02]
**Success Criteria** (what must be TRUE):
  1. Next.js, Express.js, and PostgreSQL containers boot successfully and communicate over the Docker Network.
  2. Sequelize migrations successfully generate the PostgreSQL database schema including the `RekamMedis` table with B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili`.
  3. The Express.js server can successfully connect to and run queries against the PostgreSQL database.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Scaffold the Next.js App Router frontend with TypeScript, Tailwind CSS, and configure its development Dockerfile.
- [ ] 01-02: Scaffold the Express.js API backend with TypeScript, configure Sequelize, and define its development Dockerfile.
- [ ] 01-03: Create the root docker-compose.yml, configure the PostgreSQL service, define Sequelize schema with B-Tree indexes, run migrations, and test connectivity.

### Phase 2: Mock Ingestion & Geographic Mapping Validation
**Goal**: Build a backend CLI seed script generating realistic clinical data, and validate that sub-district names match the keys in the GeoJSON boundary assets.
**Depends on**: Phase 1
**Requirements**: [SEED-01, SEED-02]
**Success Criteria** (what must be TRUE):
  1. Backend CLI seed script successfully inserts 5,000+ realistic medical records using Sequelize in under 30 seconds.
  2. Every seeded sub-district name matches exactly with keys in the local Yogyakarta/Jakarta GeoJSON files.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Integrate and validate local Yogyakarta/Jakarta GeoJSON boundary files.
- [ ] 02-02: Implement Faker.js-powered CLI database seeder script in the Express.js backend.

### Phase 3: Core Surveillance & GIS Visualizations
**Goal**: Build high-performance backend database-level aggregation endpoints, and develop interactive Leaflet maps and charts on the frontend.
**Depends on**: Phase 2
**Requirements**: [MAP-01, MAP-02, MAP-03, API-03]
**Success Criteria** (what must be TRUE):
  1. Express.js backend provides performant spatial-temporal aggregation API endpoints.
  2. Next.js Choropleth Map displays Yogyakarta/Jakarta sub-districts colored by case density, loading data dynamically from the Express.js API.
  3. Clicking a sub-district updates the Region Detail Panel showing case numbers and normalized incidence rates.
  4. Historical Recharts line chart is filterable and renders trend lines based on backend data.
**Plans**: 3 plans

Plans:
- [x] 03-01: Implement database-level aggregation API endpoints in the Express.js backend.
- [x] 03-02: Develop interactive Choropleth Map Component in the Next.js frontend using react-leaflet.
- [x] 03-03: Implement the dynamic Region Detail Panel and historical time-series Recharts chart with filters in the frontend.

### Phase 4: Early Warning System & Forecasting Analytics
**Goal**: Build predictive forecasting trendlines and Z-score anomaly alarm calculations in the backend, and render alerts on the frontend.
**Depends on**: Phase 3
**Requirements**: [ANL-01, ANL-02, ANL-03]
**Success Criteria** (what must be TRUE):
  1. Backend API projects 14-30 days of future cases and exposes this via a forecasting endpoint.
  2. Backend anomaly detection engine calculates Z-scores and flags outbreaks based on historical averages and baseline filters.
  3. Frontend Early Warning dashboard displays alert cards ("Siaga" / "Aman") and a datatable for tracking rare disease occurrences.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Implement double exponential smoothing/linear regression trend projection in the Express.js backend.
- [ ] 04-02: Develop Z-score anomaly detection engine with absolute minimum baseline filtering in the backend.
- [ ] 04-03: Create early warning dashboard UI with status cards and rare disease datatable in the frontend.

### Phase 5: Authentication & Administrative Settings
**Goal**: Secure the MIS application with user login/session verification and allow managers to persist mitigation tasks and adjust forecasting/anomaly configurations.
**Depends on**: Phase 4
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, ADM-01, ADM-02]
**Success Criteria** (what must be TRUE):
  1. The login page `/login` restricts all dashboard routes to authenticated users.
  2. The Express.js backend supports secure JWT or session token generation and verification.
  3. Clicking quick mitigation tasks toggles their `completed` state and persists it to the database.
  4. Managers can configure Z-score thresholds and minimum baselines, with updates saved and reflected in live anomaly flags.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Implement backend JWT/cookie authentication routes, user models, and seed credentials.
- [ ] 05-02: Create frontend `/login` page and router middleware to protect dashboards.
- [ ] 05-03: Implement database models, APIs, and UI controls for persisting mitigation tasks and customizing Z-score thresholds.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Environment & Database Bedrock | 3/3 | Completed | 2026-06-21 |
| 2. Mock Ingestion & Geographic Mapping Validation | 2/2 | Completed | 2026-06-22 |
| 3. Core Surveillance & GIS Visualizations | 3/3 | Completed | 2026-06-24 |
| 4. Early Warning System & Forecasting Analytics | 0/3 | Not started | - |
| 5. Authentication & Administrative Settings | 0/3 | Not started | - |
