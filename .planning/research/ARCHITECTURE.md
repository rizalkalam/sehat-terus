# Architecture Research

**Domain:** Public Health Radar (Epidemiological Early Warning System)
**Researched:** 2026-06-17
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer (Client)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ ┌────────┐ │
│  │ Leaflet Map  │ │ Detail Panel │ │ Recharts  │ │ Alert  │ │
│  │ (Choropleth) │ │ (Region Stats│ │ Forecasting│ │ Cards  │ │
│  └──────┬───────┘ └──────┬───────┘ └─────┬─────┘ └────┬───┘ │
│         │                │               │            │     │
├─────────┼────────────────┼───────────────┼────────────┼─────┤
│         ▼                ▼               ▼            ▼     │
│                    Application Layer (Next.js Server)       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Server Components / API Route Handlers                 │ │
│  │ (Data Aggregation, Forecasting & Anomaly Algorithms)   │ │
│  └──────────────────────┬─────────────────────────────────┘ │
├─────────────────────────┼───────────────────────────────────┤
│                         ▼                                   │
│                    Database & Storage Layer (PostgreSQL)    │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │ Prisma ORM Client      │  │ Local GeoJSON Files        │ │
│  └──────────┬─────────────┘  └──────────┬─────────────────┘ │
│             ▼                           │                   │
│  ┌──────────────────────────────────────▼─────────────────┐ │
│  │ PostgreSQL DB Container (RekamMedis table & Indexes)    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Leaflet Map (Choropleth)** | Render interactive spatial boundaries of districts (Kecamatan). Dynamic color coding based on disease density (Choropleth Map). Handle click events to inspect region stats. | Client-side component (`'use client'`) utilizing `react-leaflet`, dynamically imported into the page using Next.js `next/dynamic` with `ssr: false`. |
| **Region Detail Panel** | Subscribes to map selection state. Displays specific metrics (top disease, weekly growth, patient distribution) for the selected Kecamatan. | React Client Component using `shadcn/ui` Cards and Badge components for visual styling. |
| **Recharts Forecasting Chart** | Visualize historical case counts alongside predicted upcoming trend lines (represented by a distinct dotted visual style). | Client-side `Recharts` (`LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`) fed with blended historical-forecast data structures. |
| **Alert Cards & Datatable** | Render active statistical anomalies (sudden spikes) and show detailed logs of critical rare disease cases (like specific ICD-10 identifiers) in a searchable table. | Tailwind CSS/shadcn components coupled with `@tanstack/react-table` for search, pagination, and sorting. |
| **Server Components & Actions** | Fetch raw records from PostgreSQL database, execute aggregation queries (`groupBy`), process statistical forecasts, and execute anomaly logic. | Next.js Server Components and Server Actions in TypeScript using the Prisma Client. |
| **Prisma & PostgreSQL** | Hold records of `RekamMedis`. Provide ultra-fast aggregations on timestamp and spatial keys using B-Tree indexing. | Dockerized PostgreSQL 15+ container instance accessed via Prisma Client ORM. |

---

## Recommended Project Structure

For a clean separation of server-side data fetching, GIS libraries, visualization libraries, and static assets, the following workspace structure is recommended:

```
src/
├── app/                      # Next.js App Router routing entry points
│   ├── layout.tsx            # Global HTML wrapper, styling declarations
│   ├── page.tsx              # Geospatial Dashboard page (map + region panel)
│   ├── proyeksi-tren/        # Trend Forecasting page route
│   │   └── page.tsx          # Recharts dashboard shell
│   ├── peringatan-dini/      # Early Warning page route
│   │   └── page.tsx          # Anomaly & rare disease list shell
│   └── actions/              # Server Actions for type-safe data access
│       └── stats.ts          # Aggregate query actions, anomaly & forecast math
├── components/               # UI components
│   ├── ui/                   # Reusable shadcn/ui components (Card, Table, Badge, Button)
│   ├── map/                  # Spatial visualization sub-modules
│   │   ├── MapContainer.tsx  # Dynamic map component ('use client')
│   │   ├── MapWrapper.tsx    # Dynamic loading skeleton wrapper
│   │   └── RegionPanel.tsx   # Detailed statistics sidebar for selected region
│   └── charts/               # Time-series charts
│       └── ForecastChart.tsx # Recharts LineChart implementation
├── data/                     # Local static files
│   └── kecamatan.geojson     # Spatial polygons representing Indonesian subdistricts
├── lib/                      # Core configuration and helpers
│   ├── prisma.ts             # Prisma Client singleton initializer
│   └── utils.ts              # Tailwind CSS class utility (cn helper)
└── prisma/                   # DB migrations, seeds and schemas
    ├── schema.prisma         # Database model definitions with optimized Indexes
    └── seed.ts               # Faker.js populator for 5,000+ mock records
```

### Structure Rationale

- **`src/app/actions/`**: Consolidates database aggregation queries and mathematics (forecasting calculations, anomaly checks) on the server. Keeping queries here keeps the page routes tidy and ensures calculations do not leak into browser bundles.
- **`src/components/map/`**: Isolates Leaflet libraries. Because Leaflet relies on the browser's `window` object, keeping client components isolated lets us cleanly use `next/dynamic` to load them with `ssr: false` in Server Pages.
- **`src/data/`**: Hosts spatial GeoJSON files. Storing local subdistrict polygon data within the project allows fast local reads and avoids external HTTP dependencies.

---

## Architectural Patterns

### Pattern 1: Server-Side Aggregation & Group-By Queries

**What:** Performing all data grouping, sum, and count operations in PostgreSQL rather than sending raw records to the browser.
**When to use:** Crucial for spatial heatmaps and time-series charts where rendering hundreds of thousands of medical records would crash browser threads.
**Trade-offs:** Increases database CPU utilization slightly during peak aggregate queries, but saves massive network bandwidth and client-side processing.

**Example:**
```typescript
// src/app/actions/stats.ts
import { prisma } from "@/lib/prisma";

export async function getRegionalHeatmapData() {
  // Leverage PostgreSQL index on kecamatan_domisili for instant grouping
  const aggregates = await prisma.rekamMedis.groupBy({
    by: ['kecamatan_domisili'],
    _count: {
      id: true,
    },
  });

  return aggregates.map((item) => ({
    kecamatan: item.kecamatan_domisili,
    cases: item._count.id,
  }));
}
```

### Pattern 2: Dynamic Client-Side GeoJSON Leaflet Integration (SSR-disabled)

**What:** Dynamically importing Leaflet components on the client side using Next.js App Router dynamic module loading.
**When to use:** Required when utilizing `react-leaflet` to avoid `ReferenceError: window is not defined` errors during server pre-rendering.
**Trade-offs:** Map component will show a skeleton loading state on initial load, but ensures robust builds and execution.

**Example:**
```tsx
// src/app/page.tsx (Server Component)
import dynamic from 'next/dynamic';
import { getRegionalHeatmapData } from '@/app/actions/stats';

// Dynamically import the map to block Server Side Rendering
const GeospatialMap = dynamic(
  () => import('@/components/map/MapContainer'),
  { 
    ssr: false, 
    loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading spatial map layer...</div> 
  }
);

export default async function DashboardPage() {
  const caseStats = await getRegionalHeatmapData();
  
  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2">
        <GeospatialMap data={caseStats} />
      </div>
      <div>
        {/* Dynamic region detail component */}
      </div>
    </main>
  );
}
```

### Pattern 3: Dual-Stroke Recharts Time-Series Forecasting Rendering

**What:** Blending historical time-series data and calculated future projections into a single array format, rendering them as solid vs. dashed lines.
**When to use:** When displaying chronological epidemiological datasets with future predictions (e.g., forecasting next 7-14 days).
**Trade-offs:** Requires alignment of timestamps between historical data and future predictions.

**Example:**
```typescript
// Example of blended data structure sent to Recharts:
// [
//   { date: '2026-06-15', actual: 12, predicted: null },
//   { date: '2026-06-16', actual: 15, predicted: null },
//   { date: '2026-06-17', actual: 14, predicted: 14 }, // Overlap point
//   { date: '2026-06-18', actual: null, predicted: 18 },
//   { date: '2026-06-19', actual: null, predicted: 22 }
// ]
```
```tsx
// src/components/charts/ForecastChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ForecastChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        {/* Solid blue line for historical record */}
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#3b82f6" 
          strokeWidth={2.5} 
          dot={{ r: 4 }} 
        />
        {/* Dashed red line for model forecasts */}
        <Line 
          type="monotone" 
          dataKey="predicted" 
          stroke="#ef4444" 
          strokeWidth={2} 
          strokeDasharray="5 5" 
          dot={{ r: 3 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Data Flow

### Request Flow

```
[Public User Dashboard]
    │ (Client Interaction e.g., Hover/Click/Route Change)
    ▼
[Client Components (Leaflet/Recharts)] 
    │ (Invokes Server Action / fetches JSON API endpoint)
    ▼
[Next.js Server Actions / API Routes] 
    │ (Runs Prisma aggregate query)
    ▼
[Prisma Client Layer]
    │ (Translates to SQL group-by)
    ▼
[PostgreSQL Database (RekamMedis)]
    │ (Returns aggregate counts using indexed scan)
    ▼
[Prisma Client Layer]
    │ (Returns typed JSON structures)
    ▼
[Next.js Server Actions / API Routes] 
    │ (Applies anomaly detection Z-Score / forecasting math)
    ▼
[Client Components (Leaflet/Recharts)]
    │ (Renders map polygons & SVG chart strokes)
    ▼
[Updated Public Visualizations]
```

### State Management

For the Geospatial surveillance page, the Leaflet Map needs to talk directly to the Region Detail Panel. Since this is an MVP without complex state management libraries, we use local component state hoisting:

```
           [page.tsx (Dashboard Component)]
                     │           ▲
      (props: data)  │           │ (callback: setSelectedKecamatan)
                     ▼           │
     ┌────────────────────────┐  └──────────────────────────┐
     │ MapContainer (Client)  │                             │
     │ - Renders GeoJSON      │                ┌────────────┴─────────────┐
     │ - Click Kecamatan Poly ├───────────────►│ RegionPanel (Client)     │
     └────────────────────────┘                │ - Shows selected stats   │
                                               │ - Displays top diseases  │
                                               └──────────────────────────┘
```

### Key Data Flows

1. **Geospatial Hotspots Heatmap Flow (`/`):**
   - User opens the root page. The Next.js server executes a Prisma aggregation query grouped by `kecamatan_domisili` for the current month.
   - The server renders the page shell and passes the aggregate statistics array to the client-side Map component.
   - The map loads the static local `kecamatan.geojson` file, matches the polygon district names with the aggregated case numbers, and dynamically applies colors based on scale.
   - Clicking a polygon sets the page state `selectedKecamatan`, which instantly filters and updates the adjacent Detail Panel.
2. **Trend Forecasting Plot Flow (`/proyeksi-tren`):**
   - User opens the forecasting view. Next.js server queries daily case aggregates for the past 90 days.
   - The server passes this time series to a forecasting service class (e.g. moving average or linear regression) which projects the next 14 days of trends.
   - The server aligns both arrays, outputting a merged JSON format containing `actual` and `predicted` properties.
   - The client renders a Recharts visualization using separate `Line` configurations.
3. **Early Warning Spike Alerting Flow (`/peringatan-dini`):**
   - Server fetches case counts per disease for the past week and compares them against historical baseline (standard deviations or moving averages).
   - Any disease exhibiting case counts higher than a defined threshold ($Z > 2.0$ where $Z = (x - \mu)/\sigma$) is flagged.
   - The server simultaneously queries for any occurrence of specific rare critical disease ICD-10 codes (e.g., A95 Yellow Fever, A98 viral hemorrhagic fevers).
   - The identified anomalies are returned to render as warning badges and alert cards, and the rare diseases are displayed in the paginated details datatable.

---

## Scaling Considerations

Because this dashboard is read-only for public users and data is updated out-of-band, scaling is highly predictable.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Single Docker Compose environment running Next.js and PostgreSQL 15 on a single VPS. Prisma Queries run directly on page render. Standard PostgreSQL B-Tree indexes handle the aggregation in milliseconds. |
| **1k-100k users** | Implement Next.js **Incremental Static Regeneration (ISR)** or server-side cache headers (`stale-while-revalidate`). Rather than hitting PostgreSQL on every request, cache the aggregated `/` data and `/proyeksi-tren` payloads for 10-60 minutes, since public health warnings do not require sub-second live updates. |
| **100k+ users** | Separate Next.js containers behind an Nginx load balancer. Deploy PostgreSQL with a read replica specifically for serving the aggregation queries, keeping the primary instance dedicated to incoming TPS sync operations. Use Redis to cache the pre-aggregated dashboard JSON payloads. |

### Scaling Priorities

1. **First bottleneck (Database IO during Peak Aggregations):** If multiple users refresh the dashboard, Next.js will repeatedly call `groupBy` queries on `RekamMedis`. **Solution:** Add Next.js Route Cache or data cache wrappers (`react cache` or `unstable_cache`) to store aggregated payloads for a minimum of 10 minutes.
2. **Second bottleneck (GeoJSON parsing load):** If the GeoJSON file has massive detail (e.g., tens of megabytes), client browsers will lag when parsing and rendering Leaflet polygons. **Solution:** Simplify the GeoJSON polygons using Mapshaper to keep the file size under 1MB.

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side Heavy Query Ingestion & Aggregation

- **What people do:** Developers fetch the entire `RekamMedis` table (5,000+ rows) to the client side using a raw endpoint (e.g., `api/raw-records`) and run Javascript `.filter()` and `.reduce()` arrays in the browser.
- **Why it's wrong:** Transferring 5,000+ full database rows over the network consumes significant bandwidth, degrades mobile performance, and completely fails to scale once data hits 50,000+ rows.
- **Do this instead:** Execute `groupBy` aggregations directly inside PostgreSQL using Prisma. Return only the aggregate results (e.g. 20 kecamatan rows containing only district name and count) to the client.

### Anti-Pattern 2: Server-Side Rendering (SSR) Leaflet Map Initialization

- **What people do:** Directly importing `import { MapContainer } from 'react-leaflet'` in standard pages or components without setting up dynamic runtime imports.
- **Why it's wrong:** The Leaflet library accesses the browser's global `window` and `document` properties during import. Since Next.js pre-renders pages on the server side, this results in a `ReferenceError: window is not defined` crash.
- **Do this instead:** Isolate Leaflet components and load them dynamically using Next.js `next/dynamic` with `ssr: false`.

### Anti-Pattern 3: Indexless Database Aggregations

- **What people do:** Creating the `RekamMedis` table without specifying database indexes, assuming 5,000 rows is small enough to perform fine.
- **Why it's wrong:** Every dashboard view will trigger full-table sequential scans in PostgreSQL to aggregate dates and kecamatan. Once the database grows to hold hundreds of thousands of sync records, dashboard query times will skyrocket.
- **Do this instead:** Define B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili` inside the Prisma schema file to enable index-only scans.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **External TPS Sync** | Batch Ingestion API / Cron | The system is read-only for public dashboard users. Data is periodically synchronized out-of-band from an external Transaction Processing System (TPS). For security, this should run via a scheduled worker or secure API endpoint updating PostgreSQL directly. |
| **GeoJSON Provider** | Bundled Local File | To ensure maximum reliability and speed, regional subdistrict GeoJSON files should be simplified and checked directly into the repository (`src/data/`) instead of being fetched from external geospatial GIS APIs. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Server Actions ↔ Client Views** | Next.js Server Actions | Server actions provide type-safe asynchronous RPC boundaries. This ensures that parameters passed (e.g. date ranges, selected disease codes) are fully typed. |
| **Map Polygons ↔ Region Detail Panel** | Client-Side State Hoisting | The Leaflet map communicates the clicked Kecamatan name to the parent component via a React state callback (`setSelectedKecamatan`). The sidebar watches this state and filters its internal displays accordingly. |

---

## Suggested Build Order

To minimize development bottlenecks and satisfy dependencies, the project should be constructed in the following order:

1. **Dockerized Environment & DB Schema (Phase 1):**
   - Configure the multi-stage `Dockerfile` and `docker-compose.yml` to orchestrate PostgreSQL 15 and Next.js.
   - Establish the `schema.prisma` file containing the `RekamMedis` model and B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili`.
   - Run the initial migrations to construct the schema in the containerized database.
2. **Mock Ingestion & Data Seed (Phase 2):**
   - Build the `prisma/seed.ts` script using `Faker.js`. 
   - Populate at least 5,000 realistic records covering Indonesian region names (matching names in GeoJSON) and a wide array of timestamps (to support trend forecasts).
   - *Dependency:* Step 1 must be complete to execute migrations prior to seeding.
3. **Data Aggregation Server layer (Phase 3):**
   - Write Server Actions inside `src/app/actions/stats.ts` to implement aggregation operations: `groupBy` kecamatan for maps, time-series counts for charts, and anomaly thresholds for early warning.
   - *Dependency:* Mock data must be seeded to verify query logic and output structures.
4. **Geospatial Visualization Page `/` (Phase 4):**
   - Implement the `MapContainer` with `react-leaflet`, importing it dynamically with `ssr: false`. Integrate local GeoJSON mapping and map case statistics to choropleth shades.
   - Attach the dynamic Region Detail sidebar that subscribes to the map selection state.
   - *Dependency:* Server Actions for regional stats must be complete.
5. **Trend Forecasting Page `/proyeksi-tren` (Phase 5):**
   - Set up Recharts in `/proyeksi-tren` page using server actions that calculate simple statistical trend forecasts. Use the dual-stroke rendering pattern (solid for history, dotted for projection).
   - *Dependency:* Data aggregation layer and time-series query structures must be online.
6. **Early Warning Dashboard `/peringatan-dini` (Phase 6):**
   - Implement the moving-average standard deviation anomaly flagging logic on the server.
   - Create alert cards for active anomalies and construct the pagination/sorting datatable for rare diseases.
   - *Dependency:* Schema validation of ICD-10 codes and data-access layers must be fully tested.
7. **Production Optimization & Build Verification (Phase 7):**
   - Run production docker builds, verify Next.js static asset generation, inspect bundle sizes, and verify that the app spins up cleanly via Docker Compose using shortcut scripts.

---
*Architecture research for: Public Health Radar (Epidemiological Early Warning System)*
*Researched: 2026-06-17*
