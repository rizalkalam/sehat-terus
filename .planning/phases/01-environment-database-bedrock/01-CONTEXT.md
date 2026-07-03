<<<<<<< HEAD
# Phase 1: Environment & Database Bedrock - Konteks

**Diperbarui:** 2026-06-23 (Diskusi Ulang - Fokus Frontend)
**Status:** Siap untuk Perencanaan

<domain>
## Batasan Fase

Membangun fondasi lingkungan pengembangan Next.js frontend, mengonfigurasi routing dasar, mengintegrasikan desain visual ambient (glassmorphism), dan mengonfigurasi hot-reloading melalui Docker Compose.
=======
# Phase 1: Environment & Database Bedrock - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establishing a containerized development environment with PostgreSQL and Next.js, setting up Prisma ORM, and configuring the base database schema with B-Tree indexes.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</domain>

<decisions>
<<<<<<< HEAD
## Keputusan Implementasi

### Manajer Paket & Node.js
- **D-01:** Menggunakan **npm** sebagai manajer paket untuk direktori `frontend/` dan `backend/`.
- **D-02:** Menggunakan Node.js v20 (Alpine LTS) sebagai base image di Dockerfile pengembangan.

### Kerangka Kerja & Dependensi Utama (Frontend)
- **D-03:** Menggunakan **Next.js 15.2.9 (App Router)** dan **React 19** untuk mempercepat rendering dan mendukung arsitektur Server Components.
- **D-04:** Menggunakan **Tailwind CSS v4** dengan konfigurasi `@theme inline` di global CSS untuk manajemen token desain secara modular.
- **D-05:** Menggunakan **react-leaflet** untuk visualisasi peta choropleth wilayah DIY/Sleman pada halaman utama.

### Desain Visual & Tipografi
- **D-06:** Mengadopsi visual bertema premium glassmorphism dengan latar belakang blur transparan, ambient gradient, dan custom scrollbar.
- **D-07:** Menggunakan font utama **Josefin Sans** (untuk heading dan antarmuka umum) dan font sekunder **Montserrat** (khusus untuk data tabular/ICD-10).

### Struktur Halaman & Routing
- **D-08:** Mendefinisikan rute antarmuka publik sebagai berikut:
  - `/` -> Dashboard Utama (GIS Map & Region Detail Panel)
  - `/proyeksi-tren` -> Halaman Prediksi & Line Chart (Recharts)
  - `/peringatan-dini` -> Halaman Deteksi Anomali & Mitigasi Tugas

### Pengembangan Lokal dengan Docker
- **D-09:** Menggunakan volume mounting lokal pada container `frontend` agar perubahan kode secara langsung ter-reflect (hot-reload) di dalam kontainer pengembangan.
=======
## Implementation Decisions

### Package Manager
- **D-01:** Use **npm** as the package manager for the project (handles dependency locks and matches default script templates).

### PostgreSQL Container Configuration
- **D-02:** Expose PostgreSQL port **5432** directly to the host machine to allow external database clients and Prisma Studio to connect easily.

### TypeScript and Linter Configuration
- **D-03:** Enable full strict TypeScript compiler checks (`strict: true`) in tsconfig.json to catch type issues early.
- **D-04:** Use standard Next.js ESLint linting configuration without custom strict rules to prevent build blocks for minor warnings during development.

### the agent's Discretion
- Downstream planning/executing agents have flexibility over specific multi-stage Dockerfile configurations and the precise Next.js App Router folders structure, provided standard conventions and requirements are followed.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</decisions>

<canonical_refs>
<<<<<<< HEAD
## Referensi Kanonik

### Dokumen Definisi Proyek
- `.planning/PROJECT.md` — Lingkup proyek, kendala teknologi, dan keputusan kunci.
- `.planning/REQUIREMENTS.md` — Pemetaan persyaratan fungsional (UI dan API).
- `.planning/ROADMAP.md` — Detail rencana per fase dan kriteria keberhasilan.
- `.planning/INDEX.md` — Peta dokumen dan kesehatan referensi pengetahuan.
=======
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definitions
- `.planning/PROJECT.md` — Core value, constraints, active requirements, and key decisions.
- `.planning/REQUIREMENTS.md` — All v1 and v2 requirements, exclusions, and traceability mappings.
- `.planning/ROADMAP.md` — Decomposes requirements into 4 phases and sets phase-specific success criteria.

### Specs & Requirements
- `.planning/research/PRD.md` — The original project Product Requirement Document (PRD).

### Domain Research
- `.planning/research/SUMMARY.md` — Informs tech choices, expected features, component boundaries, and phase ordering.
- `.planning/research/STACK.md` — Detailed research on stable 2026 stack choices (Next.js 15.2.x, React 19, react-leaflet 5, Recharts 3.8.1).
- `.planning/research/FEATURES.md` — Detailed features matrix (table stakes, differentiators, out-of-scope).
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow pipelines, and build order.
- `.planning/research/PITFALLS.md` — Critical pitfalls (Leaflet SSR dynamic import, population density mapping normalization, subdistrict name mismatches).
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</canonical_refs>

<code_context>
<<<<<<< HEAD
## Wawasan Kode yang Ada

- Direktori `frontend/` telah dibuat dengan konfigurasi Dockerfile multi-stage, `package.json`, dan file halaman awal.
- Struktur tata letak (`layout.tsx`) dan sidebar (`Sidebar.tsx`) telah terpasang dengan visual gradien ambient teal.
- Halaman dashboard (`page.tsx`) telah di-mock dengan representasi visual SVG dari peta Sleman/DIY untuk interaktivitas awal.
=======
## Existing Code Insights

### Reusable Assets
- None (Greenfield project starting from scratch).

### Established Patterns
- None (Greenfield project starting from scratch).

### Integration Points
- None (Greenfield project starting from scratch).
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</code_context>

<specifics>
<<<<<<< HEAD
## Ide Spesifik

- Visualisasi peta Leaflet akan menggunakan GeoJSON lokal Sleman (DIY) yang dimuat secara dinamis.
- Komponen `ActivePatientsCard` telah diekstrak agar dapat digunakan kembali (reusable).
=======
## Specific Ideas

- No specific requirements – open to standard approaches.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</specifics>

<deferred>
<<<<<<< HEAD
## Ide yang Ditangguhkan

- Migrasi database / integrasi API backend riil (ditangguhkan ke Fase 3).
- Implementasi sistem forecasting Z-score sisi klien (ditangguhkan ke Fase 4).
=======
## Deferred Ideas

- None – discussion stayed within phase scope.
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8

</deferred>

---
<<<<<<< HEAD
*Fase: 1-Environment & Database Bedrock*
*Konteks diperbarui: 2026-06-23 (Diskusi Ulang)*
=======

*Phase: 1-Environment & Database Bedrock*
*Context gathered: 2026-06-17*
>>>>>>> 5e06b1996e0743755c7783916dbef93a956a0aa8
