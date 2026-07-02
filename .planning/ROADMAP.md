# Roadmap: Sehat Terus (Public Health Radar)

## Overview

Sehat Terus adalah sistem dua lapis: **TPS** (Transaction Processing System) untuk staf klinik mencatat kunjungan pasien, dan **MIS** (Management Information System) untuk manajer memantau tren penyakit, stok obat, dan early warning secara spasial.

Stack: Next.js 15 (frontend) · Express.js + Sequelize (backend) · PostgreSQL · Docker Compose.

---

## Catatan Perubahan Scope

> **Scope update 2026-07-02:** TPS (pencatatan kunjungan pasien oleh staf klinik) yang semula *out of scope* kini masuk ke dalam sistem agar data `rekam_medis` bisa dipertanggungjawabkan per faskes dan per staf. Phase 4 (Auth) dikerjakan lebih awal dari urutan original.

---

## Phases

- [x] **Phase 1: Environment & Database Bedrock** — Scaffold monorepo Next.js + Express + PostgreSQL + Docker Compose, Sequelize ORM setup.
- [x] **Phase 2: Mock Ingestion & GIS Mapping Validation** — Seeder 5.500 rekam medis dengan Faker.js, validasi GeoJSON kecamatan Sleman.
- [x] **Phase 3: Core GIS Visualizations** — Endpoint agregasi spasial/temporal, choropleth Leaflet, region detail panel.
- [x] **Phase 4: Authentication & Multi-user Setup** — JWT login/logout, requireAuth middleware, semua Sequelize models, seeder lengkap, dashboard restructure + polish.
- [ ] **Phase 5: TPS — Pencatatan Kunjungan Pasien** — Backend TPS API agar staf klinik bisa input data kunjungan yang terlacak ke faskes + pengguna.
- [ ] **Phase 6: MIS Dashboard Integration** — Sambungkan komponen dashboard yang masih hardcoded ke endpoint API real.
- [ ] **Phase 7: Early Warning System (EWS)** — Endpoint alert, Z-score detection engine, halaman /peringatan-dini dari data real.
- [ ] **Phase 8: Forecasting & Proyeksi** — Double exponential smoothing, endpoint forecasting, halaman /proyeksi-tren dari data real.
- [ ] **Phase 9: Logistik & Pengadaan** — Endpoint stok, near-expiry, slow-moving, surat pesanan, halaman /logistik dari data real.
- [ ] **Phase 10: Profile & Settings** — Edit profil pengguna, PUT /api/pengguna/profile, halaman /settings dari data real.

---

## Phase Details

### ✅ Phase 1: Environment & Database Bedrock
**Selesai:** 2026-06-21
**Goal:** Monorepo siap jalan, Sequelize connect ke PostgreSQL, Docker Compose berjalan.

Plans:
- [x] 01-01: Scaffold Next.js + Tailwind + TypeScript
- [x] 01-02: Scaffold Express.js + Sequelize + TypeScript
- [x] 01-03: Docker Compose + PostgreSQL + koneksi end-to-end

---

### ✅ Phase 2: Mock Ingestion & GIS Mapping Validation
**Selesai:** 2026-06-22
**Goal:** 5.000+ rekam medis di DB, nama kecamatan cocok dengan GeoJSON.

Plans:
- [x] 02-01: Validasi GeoJSON kecamatan Sleman
- [x] 02-02: Seeder Faker.js (5.500 rekam_medis)

---

### ✅ Phase 3: Core GIS Visualizations
**Selesai:** 2026-06-24
**Goal:** Peta choropleth + region detail + tren temporal dari API real.

Plans:
- [x] 03-01: Endpoint agregasi backend (`/api/cases/spatial`, `/temporal`, `/region/:name`)
- [x] 03-02: Choropleth map Leaflet di frontend
- [x] 03-03: Region detail panel + time-series chart dengan filter

---

### ✅ Phase 4: Authentication & Multi-user Setup
**Selesai:** 2026-06-30 *(dikerjakan sebelum Phase 4 original — EWS)*
**Goal:** JWT auth, semua Sequelize models, seeder lengkap, dashboard restructure.

Plans:
- [x] 04-01: Backend JWT auth (`/api/auth/login`, `/logout`, `/me`) + requireAuth middleware
- [x] 04-02: Semua Sequelize models (16 tabel) + seedAll.ts idempotent
- [x] 04-03: Frontend auth integration + dashboard restructure + UI polish

---

### ✅ Phase 5: TPS — Pencatatan Kunjungan Pasien
**Selesai:** 2026-07-02
**Goal:** Staf klinik dari cabang manapun bisa input kunjungan pasien via API. Setiap record terlacak ke faskes dan pengguna yang menginput.

**Kenapa phase ini penting:** Data `rekam_medis` sekarang 100% dari seeder (faker). Agar MIS dashboard bisa dipertanggungjawabkan, data harus dari input nyata staf klinik.

Plans:
- [x] 05-01: Tambah kolom `dicatat_oleh` ke model `RekamMedis` (fondasi akuntabilitas)
- [x] 05-02: Update seedAll.ts — isi `faskes_id` + `dicatat_oleh` di rekam_medis dummy
- [x] 05-03: Endpoint referensi TPS (`/api/tps/referensi/wilayah`, `/penyakit`, `/obat`, `/formula`)
- [x] 05-04: Endpoint CRUD kunjungan (`POST/GET/PUT/DELETE /api/tps/kunjungan`)
- [x] 05-05: Endpoint resep + potong stok (`POST /api/tps/kunjungan/:id/resep`) — pakai DB transaction
- [x] 05-06: Endpoint MIS `/api/cases/summary` (stat cards + donut + tabel penyakit dari data real)

**Spec:** `.planning/TPS-API-SPEC.md`

---

### 🔜 Phase 6: MIS Dashboard Integration
**Status:** Pending
**Goal:** Semua komponen dashboard yang masih hardcoded/mock diganti ke data API real.

Plans:
- [ ] 06-01: Sambungkan tabel penyakit + donut chart + stat cards → `GET /api/cases/summary`
- [ ] 06-02: Sambungkan `/proyeksi-tren` → `GET /api/cases/temporal` (F08 integrasi pending)
- [ ] 06-03: Sambungkan AuthContext logout → `POST /api/auth/logout` (F02), load profil → `GET /api/auth/me` (F03)

---

### 🔜 Phase 7: Early Warning System (EWS)
**Status:** Pending
**Goal:** Alert aktif bisa dibaca dari DB, Z-score detection engine berjalan, halaman /peringatan-dini dari data real.

Plans:
- [ ] 07-01: Endpoint `GET /api/alerts`, `GET /api/alerts/:id`, `GET /api/alerts/stats`, `GET /api/alerts/summary`
- [ ] 07-02: Endpoint `PATCH /api/alerts/:id` (tangani/selesai) + `POST /api/stok/realokasi` + `POST /api/stok/retur`
- [ ] 07-03: Z-score detection engine (`POST /api/alerts/detect`) + sambungkan halaman /peringatan-dini ke API

---

### 🔜 Phase 8: Forecasting & Proyeksi
**Status:** Pending
**Goal:** Proyeksi 14-30 hari ke depan dari double exponential smoothing, halaman /proyeksi-tren dari data real.

Plans:
- [ ] 08-01: Endpoint `GET /api/forecasting/projection` — gabungkan historis `rekam_medis` + tabel `prediksi_kebutuhan`
- [ ] 08-02: Endpoint `GET /api/forecasting/stats` + `GET /api/forecasting/alerts`
- [ ] 08-03: Algoritma double exponential smoothing + sambungkan halaman /proyeksi-tren ke API

---

### 🔜 Phase 9: Logistik & Pengadaan
**Status:** Pending
**Goal:** Manajemen stok, near-expiry, slow-moving, surat pesanan — semua dari data real.

Plans:
- [ ] 09-01: Endpoint stok (`GET /api/stok/stats`, `/chart`, `/defekta`, `/near-expiry`, `/slow-moving`)
- [ ] 09-02: Endpoint surat pesanan (`GET/POST /api/surat-pesanan`)
- [ ] 09-03: Sambungkan halaman /logistik ke semua endpoint stok + SP

---

### 🔜 Phase 10: Profile & Settings
**Status:** Pending
**Goal:** Pengguna bisa edit profil sendiri, halaman /settings dari data real.

Plans:
- [ ] 10-01: Endpoint `PUT /api/pengguna/profile`
- [ ] 10-02: Sambungkan halaman /settings → `GET /api/auth/me` (F35) + `PUT /api/pengguna/profile` (F36)

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans | Status | Selesai |
|-------|-------|--------|---------|
| 1. Environment & Database Bedrock | 3/3 | ✅ Selesai | 2026-06-21 |
| 2. Mock Ingestion & GIS Mapping | 2/2 | ✅ Selesai | 2026-06-22 |
| 3. Core GIS Visualizations | 3/3 | ✅ Selesai | 2026-06-24 |
| 4. Authentication & Multi-user Setup | 3/3 | ✅ Selesai | 2026-06-30 |
| 5. TPS — Pencatatan Kunjungan | 6/6 | ✅ Selesai | 2026-07-02 |
| 6. MIS Dashboard Integration | 0/3 | 🔄 In Progress | — |
| 7. Early Warning System | 0/3 | 🔜 Pending | — |
| 8. Forecasting & Proyeksi | 0/3 | 🔜 Pending | — |
| 9. Logistik & Pengadaan | 0/3 | 🔜 Pending | — |
| 10. Profile & Settings | 0/2 | 🔜 Pending | — |
| **Total** | **18/28** | **64%** | |

```
Progress keseluruhan:
Phase 1-5 (selesai)  ████████████░░░░░░░░  64%
Phase 6   (jalan)    ░░░░░░░░░░░░░░░░░░░░   0%  ← posisi sekarang
Phase 7-10 (pending) ░░░░░░░░░░░░░░░░░░░░  36%
```

---

*Diperbarui 2026-07-02 — scope update: TPS system ditambahkan, Phase 4 (Auth) dikerjakan di luar urutan*
