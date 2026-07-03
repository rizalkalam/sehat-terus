# Project Research Summary

**Project:** Sehat Terus (Public Health Radar)
**Domain:** Public Health Radar / Epidemiological Early Warning System (Geospatial Surveillance & Forecasting)
**Researched:** June 17, 2026
**Confidence:** HIGH

## Executive Summary

Sehat Terus is a public-facing, read-only Management Information System (MIS) designed to visualize disease spread, forecast future health trends, and detect medical anomalies based on clinical data in Indonesian regions. To maximize performance and maintain a lightweight architecture, the system relies on a single-table PostgreSQL database schema (`RekamMedis`) and offloads administrative processes like authentication and manual record entries to external Transaction Processing Systems.

The recommended approach utilizes a Next.js App Router framework with TypeScript, containerized via Docker Compose alongside PostgreSQL. The frontend visualizes geospatial disease distribution via a React-wrapped Leaflet map (using local GeoJSON boundaries) and renders historical and predicted trends via Recharts. Outbreaks and anomalies are highlighted on the early warning interface using server-computed statistical Z-score thresholds, preventing resource-heavy calculations on the client.

The primary technical risks involve Next.js Server-Side Rendering (SSR) compilation failures when importing Leaflet (which directly references browser-only `window` and `document` APIs), and data integrity challenges such as sub-district name mismatches between the GeoJSON and database records. Mitigations include implementing lazy dynamic loading (`ssr: false`) for Leaflet maps, strictly mapping database seeding values to GeoJSON properties, and utilizing database-level indexes on temporal and spatial columns to avoid performance degradation as datasets scale.

## Key Findings

### Recommended Stack

The stack centers on Next.js `15.2.13` (App Router) paired with React `19` and TypeScript `5.7.3` for type safety and server-side aggregation, which drastically reduces client bundle sizes. PostgreSQL `16.x` and Prisma ORM `7.8.0` provide a structured, high-performance querying layer. Geospatial visuals are handled by `react-leaflet` `5.0.0` (with Leaflet `1.9.4` rendering choropleth maps), and epidemiological trend visualization uses `recharts` `3.8.1`. Environment standardization is maintained through Docker and Docker Compose `24.x`. Detailed stack information can be found in [STACK.md](file:///D:/projects/isd-project/sehat-terus/.planning/research/STACK.md).

**Core technologies:**
- **Next.js (App Router)**: Core web framework — Enables server-side database aggregations directly in React Server Components (RSC), reducing client-side bundle size and page load times.
- **PostgreSQL & Prisma ORM**: Relational database & schema manager — Offers type-safe queries and fast aggregation functions (`groupBy`, `count`) matching the schema.
- **react-leaflet (Leaflet.js)**: Geospatial mapping — Provides lightweight rendering of district choropleth heatmaps using GeoJSON without heavy canvas/WebGL overhead.
- **Recharts**: Data visualization — Renders time-series trends and dotted future projection lines with native support for React 19.
- **Docker & Docker Compose**: Containerized environment — Standardizes development and deployment environments across database and web app instances.

### Expected Features

Sehat Terus shifts descriptive data monitoring into an active early warning radar. The system operates in a read-only manner, assuming data ingestion happens out-of-band. Detailed feature breakdowns are available in [FEATURES.md](file:///D:/projects/isd-project/sehat-terus/.planning/research/FEATURES.md).

**Must have (table stakes):**
- **Geospatial Surveillance Map (T1)** — Interactive choropleth map rendering Indonesian sub-district (kecamatan) case densities.
- **Dynamic Region Detail Panel (T2)** — React side panel showing district-specific metrics when a region is selected.
- **Historical Time-Series Trends (T3)** — Time-series line chart displaying historical volumes with filters.
- **Dockerized Environment (T4)** — Multi-stage Next.js build and Postgres database container orchestration.
- **High-Performance Aggregate API (T5)** — Fast backend route handlers executing database-level temporal and spatial aggregations.
- **Faker-powered Data Seeder (T6)** — CLI script inserting 5,000+ realistic clinical records (matching Indonesian subdistricts and valid ICD-10 codes).

**Should have (competitive):**
- **Predictive Trend Forecasting (D1)** — Server-side double exponential smoothing/linear regression projecting trends 14–30 days ahead on Recharts.
- **Statistical Anomaly Detection & Alerts (D2)** — Statistical outlier detection (Z-score standard deviation comparison) generating alert statuses ("Siaga" / "Aman").
- **Rare & Dangerous Disease Tracker (D3)** — Detailed lookup and datatable displaying single occurrences of high-severity diseases (e.g., Cholera, Measles).

**Defer (v2+):**
- **Cross-Disease Correlation Matrix (D4)** — Heatmap or scatter plot mapping Pearson correlation coefficients between disease pairs (non-essential for initial launch).

### Architecture Approach

The system separates responsibilities into a presentation layer (Client components for Leaflet, Recharts, and alert lists), an application layer (Next.js Server Components and API route handlers executing data processing, forecasting, and anomaly algorithms), and a storage layer (PostgreSQL and local GeoJSON static assets). Server Actions (`src/app/actions/stats.ts`) keep complex calculations on the server, while the Leaflet GIS components are isolated and loaded using `next/dynamic` with `ssr: false` to bypass Node.js environment limitations. Database performance is sustained by defining composite B-Tree indexes directly on query keys (`tanggal_kunjungan` and `kecamatan_domisili`). See [ARCHITECTURE.md](file:///D:/projects/isd-project/sehat-terus/.planning/research/ARCHITECTURE.md) for structural diagrams and details.

**Major components:**
1. **Presentation Client Layer (`Leaflet Map` / `Recharts` / `Alerts`)**: Handles user interactions, updates region detail state, and displays SVG/CSS visualizations.
2. **Server Action & Processing Layer (`actions/stats.ts`)**: Executes database aggregations, runs mathematical forecast formulas, and identifies active anomalies.
3. **Database & Storage Layer (`PostgreSQL` / `Prisma` / `GeoJSON`)**: Manages clinical records with indexing and stores local geographic polygons.

### Critical Pitfalls

A list of critical traps and mitigation strategies has been compiled to guide implementation. Detailed prevention steps are located in [PITFALLS.md](file:///D:/projects/isd-project/sehat-terus/.planning/research/PITFALLS.md).

1. **Next.js SSR ReferenceError when Importing Leaflet** — Bypassed by wrapping map components in `next/dynamic` with `{ ssr: false }` to avoid importing Leaflet on the server.
2. **The Population Density Mirror Trap (Raw Case Mapping)** — Mitigated by normalizing raw counts against district population data (obtained from GeoJSON features) to plot Incidence Rates per 10,000 residents instead of raw counts.
3. **Sub-District Name Mismatches** — Handled by enforcing strict data sanitization in `seed.ts` using names sourced directly from local GeoJSON keys, and normalizing strings (lowercasing, trimming prefixes) during query matches.
4. **Database Query Aggregation Lag** — Prevented by adding composite B-Tree indexes on `[tanggal_kunjungan, kecamatan_domisili, kode_icd10]` and running grouping operations natively inside PostgreSQL.
5. **Spurious Alerts and Anomaly False Positives** — Avoided by enforcing absolute baseline thresholds (e.g., minimum of 5 cases) before flagging a relative percentage surge in low-population districts.

## Implications for Roadmap

Based on the research, a sequenced phased structure is suggested to ensure proper dependency management and early mitigation of pitfalls:

### Phase 1: Environment & Database Bedrock
- **Rationale:** Establishing the containerized services and database schemas forms the foundation. Migrations must be active before we can seed data or query it.
- **Delivers:** Orchestrated Docker Compose environment (PostgreSQL + Next.js), configured Prisma schema with B-Tree indexes.
- **Addresses:** Dockerized Environment & Compose (T4), High-Performance Aggregate API (T5 - Schema part).
- **Avoids:** Database Query Aggregation Lag (Pitfall 4) by introducing composite indexes at the schema creation stage.

### Phase 2: Mock Ingestion & Geographic Mapping Validation
- **Rationale:** Seeding must occur next. To validate that the seeded data matches the mapping boundaries, the sub-district names in the database must align with the GeoJSON features.
- **Delivers:** Faker-powered CLI seed script writing 5,000+ realistic records, population baseline data integration, validation of GeoJSON coordinate polygons.
- **Addresses:** Faker-powered Clinical Data Seeder (T6).
- **Avoids:** Sub-District Name Mismatches (Pitfall 3) and the Population Density Mirror Trap (Pitfall 2) by seeding normalized names and population counts directly.

### Phase 3: Core Surveillance & GIS Visualizations
- **Rationale:** Once clean database records are available, the visual interfaces can consume the aggregated API data. Map and chart presentation frameworks should be built here.
- **Delivers:** Next.js App Router layout, dynamically loaded Leaflet choropleth map (`/`), dynamic Region Detail panel, historical Recharts lines (`/proyeksi-tren`).
- **Addresses:** Geospatial Surveillance Map (T1), Dynamic Region Detail Panel (T2), Historical Time-Series Trends (T3), High-Performance Aggregate API (T5 - Route Handlers).
- **Avoids:** Next.js SSR ReferenceError (Pitfall 1) by implementing client-side lazy-loading with SSR disabled.

### Phase 4: Early Warning System & Forecasting Analytics
- **Rationale:** After historical visualization is working, advanced analytics (forecasting curves and anomaly detection triggers) can be layered on top of the server actions.
- **Delivers:** Server actions executing Holt-Linear forecasting models and Z-score outlier logic; `/peringatan-dini` dashboard with status cards and rare disease table.
- **Addresses:** Predictive Trend Forecasting (D1), Statistical Anomaly Detection & Alerts (D2), Rare & Dangerous Disease Tracker (D3).
- **Avoids:** Spurious Alerts and Anomaly False Positives (Pitfall 5) by implementing minimum case threshold filters in the server math.

### Phase Ordering Rationale

- **Dependency Flow:** Core database configurations and containerized environments (Phase 1) are required before data seeding (Phase 2) can take place. Visual modules (Phase 3) cannot render without seeded records, and advanced analytics/forecasting models (Phase 4) build directly on top of the historical data retrieval structures.
- **Architectural Cohesion:** Grouping the schema, Docker, and migrations together ensures the local container environment mirrors production. Splitting UI layouts into Phase 3 and Analytics into Phase 4 separates core visualization bugs (like SSR leaflet errors) from mathematical verification (like forecasting accuracy and anomaly Z-score boundaries).
- **Pitfall Avoidance:** By prioritizing name verification and normalization formulas in Phase 2, we guarantee the map rendering in Phase 3 does not load empty gray layers.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Early Warning & Analytics):** Needs refinement on double exponential smoothing constraints (ensuring predictions do not fall below zero) and selecting the optimal Z-score multiplier for anomaly algorithms to prevent false-positive alert fatigue.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Environment & DB Bedrock):** Well-documented, standard Docker Compose configurations and Prisma PostgreSQL setups.
- **Phase 3 (Core Visualizations):** Standard patterns exist for loading Leaflet dynamically in Next.js App Router and rendering Recharts lines.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tech stack choices align with standard React 19 compatible libraries (`react-leaflet@5`, `recharts@3.8.1`) and standard Prisma ORM. |
| Features | HIGH | Table stakes features cover standard epidemiological needs, and the read-only scope removes authentication/CRUD overhead. |
| Architecture | HIGH | Clear separation of Server Actions and dynamic client-side Leaflet loads, preventing SSR errors and keeping data operations localized to PostgreSQL. |
| Pitfalls | HIGH | Specific and actionable mitigation strategies defined for each identified error (SSR map loading, population density mapping, name alignment). |

**Overall confidence:** HIGH

### Gaps to Address

- **Baseline Demographics:** We need to ensure that local Yogyakarta/Jakarta population numbers are accurately mapped within the GeoJSON properties or loaded into a baseline database table to calculate the Incidence Rate correctly.
- **Forecasting Model Boundary:** The simple statistical projection model in server code needs safeguards (e.g. `Math.max(0, forecastedVal)`) to handle sharp drop trends without predicting negative case numbers.

## Sources

### Primary (HIGH confidence)
- Next.js Documentation: Dynamic Imports and SSR (https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr) — verified SSR map loading.
- React-Leaflet Setup Guidelines for SSR Frameworks (https://react-leaflet.js.org/docs/start-introduction/) — verified React 19/Leaflet peer versions.
- Prisma ORM Documentation: Aggregations & Group By (https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) — verified database grouping support.

### Secondary (MEDIUM confidence)
- World Health Organization (WHO) Epidemiological Surveillance Standards — informs standard anomaly threshold Z-scores.
- Ina-Geoportal (Indonesian Geospatial Portal) — defines regional administrative levels and names.

### Tertiary (LOW confidence)
- Standard Holt-Winters double exponential smoothing models in JavaScript — needs verification for edge-case accuracy under variable trend spikes.

---
*Research completed: June 17, 2026*
*Ready for roadmap: yes*
