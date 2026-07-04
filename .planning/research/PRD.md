# PROJECT.md: Public Health Radar (Sistem Peringatan Dini Epidemiologi Wilayah)

## 1. Project Overview
This project is a Public-Facing Management Information System (MIS) designed to visualize disease spread, forecast future health trends, and detect medical anomalies based on raw clinical data. The system is read-only for public users and relies heavily on data aggregation, GIS (Geospatial) mapping, and time-series forecasting.

## 2. Tech Stack Requirements
The AI Agent must strictly use the following technologies to scaffold and initialize the project:
* **Core Framework:** Next.js (App Router) with TypeScript.
* **Styling & UI Components:** Tailwind CSS, `shadcn/ui` (for modern, minimal enterprise UI), Lucide Icons.
* **Database:** PostgreSQL.
* **ORM:** Prisma ORM.
* **Data Visualization (Charts):** Recharts (for Trend Forecasting and Donut Charts).
* **Geospatial Mapping (GIS):** `react-leaflet` (Leaflet.js) to render interactive Choropleth Heatmaps using local GeoJSON data.
* **Containerization:** Docker & Docker Compose.
* **Data Seeding:** Faker.js (to generate realistic dummy patient records).

## 3. Initialization & Docker Specifications (Actionable Instructions for Agent)
Upon initialization, the system must generate the necessary files to run the app seamlessly via Docker:
1.  **`Dockerfile`:** Setup a multi-stage build for the Next.js application.
2.  **`docker-compose.yml`:** * Service 1: `db` (PostgreSQL 15+ container with a persistent volume).
    * Service 2: `web` (Next.js app connected to the `db` service via `DATABASE_URL` environment variable).
3.  **Prisma Setup:** Initialize Prisma schema with the initial `RecordMedis` model.
4.  **Makefile / Package.json scripts:** Create shortcuts (e.g., `npm run docker:up`) to build and start the containers, run Prisma migrations, and execute the seeder automatically.

## 4. Core Database Schema (Prisma)
Create a single, highly optimized table for aggregation queries.
Model: `RekamMedis`
* `id` (UUID, Primary Key)
* `tanggal_kunjungan` (DateTime, Indexed for time-series queries)
* `kode_icd10` (String, e.g., "A90", "J06.9")
* `nama_penyakit` (String)
* `kecamatan_domisili` (String, Indexed for spatial grouping)

## 5. Development Constraints & Edge Cases
* **DO NOT** build user authentication (Login/Register) for the MVP. The dashboard is public.
* **DO NOT** build CRUD forms for data entry. The system assumes data is synced from an external TPS.
* **Seeding is Mandatory:** The agent must write a script (`seed.ts`) using Faker.js to inject at least 5,000 rows of dummy medical records into the database upon initial migration to ensure the charts and maps have data to render.

## 6. Page Structure (Next.js Routes)
* `/` (Dashboard - Geospatial Surveillance): Contains the Leaflet Heatmap and dynamic Region Detail Panel.
* `/proyeksi-tren` (Dashboard - Trend Forecasting): Contains Recharts Line Chart with historical and predicted dotted lines.
* `/peringatan-dini` (Dashboard - Early Warning System): Displays anomaly detection cards and rare disease datatable.