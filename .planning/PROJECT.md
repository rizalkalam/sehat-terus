# Sehat Terus (Public Health Radar)

## What This Is

A public-facing Management Information System (MIS) designed to visualize disease spread, forecast future health trends, and detect medical anomalies based on raw clinical data in Indonesian regions. The system is read-only for public users and relies heavily on data aggregation, GIS (Geospatial) mapping, and time-series forecasting.

## Core Value

To provide clear, automated spatial and temporal early warnings for disease outbreaks without administrative overhead.

## Requirements

### Validated

(None yet – ship to validate)

### Active

- [ ] Scaffolding Next.js (App Router) project with TypeScript.
- [ ] Multi-stage Dockerfile for Next.js app and docker-compose.yml with PostgreSQL and Next.js services.
- [ ] Database Schema: Set up Prisma ORM with the `RekamMedis` model and optimized indexes on `tanggal_kunjungan` and `kecamatan_domisili`.
- [ ] Seed script using Faker.js to populate at least 5,000 realistic dummy medical records upon migration.
- [ ] Short-cut scripts in package.json/Makefile to build, start, migrate, and seed the app seamlessly via Docker.
- [ ] Geospatial Surveillance Page (`/`): Render interactive Choropleth Heatmaps using react-leaflet and local Indonesian region GeoJSON, accompanied by a dynamic Region Detail Panel.
- [ ] Trend Forecasting Page (`/proyeksi-tren`): Render Recharts Line Chart illustrating historical data and predicted trend lines.
- [ ] Early Warning Page (`/peringatan-dini`): Render anomaly detection status cards and a datatable for rare disease tracking.

### Out of Scope

- User authentication (Login/Register) – The dashboard is public-facing and read-only for all users.
- CRUD forms for data entry – The system assumes raw data is synced from an external Transaction Processing System (TPS).

## Context

- The application will utilize local GeoJSON data for regional mapping (focusing on an Indonesian region such as Yogyakarta or Jakarta).
- Data visual representations need to highlight hotspots and forecast patterns for public health awareness.

## Constraints

- **Tech Stack**: Must strictly use Next.js (App Router), TypeScript, Tailwind CSS, `shadcn/ui`, Lucide Icons, Leaflet (via `react-leaflet`), PostgreSQL, Prisma, Recharts, Docker.
- **Performance**: Optimized single-table structure (`RekamMedis`) for quick aggregation queries over large historical datasets.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js (App Router) + TypeScript | Modern, high-performance web framework matching requirements | ☕ Pending |
| PostgreSQL & Prisma ORM | Relational database with robust querying capability and type-safe schema | ☕ Pending |
| Leaflet (react-leaflet) | Light-weight, interactive geospatial visualization | ☕ Pending |
| Docker Compose | Seamless orchestration of PostgreSQL database and Web app container | ☕ Pending |

---
*Last updated: 2026-06-17 after SlashCommand(/gsd-new-project)*
