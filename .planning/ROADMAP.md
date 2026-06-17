# Roadmap: Sehat Terus (Public Health Radar)

## Overview

Sehat Terus is designed to be an automated spatial and temporal public health early warning system. The implementation path follows a logical dependency flow: first establishing a solid containerized environment and optimized database schema (Phase 1), followed by realistic mock data ingestion mapped directly to regional GeoJSON geometries to avoid data mismatches (Phase 2). With clean data secured, we build the core interactive geospatial surveillance map and historical charts (Phase 3), and finally, layer on server-side forecasting and Z-score anomaly detection alerts for early warnings (Phase 4).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g. 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Environment & Database Bedrock** - Set up Next.js typescript scaffolding, docker-compose, and Prisma ORM schema with indexes.
- [ ] **Phase 2: Mock Ingestion & Geographic Mapping Validation** - Seed realistic clinical records aligning with regional GeoJSON sub-districts.
- [ ] **Phase 3: Core Surveillance & GIS Visualizations** - Build core dashboard layouts with interactive choropleth map and historical trend line charts.
- [ ] **Phase 4: Early Warning System & Forecasting Analytics** - Implement time-series forecasting, anomaly alerts, and rare disease tracking.

## Phase Details

### Phase 1: Environment & Database Bedrock
**Goal**: Establish containerized PostgreSQL and Next.js services, set up Prisma ORM, and configure the base database schema with optimized indexing.
**Depends on**: Nothing (first phase)
**Requirements**: [API-01, API-02]
**Success Criteria** (what must be TRUE):
  1. Next.js and PostgreSQL containers boot successfully and communicate via Docker Network using `docker compose up`.
  2. Prisma migrations successfully generate the PostgreSQL database schema including the `RekamMedis` table.
  3. B-Tree indexes exist on database columns `tanggal_kunjungan` and `kecamatan_domisili` for performant querying.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Scaffold Next.js App Router project with TypeScript and Docker Compose orchestration
- [ ] 01-02: Configure Prisma ORM, define the RekamMedis schema with B-Tree indexes, and run migrations

### Phase 2: Mock Ingestion & Geographic Mapping Validation
**Goal**: Build a seed script generating realistic clinical data, and validate that sub-district names match the keys in the GeoJSON boundary assets.
**Depends on**: Phase 1
**Requirements**: [SEED-01, SEED-02]
**Success Criteria** (what must be TRUE):
  1. CLI seed script successfully inserts 5,000+ realistic medical records into the database in under 30 seconds.
  2. Every seeded sub-district name (`kecamatan_domisili`) matches exactly with keys in the local Yogyakarta/Jakarta GeoJSON files.
  3. Coordinates and geographic codes mapped within the seed data correspond to real Yogyakarta/Jakarta locations.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Integrate and validate local Yogyakarta/Jakarta GeoJSON boundary files
- [ ] 02-02: Implement Faker.js-powered CLI database seeder script and verify run

### Phase 3: Core Surveillance & GIS Visualizations
**Goal**: Build dynamic Leaflet-based geospatial mapping dashboards and historical charts powered by aggregate database APIs.
**Depends on**: Phase 2
**Requirements**: [MAP-01, MAP-02, MAP-03, API-03]
**Success Criteria** (what must be TRUE):
  1. Choropleth Map displays Yogyakarta/Jakarta sub-districts colored by case density without hydration errors or SSR ReferenceErrors.
  2. Clicking a sub-district region updates the Detail Panel showing population, case numbers, and incidence rate per 10,000 residents.
  3. Historical Recharts line chart is filterable by date range and disease type, rendering trends from aggregate database queries.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Implement high-performance database-level aggregation Server Actions and API endpoints
- [ ] 03-02: Develop interactive Choropleth Map Component using Leaflet (with dynamic SSR disabled import)
- [ ] 03-03: Implement the dynamic Region Detail Panel and historical time-series Recharts chart with filters

### Phase 4: Early Warning System & Forecasting Analytics
**Goal**: Build predictive forecasting trendlines and Z-score anomaly alert cards on the dashboard.
**Depends on**: Phase 3
**Requirements**: [ANL-01, ANL-02, ANL-03]
**Success Criteria** (what must be TRUE):
  1. Historical trend chart displays a dotted extension showing 14-30 days of projected future cases.
  2. Anomaly status dashboard highlights outbreaks as "Siaga" only when Z-score thresholds are crossed and absolute cases exceed minimum thresholds (preventing false alarms).
  3. Rare disease tracking datatable correctly displays single severe incidents of high-severity infections.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Implement server-side double exponential smoothing/linear regression trend projection
- [ ] 04-02: Develop Z-score anomaly detection engine with absolute minimum baseline filtering
- [ ] 04-03: Create early warning dashboard UI with status cards and rare disease datatable

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Environment & Database Bedrock | 0/2 | Not started | - |
| 2. Mock Ingestion & Geographic Mapping Validation | 0/2 | Not started | - |
| 3. Core Surveillance & GIS Visualizations | 0/3 | Not started | - |
| 4. Early Warning System & Forecasting Analytics | 0/3 | Not started | - |
