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
- [x] **Phase 5: TPS — Pencatatan Kunjungan Pasien** — Backend TPS API agar staf klinik bisa input data kunjungan yang terlacak ke faskes + pengguna.
- [x] **Phase 6: MIS Dashboard Integration** — Sambungkan komponen dashboard yang masih hardcoded ke endpoint API real.
- [x] **Phase 7: Early Warning System (EWS)** — Endpoint alert, Z-score detection engine, halaman /peringatan-dini dari data real.
- [x] **Phase 8: Forecasting & Proyeksi** — Double exponential smoothing, endpoint forecasting, halaman /proyeksi-tren dari data real.
- [x] **Phase 9: Logistik & Pengadaan** — Endpoint stok, near-expiry, slow-moving, surat pesanan, halaman /logistik dari data real. *(sebagian endpoint GET sudah ada lebih awal lewat merge 2026-07-03, lihat detail Phase 9 di bawah)*
- [x] **Phase 10: Profile & Settings** — Edit profil pengguna, PUT /api/pengguna/profile, halaman /settings dari data real.

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

### ✅ Phase 6: MIS Dashboard Integration
**Selesai:** 2026-07-02
**Goal:** Semua komponen dashboard yang masih hardcoded/mock diganti ke data API real.

Plans:
- [x] 06-01: Sambungkan tabel penyakit + donut chart + stat cards → `GET /api/cases/summary`
- [x] 06-02: Sambungkan `/proyeksi-tren` → `GET /api/cases/temporal` (chart saja; stat cards & alert cards proyeksi tetap pending, butuh Phase 8)
- [x] 06-03: Sambungkan AuthContext logout → `POST /api/auth/logout` (F02), load profil → `GET /api/auth/me` (F03) — sekaligus perbaiki bug logout yang gagal hapus cookie httpOnly `st_auth`

---

### ✅ Phase 7: Early Warning System (EWS)
**Selesai:** 2026-07-02
**Goal:** Alert aktif bisa dibaca dari DB, Z-score detection engine berjalan, halaman /peringatan-dini dari data real.

Plans:
- [x] 07-01: Endpoint `GET /api/alerts`, `GET /api/alerts/:id`, `GET /api/alerts/stats`, `GET /api/alerts/summary`
- [x] 07-02: Endpoint `PATCH /api/alerts/:id` (tangani/selesai) + `POST /api/stok/realokasi` + `POST /api/stok/retur`
- [x] 07-03: Z-score detection engine (`POST /api/alerts/detect`) + sambungkan halaman /peringatan-dini ke API (stat cards, AI banner, list, modal, tangani/selesai — "Tindakan Darurat" & chart tetap hardcoded, butuh Phase 9)

---

### ✅ Phase 8: Forecasting & Proyeksi
**Selesai:** 2026-07-07
**Goal:** Proyeksi 14-30 hari ke depan dari double exponential smoothing, halaman /proyeksi-tren dari data real.

Plans:
- [x] 08-01: Endpoint `GET /api/forecasting/projection` — historis+proyeksi mingguan langsung dari `RekamMedis` (bukan `prediksi_kebutuhan` — schema tabel itu untuk kebutuhan obat per faskes Phase 9, bukan proyeksi kasus; lihat [[DECISIONS#ADR-011]])
- [x] 08-02: Endpoint `GET /api/forecasting/stats` + `GET /api/forecasting/alerts`
- [x] 08-03: Algoritma Holt's linear trend (double exponential smoothing, alpha/beta fitted via grid search) + sambungkan halaman /proyeksi-tren ke API (stat cards, chart dengan garis putus-putus untuk proyeksi, alert cards)

> [!note] Keputusan implementasi (deviasi dari draft awal API-SPEC.md)
> - Granularitas **mingguan**, bukan bulanan — `REQUIREMENTS.md` ANL-01 minta horizon 14-30 hari
>   dengan garis tren putus-putus, terlalu presisi untuk bucket bulanan.
>   Minggu yang sedang berjalan (belum penuh 7 hari) dikeluarkan dari data historis supaya tidak
>   jadi penurunan palsu di akhir seri.
> - `rekomendasi_obat` (F23) diambil dari riwayat `resep_item` nyata (join `RekamMedis`→`resep`→
>   `resep_item`), fallback ke `alert_ews.obat_terdampak_id`, atau array kosong — tidak ada
>   pemetaan penyakit→obat yang difabrikasi (konsisten dengan keputusan Phase 7 di `/alerts/detect`).
>   `seedAll.ts` ditambah beberapa baris `resep`/`resep_item` contoh (satu per penyakit utama) agar
>   fallback ini punya sinyal nyata untuk diuji — sebelumnya DB cuma punya 1 resep manual.
> - Stat card caption diganti dari klaim spesifik yang tidak bisa diturunkan dari data
>   ("Terbanyak di Sleman", "Kampanye Sanitasi Berhasil") jadi caption generik ("Proyeksi minggu
>   depan"). `penurunan_terbesar` bisa `null` kalau tidak ada tren menurun saat itu.

**Verifikasi end-to-end:** curl ketiga endpoint langsung (nilai persen_change & rekomendasi_obat
dicek masuk akal), `npm run test:tps` tetap 100% lulus, Playwright login manajer → `/proyeksi-tren`
→ screenshot stat cards/chart (garis putus-putus proyeksi terlihat menyambung dari titik historis
terakhir)/alert cards cocok dengan API, ganti dropdown penyakit di chart → data re-fetch dan
render benar, tidak ada console error di semua langkah.

---

### ✅ Phase 9: Logistik & Pengadaan
**Selesai:** 2026-07-07 (branch `feat/logistik-pengadaan`)
**Goal:** Manajemen stok, near-expiry, slow-moving, surat pesanan — semua dari data real.

Plans:
- [x] 09-01: Endpoint stok (`GET /api/logistic/{stats,defekta,near-expiry,slow-moving}`, `stok/chart` +`mode=line`)
- [x] 09-02: Endpoint surat pesanan (`GET/POST /api/logistic/surat-pesanan`)
- [x] 09-03: Sambungkan halaman /logistik ke semua endpoint stok + SP, dan sisa hardcoded `/peringatan-dini` (F17, F19)

> [!note] Backend duluan lewat merge parsial (2026-07-03), dilanjutkan Phase 9 (2026-07-07)
> `GET /api/logistic/{stok, stok/chart, stats, near-expiry, surat-pesanan}` sudah ada duluan lewat
> merge selektif dari branch teman (`feat/disease-api-integration`), bukan dari eksekusi Plan
> 09-01/09-02 formal. Prefix-nya **tetap** `/api/logistic/*`, bukan `/api/stok/*` seperti draft
> awal — lihat [[DECISIONS#ADR-010]]. Phase 9 (2026-07-07) menambahkan yang masih kosong:
> `defekta`, `slow-moving`, `POST surat-pesanan`, perbaikan `getStats`/`getStokChart`, kolom baru
> `obat.pbf_id`, riwayat `pergerakan_stok` sintetis, dan seluruh 09-03 (FE `/logistik` + sisa
> `/peringatan-dini`) — lihat [[DECISIONS#ADR-011]] dan [[CHANGELOG]] untuk detail lengkap.

**Verifikasi end-to-end:** curl semua endpoint baru, `npm run test:tps` 100% lulus tiap rebuild,
Playwright login manajer → `/logistik` (2 tab) + `/peringatan-dini` → screenshot semua bagian
data real → eksekusi nyata "Buat Pesanan" (SP tercatat di DB) + "Tanda retur" (stok berkurang
nyata di DB) → data uji dibersihkan, tidak ada console error.

---

### ✅ Phase 10: Profile & Settings
**Selesai:** 2026-07-08 (branch `feat/profile-settings`)
**Goal:** Pengguna bisa edit profil sendiri, halaman /settings dari data real.

Plans:
- [x] 10-01: Endpoint `PUT /api/pengguna/profile` — kolom baru `telepon`/`alamat`/`updated_at` di `Pengguna`, `GET /api/auth/me` diperluas (nomor_sipa, telepon, alamat, faskes)
- [x] 10-02: Sambungkan halaman /settings → `GET /api/auth/me` (F35) + `PUT /api/pengguna/profile` (F36) — mockup lama (nickname/city/district/village/postcode/street) dibuang, diganti field nyata

> [!note] Keputusan implementasi — lihat [[DECISIONS#ADR-013]] untuk detail lengkap
> `telepon`/`alamat` ditambahkan via `sequelize.sync({ alter: true })` (pola sama ADR-002/ADR-012).
> `updated_at` **tidak** pakai opsi otomatis `updatedAt` Sequelize — `alter: true` gagal karena
> Postgres menolak `NOT NULL` tanpa default untuk baris seed yang sudah ada; diganti kolom nullable
> yang di-set manual di controller. Avatar upload tetap dekoratif, di luar scope.

**Verifikasi end-to-end:** curl `GET /api/auth/me` + `PUT /api/pengguna/profile` (sukses, validasi
nama kosong → 400, tanpa auth → 401); backend+frontend Docker di-rebuild, `npm run seed:all`
dijalankan ulang untuk apply alter table; Playwright (diinstal on-the-fly, sesi ini tidak punya
MCP browser tool) login manajer → `/settings` → data real termuat → edit → simpan → reload →
persisten → probe nama kosong → error benar → data dikembalikan ke nilai seed via UI.

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
| 6. MIS Dashboard Integration | 3/3 | ✅ Selesai | 2026-07-02 |
| 7. Early Warning System | 3/3 | ✅ Selesai | 2026-07-02 |
| 8. Forecasting & Proyeksi | 3/3 | ✅ Selesai | 2026-07-07 |
| 9. Logistik & Pengadaan | 3/3 | ✅ Selesai | 2026-07-07 |
| 10. Profile & Settings | 2/2 | ✅ Selesai | 2026-07-08 |
| **Total** | **31/31** | **100%** | |

```
Progress keseluruhan:
Phase 1-10 (selesai)  ████████████████████  100%
```

---

*Diperbarui 2026-07-08 — Phase 10 (Profile & Settings, branch `feat/profile-settings`) selesai penuh. Semua 10 phase milestone v1.0 selesai.*
