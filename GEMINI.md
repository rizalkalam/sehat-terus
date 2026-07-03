<!-- GSD:project-start source:PROJECT.md -->

## Project

**Sehat Terus (Public Health Radar)**

A public-facing Management Information System (MIS) designed to visualize disease spread, forecast future health trends, and detect medical anomalies based on raw clinical data in Indonesian regions. The system is read-only for public users and relies heavily on data aggregation, GIS (Geospatial) mapping, and time-series forecasting.

**Core Value:** To provide clear, automated spatial and temporal early warnings for disease outbreaks without administrative overhead.

### Constraints

- **Tech Stack**: Must strictly use Next.js (App Router), TypeScript, Tailwind CSS, `shadcn/ui`, Lucide Icons, Leaflet (via `react-leaflet`), PostgreSQL, Prisma, Recharts, Docker.
- **Performance**: Optimized single-table structure (`RekamMedis`) for quick aggregation queries over large historical datasets.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology                  | Version                 | Purpose                                             | Why Recommended                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js (App Router)**    | `15.2.13`               | Core web framework, React Server Components (RSC)   | Enables server-side database aggregations directly in RSC, reducing client-side bundle size. Provides fast initial page loads for public users and seamless routing for dashboard panels (`/`, `/proyeksi-tren`, `/peringatan-dini`). We choose `15.2.x` for stability and maximum React 19 compatibility across leaflet/recharts ecosystems. |
| **TypeScript**              | `5.7.3`                 | Static typing and compile-time safety               | Crucial for typing Indonesian GeoJSON features, health record schemas (`RekamMedis`), and forecasting API payloads.                                                                                                                                                                                                                           |
| **PostgreSQL**              | `16.x`                  | Relational database storage                         | Best-in-class open-source database for complex relational data, sub-query aggregations, and spatial query operations. Supports extensions like `pg_trgm` and `postgis` if we ever need advanced geographic queries (though standard queries are grouped by `kecamatan_domisili`).                                                             |
| **Prisma ORM**              | `7.8.0`                 | Database schema management & type-safe queries      | Provides type-safe Prisma client matching the database schema (`RekamMedis`), simple migration management, and native support for fast aggregation APIs (`groupBy`, `count`, `avg`) required by public health visual modules.                                                                                                                 |
| **react-leaflet**           | `5.0.0`                 | Geospatial mapping visualization                    | Lightweight React wrapper for Leaflet.js. Required for rendering choropleth heatmaps of Jakarta/Yogyakarta districts using GeoJSON data. v5.0.0 is selected because of direct React 19 peer dependency compliance.                                                                                                                            |
| **Leaflet**                 | `1.9.4`                 | Direct DOM geospatial mapping library               | Underpinning GIS technology for mapping. Highly mature, runs without heavy canvas/WebGL overhead, ideal for standard administrative district maps (Kecamatan) without overloading public client browsers.                                                                                                                                     |
| **Recharts**                | `3.8.1`                 | Time-series and epidemiological trend visualization | Easy-to-use React chart library. Offers responsive Line charts (`/proyeksi-tren`) and Donut charts for visualizing historical disease data, anomalies, and predicted confidence intervals. Stable version 3.8.1 includes critical bug fixes for React 19 contexts.                                                                            |
| **Docker & Docker Compose** | `24.x` / Compose `v2.x` | Orchestration and containerization                  | Standardizes local and production environments, ensuring PostgreSQL and Next.js run in identical isolated containers. Docker Compose coordinates network, environment variables (`DATABASE_URL`), and volumes for data persistence.                                                                                                           |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@faker-js/faker** | `10.4.0` | Generating realistic clinical records | Mandatory for seeding `RekamMedis` table with 5,000+ records during database migrations to mock regional Indonesian patient visits. |
| **tailwind-merge** | `3.0.1` | Utility class merging | Used in combination with clsx to merge Tailwind CSS classes dynamically without conflicts inside custom UI components. |
| **clsx** | `2.1.1` | Conditional class joining | Standard utility for conditional Tailwind classes (e.g. coloring cards based on warning thresholds like low/medium/high alert). |
| **class-variance-authority** | `0.7.1` | UI component variant management | Standard utility used by shadcn/ui to manage component states and styles (e.g., alert levels: info, warning, danger). |
| **lucide-react** | `0.475.0` | UI Icons | Used across all pages (`/`, `/proyeksi-tren`, `/peringatan-dini`) for clean, modern interface iconography (e.g., warning shields, trend lines, map pins). |
| **@tanstack/react-table** | `8.21.2` | Data table features | Required for the rare disease tracking data table on the Early Warning Page (`/peringatan-dini`). Offers pagination, filtering, and sorting out of the box. |
| **date-fns** | `4.1.0` | Date manipulation | Vital for time-series aggregation intervals (daily, weekly, monthly) and parsing `tanggal_kunjungan` timestamps. |
| **simple-statistics** | `9.3.0` | Basic statistical computations | Highly recommended for calculating moving averages, linear trend regression, or anomaly thresholds (e.g., standard deviation alarms) in `/peringatan-dini` and `/proyeksi-tren`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **tsx** | Running TypeScript scripts | Required to execute the `seed.ts` file seamlessly from CLI or package.json scripts (e.g. `npx tsx prisma/seed.ts`). |
| **Prisma Studio** | Database exploration UI | Used to inspect mock patient records locally. Run via `npx prisma studio`. |
| **Makefile** | CLI Orchestration | Standard tool for single-command builds and migrations (`make setup`, `make run`, `make seed`). |

## Installation

# Core

# Supporting

# Dev dependencies

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **react-leaflet (Leaflet.js)** | **MapLibre GL JS** | When plotting millions of high-density individual disease vectors on a map canvas with fast WebGL acceleration, rather than standard Indonesian region-level (Kecamatan/District) GeoJSON boundaries. |
| **Recharts** | **D3.js** | When creating bespoke, highly-customized data animations or complex interactive chart overlays that standard SVG grid components in Recharts cannot easily represent. |
| **Prisma ORM** | **Drizzle ORM** | When database queries require fine-grained SQL performance tuning or serverless cold-start optimization, rather than Prisma's structured migrations and robust out-of-the-box type safety. |
| **Tailwind CSS v4** | **CSS Modules** | When building highly isolated component libraries with strict local styling scopes, rather than a rapid, unified utility-first web application layout. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Mapbox GL JS (commercial)** | Requires active API keys, starts incurring commercial tier costs at volume, and introduces external tracking dependencies. | `react-leaflet` (Leaflet.js) which is completely open-source and runs locally. |
| **Prisma client queries in Client Components** | Exposes database credentials and connection pool directly to the client bundle, causing severe security issues. | Fetching data via React Server Components (RSC) and passing serialized JSON payloads to Leaflet/Recharts components. |
| **Heavy client-side time-series forecasting (e.g., TensorFlow.js)** | Drastically increases client package size, causing slow loads on public health mobile views. | Pre-calculating forecasted trend lines in RSC using lightweight mathematical libraries like `simple-statistics`. |
| **Leaflet CSS imports directly in page components** | Can lead to styling loading lag, causing Leaflet tiles to render vertically stacked on initial load due to hydration order. | Importing Leaflet CSS globally in `src/app/globals.css` or via root layout header tags. |

## Stack Patterns by Variant

- Use **MapLibre GL** with vector tiles instead of Leaflet.
- Because Leaflet is DOM-based and starts lagging when rendering more than a few thousand interactive SVG marker elements simultaneously. (For our region-level aggregate choropleth, Leaflet is perfect and has zero lag).
- Use a **Python FastAPI backend** with `statsmodels` or `Prophet` containerized alongside PostgreSQL, exposing forecasting endpoints to Next.js.
- Because Next.js/JavaScript lacks robust mature time-series forecasting packages equivalent to Python's data science ecosystem.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react-leaflet@5.0.0` | `leaflet@1.9.4`, `react@19.0.0` | React 19 is a strict peer dependency for react-leaflet v5. Requires Leaflet CSS v1.9.4 to display correctly. |
| `recharts@3.8.1` | `react@19.0.0`, `react-dom@19.0.0` | Native support for React 19 without hydration or context errors. |
| `@faker-js/faker@10.4.0` | `tsx@4.19.2`, `typescript@5.7.x` | Seed scripts written in TS require modern TSX runner. Faker v10 has updated ESM exports. |
| `tailwindcss@4.3.1` | `postcss@8.x` | Tailwind v4 uses CSS-first configuration and doesn't require `tailwind.config.js`. Uses `@tailwindcss/postcss` for integration. |

## Sources

- `npmjs.com/package/react-leaflet` — verified React 19 peer dependencies and version 5.0.0.
- `npmjs.com/package/recharts` — verified v3.8.1 React 19 compatibility.
- `tailwindcss.com/docs/v4-beta` / shadcn/ui changelog — verified support for Tailwind CSS v4 and new CSS-first config.
- Indonesian Geospatial Portal (Ina-Geoportal) / local GeoJSON guidelines — verified that standard GeoJSON files parse efficiently in Leaflet.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
