# Requirements: Sehat Terus (Public Health Radar)

**Defined:** 2026-06-17
**Core Value:** To provide clear, automated spatial and temporal early warnings for disease outbreaks without administrative overhead.

## v1 Requirements

### GIS Map UI (MAP)

- [ ] **MAP-01**: User can view an interactive choropleth map rendering case densities of Yogyakarta/Jakarta sub-districts using Leaflet and local GeoJSON.
- [ ] **MAP-02**: User can view a dynamic Region Detail Panel displaying sub-district population, raw case numbers, and normalized incidence rate per 10,000 residents upon selecting a region.
- [ ] **MAP-03**: User can view a historical trends chart using a Recharts Line Chart with filters for date range and disease types.

### Backend API (API)

- [ ] **API-01**: Developer can build and run Next.js and PostgreSQL containers seamlessly using a multi-stage Dockerfile and Docker Compose.
- [ ] **API-02**: Database schema implements a single-table `RekamMedis` model in Prisma with B-Tree indexes on `tanggal_kunjungan` and `kecamatan_domisili` for optimal performance.
- [ ] **API-03**: Application uses high-performance API endpoints and Server Actions to run database-level spatial and temporal groupings for charts and maps.

### Seeding (SEED)

- [ ] **SEED-01**: CLI seed script inserts at least 5,000 realistic clinical records containing valid visit dates, ICD-10 codes, and Indonesian sub-districts.
- [ ] **SEED-02**: The seeded sub-district names match the keys in the local GeoJSON data, and coordinates map to valid Indonesian regions.

### Analytics (ANL)

- [ ] **ANL-01**: User can view a Recharts Line Chart with historical and predicted dotted trend lines projecting cases 14–30 days in advance.
- [ ] **ANL-02**: System automatically flags statistical anomalies (Z-score calculation) as "Siaga" or "Aman" on the early warning dashboard, applying baseline absolute thresholds to prevent false alarms.
- [ ] **ANL-03**: User can view a datatable listing rare and dangerous diseases to track single occurrences of severe infections.

## v2 Requirements

### Advanced Features

- **ANL-04**: User can view a cross-disease correlation matrix displaying Pearson correlation coefficients between different disease categories.

## Out of Scope

| Feature | Reason |
|---------|--------|
| User Authentication | The surveillance dashboard is fully public-facing and read-only. |
| CRUD Patient Records Data Entry Forms | The system assumes data is synced directly from external TPS databases. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 3 | Pending |
| MAP-02 | Phase 3 | Pending |
| MAP-03 | Phase 3 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 3 | Pending |
| SEED-01 | Phase 2 | Pending |
| SEED-02 | Phase 2 | Pending |
| ANL-01 | Phase 4 | Pending |
| ANL-02 | Phase 4 | Pending |
| ANL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-06-17*
*Last updated: 2026-06-17 after initial definition*
