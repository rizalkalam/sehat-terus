# Sehat Terus (Public Health Radar)

## What This Is

A Management Information System (MIS) designed for health managers, pharmacy admins, and hospital admins to visualize disease spread, forecast future health trends, and detect medical anomalies based on raw clinical data in Indonesian regions. The system provides secure administrative access, GIS (Geospatial) mapping, time-series forecasting, and early warning threshold configurations.

The project is structured as a monorepo consisting of:
1. **Frontend (`frontend/`):** Next.js App Router, TypeScript, Tailwind CSS, react-leaflet, Recharts.
2. **Backend (`backend/`):** Express.js, TypeScript, Sequelize ORM, PostgreSQL.
3. **Orchestration:** Docker Compose to run PostgreSQL database, Backend API, and Frontend application.

## Core Value

To provide clear, automated spatial and temporal early warnings for disease outbreaks without administrative overhead.

## Requirements

### Validated

(None yet – ship to validate)

### Active

- [ ] Scaffold Next.js App Router frontend with TypeScript and Tailwind CSS.
- [ ] Scaffold Express.js backend with TypeScript and Sequelize ORM.
- [ ] Configure root Docker Compose to run PostgreSQL, Backend, and Frontend.
- [ ] Database Schema: Set up Sequelize models for the `RekamMedis` table with optimized indexes on `tanggal_kunjungan` and `kecamatan_domisili`.
- [ ] Seed script: Implement a CLI seeder in the backend using Sequelize and Faker.js to inject at least 5,000 realistic dummy medical records.
- [ ] User Authentication: Implement login and session/JWT authentication to secure the dashboard for health managers/admins.
- [ ] Geospatial Surveillance Page (`/`): Render interactive Choropleth Heatmaps using react-leaflet and local Indonesian region GeoJSON, connecting to the Express.js API.
- [ ] Trend Forecasting Page (`/proyeksi-tren`): Render Recharts Line Chart illustrating historical data and predicted trend lines.
- [ ] Early Warning Page (`/peringatan-dini`): Render anomaly detection status cards, a datatable for rare disease tracking, persistable/togglaeable mitigation tasks, and configurable Z-score thresholds.

### Out of Scope

- CRUD Patient Records Data Entry Forms – The system assumes patient-level raw medical data is ingested/synced directly from external transactional systems.
- Patient-facing portals – The application is strictly an internal MIS dashboard for health managers and admins.

## Context

- The application will utilize local GeoJSON data for regional mapping (focusing on Yogyakarta or Jakarta sub-districts).
- Data visual representations need to highlight hotspots and forecast patterns for public health awareness.

## Constraints

- **Tech Stack**: Must strictly use Next.js (App Router), Express.js, Sequelize ORM, PostgreSQL, TypeScript, Tailwind CSS, Lucide Icons, Leaflet (via `react-leaflet`), Recharts, Docker.
- **Performance**: Optimized single-table structure (`RekamMedis`) for quick aggregation queries over large historical datasets.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router (Frontend) | Standard modern React framework matching frontend requirements | ☕ Pending |
| Express.js + Sequelize ORM (Backend) | Lightweight API backend framework with SQL database mapping | ☕ Pending |
| PostgreSQL | Relational database with robust querying capability | ☕ Pending |
| Docker Compose | Seamless orchestration of PostgreSQL database, Express API, and Next.js app | ☕ Pending |

---
*Last updated: 2026-06-21 after restructuring to Microservices-style Monorepo*
