# Pitfalls Research

**Domain:** Public Health Radar / Epidemiological Early Warning System
**Researched:** 2026-06-17
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Next.js SSR ReferenceError when Importing Leaflet/React-Leaflet

**What goes wrong:**
During server-side compilation (`next build` or dynamic server-side rendering), the build fails or the dashboard crashes with a `ReferenceError: window is not defined` or `document is not defined`. 

**Why it happens:**
Leaflet.js interacts directly with browser-specific APIs (the global `window` and `document` objects) to manipulate map layers and coordinates. Next.js App Router pre-renders pages on the server by default. Direct imports of `react-leaflet` components are executed in Node.js where these browser APIs do not exist.

**How to avoid:**
1. Isolate all react-leaflet logic into a dedicated client component (e.g., `@/components/GeospatialMap.tsx`) and mark it with `"use client"` at the very top.
2. Dynamically import this map component in the page (e.g., `app/page.tsx`) using Next.js's dynamic helper:
   ```typescript
   import dynamic from "next/dynamic";
   
   const GeospatialMap = dynamic(() => import("@/components/GeospatialMap"), {
     ssr: false,
     loading: () => <div className="h-[500px] w-full animate-pulse bg-slate-100 flex items-center justify-center">Loading Surveillance Map...</div>
   });
   ```
3. Ensure Leaflet CSS and default icon compatibility layers (like `leaflet-defaulticon-compatibility`) are imported inside the client component to prevent missing map styles and broken marker icons.

**Warning signs:**
- The page renders fine in local dev mode (due to quick hot-reloading) but fails during production builds (`next build`) or raises hydration mismatch errors.
- Blank grey space appears where the map should be with console errors indicating standard leaflet classes cannot be found.

**Phase to address:**
Phase 3: Visualizations & GIS Mapping Integration.

---

### Pitfall 2: The Population Density Mirror Trap (Raw Case Count Mapping)

**What goes wrong:**
The Leaflet choropleth map highlights high-population sub-districts (e.g., *Kecamatan Depok* in Yogyakarta or *Kecamatan Cengkareng* in Jakarta) as red "danger zones," regardless of whether there is an actual epidemic. This creates false panics, misinforms public health response, and wastes public resources.

**Why it happens:**
Aggregating raw counts of medical records directly (`COUNT(*)`) grouped by `kecamatan_domisili` without normalizing by the population density or the total population of that sub-district. A map of raw cases is simply a map of population density.

**How to avoid:**
1. Populate demographic and population baseline figures for each region in the database or embed them directly inside the local GeoJSON properties (e.g., `population: 85000`).
2. When querying aggregated cases, divide the raw case count by the sub-district's population and multiply by a scaling factor to obtain a rate-based index:
   $$\text{Incidence Rate} = \left( \frac{\text{Case Count}}{\text{Sub-district Population}} \right) \times 10,000$$
3. Color code the choropleth map based on this *Incidence Rate* rather than the raw case volume.

**Warning signs:**
- Heatmap polygons perfectly match standard population density maps of the region.
- Less populated areas with genuine high-percentage outbreaks (e.g., a small village with 5 out of 10 residents infected) remain undetected (colored gray or light green).

**Phase to address:**
Phase 2: Database Schema & Seeding, and Phase 3: Visualizations & GIS Mapping Integration.

---

### Pitfall 3: Sub-District Name Mismatches between GeoJSON and Postgres Database

**What goes wrong:**
Choropleth polygons remain uncolored (gray or empty) and fail to display health data even though the Postgres database contains thousands of medical records for those areas.

**Why it happens:**
String mismatches between the `kecamatan_domisili` column values in the `RekamMedis` database table and the properties (e.g., `NAME_3` or `KECAMATAN`) in the regional GeoJSON. Common issues include inconsistent casing ("DANUREJAN" vs "Danurejan"), trailing spaces, and administrative prefixes ("Kecamatan Danurejan" vs "Danurejan").

**How to avoid:**
1. Enforce strict data sanitization in the seeding script (`seed.ts`) by drawing the `kecamatan_domisili` values from the exact keys present in the GeoJSON file.
2. In the Next.js API endpoints, normalize all region strings (e.g., convert to lowercase, strip whitespace, remove prefixes like "kecamatan" or "kec.") before grouping or joining:
   ```typescript
   const normalizeName = (name: string) => name.toLowerCase().replace(/^(kecamatan|kec\.)\s+/i, "").trim();
   ```

**Warning signs:**
- Leaflet map loads successfully but remains completely gray.
- Database queries return counts for "KECAMATAN UMBULHARJO", but the GeoJSON features map to "Umbulharjo".

**Phase to address:**
Phase 2: Database Schema & Seeding.

---

### Pitfall 4: Aggregation Query Slowdowns on Large Datasets

**What goes wrong:**
Filtering and aggregating thousands of medical records on the fly for choropleth mapping, trend lines, or anomaly cards triggers table scans in PostgreSQL, leading to slow page loads, server timeouts, and poor user experience.

**Why it happens:**
Queries are made against the single `RekamMedis` table without proper database indexing on the query filters (`tanggal_kunjungan`, `kecamatan_domisili`, `kode_icd10`). Additionally, developers sometimes pull all raw records to Node.js memory to group and count them in JavaScript instead of executing aggregation on the PostgreSQL engine.

**How to avoid:**
1. Implement a compound index on the query fields in `schema.prisma`:
   ```prisma
   model RekamMedis {
     id                 String   @id @default(uuid())
     tanggal_kunjungan  DateTime
     kode_icd10         String
     nama_penyakit      String
     kecamatan_domisili String

     @@index([tanggal_kunjungan, kecamatan_domisili, kode_icd10])
   }
   ```
2. Utilize Prisma's native `.groupBy()` and aggregation APIs (`_count`) to perform calculations on the database server before sending data over the wire.
3. Cache the results of historical aggregate queries (e.g., using Next.js dynamic fetch caching or React `cache`).

**Warning signs:**
- Next.js API endpoints take > 500ms to resolve once the database size reaches 5,000+ records.
- Node.js heap memory usage climbs steadily during map refresh operations.

**Phase to address:**
Phase 1: Project Scaffolding & Setup, and Phase 2: Database Schema & Seeding.

---

### Pitfall 5: Spurious Alerts and Anomaly False Positives (The Small Numbers Problem)

**What goes wrong:**
The Early Warning Page (`/peringatan-dini`) displays alarming red status cards warning of "300% Case Surges" in remote sub-districts, causing alarm fatigue for public health officers and eroding trust in the platform.

**Why it happens:**
The anomaly detection system uses relative percentage increases on very small numbers. For example, a shift from 1 case to 3 cases of influenza in a small village represents a mathematical 200% surge, but is statistically insignificant and represents standard random variance.

**How to avoid:**
1. Establish absolute baseline thresholds: Only trigger anomaly detection algorithms if the case count for the current period exceeds a minimum critical volume (e.g., $\ge 5$ cases).
2. Use standardized epidemiological surveillance models like the Farrington algorithm or Cumulative Sum (CUSUM) that account for historical standard deviation and baseline averages.
3. Label all predictions and warnings with clear confidence tags (e.g., "Sufficient Data", "Low Volume - Interpret with Caution").

**Warning signs:**
- Daily notifications of anomalies for trivial illnesses in small districts.
- Anomaly cards triggering during seasons with low overall case counts.

**Phase to address:**
Phase 4: Early Warning Page & Analytics.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Embedding population data directly into the GeoJSON file** | Avoids creating and joining a database table for regional census data. | Changing population figures requires re-uploading and redeploying large static GeoJSON assets. | **MVP Stage:** Highly acceptable during initial prototyping to maintain the single-table database constraint. |
| **Simple linear extrapolation for time-series forecasting** | Extremely easy to implement in plain TypeScript on the client side using Recharts. | Inaccurate forecasts; infectious disease transmission is non-linear and seasonal. | **MVP Stage:** Only as a visual placeholder to demonstrate the Recharts layout. Must be clearly marked as "illustrative projection". |
| **Executing client-side filtering on raw patient records** | Minimizes backend endpoints; allows instant UI updates. | High network payload (downloading 5,000+ JSON records to the browser) and slow UI responsiveness on mobile devices. | **Never acceptable:** Even for the MVP, data must be aggregated on the server before transmitting it to the client. |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Leaflet Map Tiles (OSM)** | Using HTTP tile URLs (`http://{s}.tile.openstreetmap.org...`), causing mixed content blocks on HTTPS sites. | Always use secure HTTPS tile sources: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. |
| **Prisma & Docker Compose Network** | Using `localhost` in the `DATABASE_URL` for Next.js, which fails inside the container. | Configure the database host in Docker using the db service name: `postgresql://postgres:postgres@db:5432/sehat_terus`. |
| **GeoJSON File Size** | Serving raw, uncompressed 15MB GIS files directly to the client map. | Simplify coordinates using tools like Mapshaper down to a reasonable level (< 1MB) before deployment. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Leaflet Map Re-renders on State Change** | Hovering or clicking a region on the map lag/freeze for 1-2 seconds. | Memoize Leaflet components using `React.memo` and use Leaflet's native event listeners rather than React state hooks inside the polygon loop. | Above 50 polygons or on mobile browsers. |
| **Full Table Scan on Date Ranges** | Ingesting and querying dates without index markers makes aggregate endpoints time out. | Implement database index on `tanggal_kunjungan`. | Above 10,000 records. |
| **Dynamic GeoJSON parsing on API requests** | High memory usage on the Next.js server; slow API response times. | Store GeoJSON in the public folder as static JSON or cache the parsed JSON structure in server memory. | When GeoJSON exceeds 5MB or during parallel page requests. |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Exposing raw RekamMedis records in public API endpoints** | Re-identification of patients with sensitive conditions (HIV, Tuberculosis) in small communities, violating PDP (Perlindungan Data Pribadi). | The API must ONLY return aggregated and grouped counts; never expose individual primary keys, patient descriptions, or exact street addresses. |
| **Lack of SQL parameterization in custom spatial queries** | SQL Injection vulnerability if developers use raw PostgreSQL queries (`$queryRaw`) for geographic containment queries. | Avoid string interpolation inside database calls. Use Prisma's native parameter binding: `` prisma.$queryRaw`SELECT * FROM ... WHERE x = ${param}` ``. |
| **Exposing database seeding endpoints in production builds** | Malicious users resetting or corrupting the public health system dashboard with mock data. | Lock the seed command strictly inside development/Docker entrypoints and do not build or route mock endpoints in the Next.js app. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Visual overwhelm on the Choropleth scale** | Cannot distinguish moderate danger zones from extreme outbreak zones because color bins are linearly distributed. | Use non-linear classification intervals (like Quantiles or Jenks Natural Breaks) for color ranges, and provide a clear legend on the bottom right. |
| **Mobile viewport layout overflow** | The leaflet map container covers UI controls, or the Region Detail Panel hides the map on mobile viewports. | Use Tailwind's responsive heights (`h-[40vh] md:h-[70vh]`) and place the Region Detail Panel below the map on mobile viewports. |
| **Undocumented forecasting lines** | Users assume the Recharts dotted line projection is a guarantee rather than a statistical estimation. | Always display upper and lower confidence intervals using shaded area bands (`<Area>`) and add explanatory tooltips. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Leaflet Map rendering:** Often looks done locally but missing default marker icon assets on production Docker containers. Verify markers render with proper shapes and no 404 image errors in network tab.
- [ ] **Prisma Seed Script:** Often populates date fields in clustered blocks or uses invalid regional names. Verify dates span a realistic 12-month timeline and district names match the GeoJSON casing exactly.
- [ ] **Recharts forecasting page:** Often predicts negative case numbers when rendering downward trends. Verify that the forecasting logic restricts output to a minimum of 0.
- [ ] **Early Warning Cards:** Often display active alarms for regions with 0 or 1 cases. Verify that anomaly cards only display alerts for regions exceeding baseline activity.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **`ReferenceError: window is not defined` build failure** | LOW | Identify the page importing the map component, rewrite the import statement using `next/dynamic` with `ssr: false`, and trigger a clean build. |
| **Map load lag or page freeze** | MEDIUM | Run the GeoJSON through `mapshaper.org` with a `simplify` factor of 10%-20% to reduce polygon vertex counts, swap leaflet components with memoized equivalents, and verify page load. |
| **Database aggregation timeout** | HIGH | Add missing indexes to `schema.prisma`, run a database migration inside Docker container, and rewrite prisma queries to run aggregations directly on the PostgreSQL engine. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **Next.js SSR Window Error** | Phase 3: Visualizations & GIS Mapping | Run `npm run build` locally and within the Docker container to ensure production builds compile successfully. |
| **Population Density Mirror Trap** | Phase 2: Database Schema & Seeding | Inspect seeded data in the database and verify that map layers calculate the color bins using case-per-capita formulas instead of raw counts. |
| **District Name Mismatch** | Phase 2: Database Schema & Seeding | Run a validation script checking for 100% match success between GeoJSON district properties and distinct `kecamatan_domisili` values in the database. |
| **Database Query Aggregation Lag** | Phase 1: Docker & Prisma Setup | Run a load test of 5,000+ records and check query execution plans (`EXPLAIN ANALYZE`) to verify index usage. |

## Sources

- [Next.js Documentation: Dynamic Imports and SSR](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr)
- [React-Leaflet Setup Guidelines for SSR Frameworks](https://react-leaflet.js.org/docs/start-introduction/)
- [World Health Organization (WHO) Epidemiological Surveillance Standards](https://www.who.int/publications/i/item/9789241563895)
- [Modifiable Areal Unit Problem (MAUP) & Geospatial Health Analysis Basics](https://www.sciencedirect.com/topics/computer-science/modifiable-areal-unit-problem)

---
*Pitfalls research for: Public Health Radar (Epidemiological Early Warning System)*
*Researched: 2026-06-17*
