---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 8 (feat/forecasting-proyeksi) and Phase 9 (feat/logistik-pengadaan) reconciled into merge-feat-dashboard; Phase 10 pending
last_updated: "2026-07-08T00:00:00.000Z"
last_activity: 2026-07-08 -- Merged feat/forecasting-proyeksi and feat/logistik-pengadaan into merge-feat-dashboard, resolved .planning/*.md conflicts
progress:
  total_phases: 10
  completed_phases: 9
  total_plans: 31
  completed_plans: 29
  percent: 94
---

# Project State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Menyediakan early warning spasial dan temporal untuk wabah penyakit berbasis data yang dapat dipertanggungjawabkan per faskes.
**Current focus:** Phase 10 — Profile & Settings (Phase 8 & 9 sudah direkonsiliasi ke `merge-feat-dashboard`)

---

## Current Position

**Phase:** 08 & 09 — SELESAI, direkonsiliasi ke `merge-feat-dashboard` pada 2026-07-08
**Plan:** Phase 8: 3 of 3 · Phase 9: 3 of 3 (setara — dikerjakan sebagai satu sesi, bukan 3 plan formal terpisah)
**Status:** Phase 8 (Forecasting & Proyeksi, branch `feat/forecasting-proyeksi`) dan Phase 9 (Logistik & Pengadaan, branch `feat/logistik-pengadaan`) selesai penuh secara paralel pada 2026-07-07, masing-masing diverifikasi penuh (curl, `npm run test:tps`, Playwright end-to-end). Kedua branch direkonsiliasi ke `merge-feat-dashboard` pada 2026-07-08 — konflik di `.planning/*.md` (API-SPEC, CHANGELOG, DECISIONS, FEATURES-MAP, ROADMAP, STATE) diselesaikan manual; `ADR-011` (Phase 9, pbf_id/pergerakan_stok) di-renumber jadi `ADR-012` karena bentrok nomor dengan `ADR-011` (Phase 8, forecasting). Tidak ada konflik kode (`seedAll.ts` auto-merge bersih). Siap mulai Phase 10.

Progress: `[███████████████████░]` 94% (29/31 plan)

---

## Apa yang Sudah Selesai (Phase 1–9)

| Phase | Yang Dibangun | Tanggal |
|-------|--------------|---------|
| 1 | Monorepo scaffold, Docker Compose, Sequelize connect PostgreSQL | 2026-06-21 |
| 2 | Seeder 5.500 rekam_medis (Faker.js), validasi GeoJSON 17 kecamatan Sleman | 2026-06-22 |
| 3 | Endpoint `/api/cases/spatial`, `/temporal`, `/region/:name` — choropleth Leaflet + region detail panel + tren chart | 2026-06-24 |
| 4 | JWT auth (login/logout/me), 16 Sequelize models, seedAll.ts idempotent, frontend auth integration, dashboard restructure + UI polish | 2026-06-30 |
| 5 | Database schema update (`dicatat_oleh`), lookup reference endpoints, CRUD Kunjungan, Resep & Stock FEFO deduction in DB transaction, MIS summary endpoint, test suite | 2026-07-02 |
| 6 | Dashboard (tabel/donut/stat card) → `/api/cases/summary`, chart `/proyeksi-tren` → `/api/cases/temporal`, AuthContext logout/profil real via `/api/auth/logout` & `/me` | 2026-07-02 |
| 7 | Alert EWS API (7 endpoint) + Z-score detection engine + `/peringatan-dini` disambungkan penuh (stat cards, AI banner, list, modal, tangani/selesai) | 2026-07-02 |
| 8 | Forecasting API (3 endpoint, Holt's linear trend/double exp. smoothing dihitung on-the-fly dari `RekamMedis`) + `/proyeksi-tren` disambungkan penuh (chart dengan garis putus-putus proyeksi, stat cards, alert cards rekomendasi obat) | 2026-07-07 |
| 9 | Logistik API (`defekta`, `slow-moving`, `POST surat-pesanan`, `stats`/`stok/chart` diperbaiki) + `obat.pbf_id` baru + riwayat `pergerakan_stok` sintetis + `/logistik` & sisa `/peringatan-dini` (F17, F19) disambungkan penuh | 2026-07-07 |

---

## Phase 8 — Selesai Penuh (3/3 Plan)

**Goal:** Proyeksi 14-30 hari ke depan dari double exponential smoothing, halaman `/proyeksi-tren` dari data real.

| Endpoint / Fitur | Deskripsi | Status |
|----------|-------|--------|
| `GET /api/forecasting/projection` | F21 — historis+proyeksi kasus mingguan per penyakit | ✅ Selesai, FE tersambung |
| `GET /api/forecasting/stats` | F22 — 3 stat card proyeksi | ✅ Selesai, FE tersambung |
| `GET /api/forecasting/alerts` | F23 — maks. 3 alert card rekomendasi obat | ✅ Selesai, FE tersambung |
| `backend/src/utils/holtSmoothing.ts` | F20 — Holt's linear trend, alpha/beta fitted via grid search | ✅ Selesai |

> [!note] Keputusan implementasi (lihat [[DECISIONS#ADR-011]] untuk detail lengkap)
> - **`prediksi_kebutuhan` tidak dipakai** — schema-nya `obat_id`+`faskes_id`+`jumlah_prediksi`
>   (kebutuhan obat per faskes, Phase 9), bukan proyeksi kasus penyakit. Proyeksi dihitung
>   on-the-fly dari `RekamMedis` tiap request.
> - **Granularitas mingguan**, bukan bulanan seperti draft awal `API-SPEC.md` — `REQUIREMENTS.md`
>   ANL-01 minta horizon 14-30 hari dengan garis putus-putus, terlalu presisi untuk bucket bulanan.
>   Minggu yang sedang berjalan (belum penuh 7 hari) dikeluarkan dari data historis.
> - **`rekomendasi_obat` (F23)** dari riwayat `resep_item` nyata, fallback ke
>   `alert_ews.obat_terdampak_id`, atau array kosong — tidak ada pemetaan penyakit→obat fabrikasi.
>   `seedAll.ts` ditambah beberapa baris `resep`/`resep_item` contoh (satu per penyakit utama)
>   supaya fallback ini punya sinyal nyata — sebelumnya DB cuma punya 1 resep manual.
> - **Stat card caption** diganti dari klaim spesifik tak berdasar data ("Terbanyak di Sleman")
>   jadi caption generik ("Proyeksi minggu depan"). `penurunan_terbesar` bisa `null`.

**Verifikasi end-to-end:**
- curl ketiga endpoint langsung — nilai persen_change & rekomendasi_obat masuk akal (mis. Diare
  → Oralit Sachet, Flu → Paracetamol, Hipertensi → Amlodipine, semua dari resep seed nyata)
- `npm run test:tps` di-re-run setelah rebuild backend — 100% lulus, tidak ada regresi
- Playwright: login manajer → `/proyeksi-tren` → screenshot stat cards (nilai real, bukan
  hardcoded) + chart (garis solid historis menyambung mulus ke garis putus-putus proyeksi) +
  alert cards (3 kartu dengan urgensi/rekomendasi obat real) → ganti dropdown penyakit di chart
  ke "Diare & Gastroenteritis" → chart re-fetch dan render benar — tidak ada console error di
  semua langkah

---

## Phase 9 — Selesai Penuh

**Goal:** Endpoint stok/logistik yang tersisa (defekta, slow-moving, buat SP) dibangun, dan
`/logistik` + sisa hardcoded `/peringatan-dini` (F17, F19) disambungkan ke data real.

| Endpoint / Fitur | Deskripsi | Status |
|----------|-------|--------|
| `GET /api/logistic/defekta` | F25 — obat di bawah minimum, dikelompokkan per (PBF, tipe) | ✅ Selesai, FE tersambung |
| `GET /api/logistic/slow-moving` | F28 — obat tak bergerak, saran realokasi/retur nyata | ✅ Selesai, FE tersambung (`/logistik` + `/peringatan-dini` F17) |
| `POST /api/logistic/surat-pesanan` | F32/F34 — buat SP, validasi npp/reguler tak boleh campur | ✅ Selesai, FE tersambung |
| `GET /api/logistic/stok/chart?mode=line` | F19 — chart stok vs kebutuhan per obat kritis | ✅ Selesai, FE tersambung (`/peringatan-dini`) |
| `GET /api/logistic/stats` (diperbaiki) | F26 — ketahanan pakai rata-rata pemakaian nyata | ✅ Selesai |
| `obat.pbf_id` (kolom baru) | Fondasi grouping defekta per PBF | ✅ Selesai |

> [!note] Keputusan implementasi — lihat [[DECISIONS#ADR-012]] untuk detail lengkap
> - `obat.pbf_id` ditambahkan via `sequelize.sync({ alter: true })` — skema asli tidak punya
>   pemasok tetap per obat, cuma per Surat Pesanan.
> - Defekta dikelompokkan per **(pbf_id, tipe)**, bukan cuma pbf_id — item npp wajib SP terpisah.
> - `seedAll.ts` ditambah ~150 baris riwayat `pergerakan_stok` 'keluar' sintetis (45 hari) untuk
>   obat fast/medium-mover — sebelumnya nyaris tidak ada data 'keluar' nyata untuk menghitung
>   tren_harian/ketahanan_hari secara berarti.
> - `sp_item` tidak punya kolom harga — `harga_satuan` di response `POST` dihitung dari
>   `obat.harga_beli` saat itu.
> - `GET /api/logistic/summary` (AiBanner `/logistik`) **tidak dikerjakan** — di luar scope.

**Verifikasi end-to-end:**
- curl semua endpoint baru langsung — nilai tren_harian/usulan_pesanan/saran masuk akal
- `npm run test:tps` di-re-run tiap rebuild backend — 100% lulus, tidak ada regresi
- Playwright: login manajer → `/logistik` (tab Pengadaan + Dead-stock) dan `/peringatan-dini` →
  screenshot semua bagian dengan data real → eksekusi nyata "Buat Pesanan" (SP baru tercatat di
  DB, dihapus lagi setelah verifikasi) dan "Tanda retur" (stok Vitamin C 250→0, dikembalikan lagi
  setelah verifikasi) → tidak ada console error

> [!success] Bug ditemukan & diperbaiki saat verifikasi Playwright
> Percobaan "Buat Pesanan" untuk grup npp sebagai manajer (bukan apoteker) kena 403 dari backend
> (benar — validasi bekerja), tapi FE tidak menunjukkan apa-apa ke user karena `fetch()` tidak
> reject di respons 4xx/5xx. Diperbaiki dengan helper `postJson()` baru (`frontend/src/lib/api.ts`)
> yang cek `res.ok` dan `alert()` pesan error kalau gagal, dipakai di semua 5 titik POST aksi.

---

## Phase 7 — Selesai Penuh (3/3 Plan)

**Goal:** Alert EWS bisa dibaca, dideteksi otomatis, ditindaklanjuti, dan ditampilkan di `/peringatan-dini` lewat API real.

| Endpoint / Fitur | Deskripsi | Status |
|----------|-------|--------|
| `GET /api/alerts` | F13 — daftar alert (default status=aktif) | ✅ Selesai (07-01), FE tersambung (07-03) |
| `GET /api/alerts/:id` | F14 — detail alert + obat kritis | ✅ Selesai (07-01), FE tersambung (07-03) |
| `GET /api/alerts/stats` | F15 — 3 stat card EWS | ✅ Selesai (07-01), FE tersambung (07-03) |
| `GET /api/alerts/summary` | F16 — teks ringkasan situasi (template, bukan LLM) | ✅ Selesai (07-01), FE tersambung (07-03) |
| `PATCH /api/alerts/:id` | F18 — tandai alert "ditangani"/"selesai" | ✅ Selesai (07-02), FE tersambung (07-03) |
| `POST /api/stok/realokasi` | F17/F29 — pindah stok antar faskes | ✅ Selesai (07-02) — FE "Tindakan Darurat" tetap hardcoded, butuh Phase 9 |
| `POST /api/stok/retur` | F17/F30 — tarik stok dari peredaran | ✅ Selesai (07-02) — sama seperti realokasi |
| `POST /api/alerts/detect` | F12 — Z-score anomaly detection engine | ✅ Selesai (07-03), tanpa UI by design |

**File baru:** `backend/src/controllers/{alerts,stok}.ts`, `backend/src/routes/{alerts,stok}.ts`; frontend `app/(dashboard)/peringatan-dini/page.tsx` disambungkan penuh. **Docker backend di-rebuild 3x** (07-01, 07-02, 07-03) — semua endpoint live di container.

> [!note] Keputusan implementasi (field/desain yang tidak persis sama dengan schema/spec awal)
> - `level` (kritis/waspada): dihitung dari `persen_lonjakan >= 150%` ATAU `ketahanan_stok_jam <= 48` jam — bukan kolom tersimpan
> - `estimasi_puncak`: heuristik dari `laju_harian` (bukan model prediksi, itu Phase 8)
> - `wilayah_detail` (daftar kelurahan) **tidak diimplementasikan** di backend maupun modal FE — `wilayah` cuma granularitas kecamatan; modal tampilkan nama kecamatan saja
> - `penyebab` (dugaan penyebab) di modal FE **tidak difabrikasi** — placeholder jujur, tidak ada sumber data analisis penyebab
> - **Kolom baru `ditangani_oleh`** ditambah ke `alert_ews` via `sequelize.sync({ alter: true })` (ADR-002) — sama seperti `dicatat_oleh` di `RekamMedis` Phase 5
> - **Realokasi = 1 baris `pergerakan_stok`** (`tipe='realokasi'`, `faskes_asal`+`faskes_tujuan` di baris yang sama), bukan "2 baris keluar+masuk" seperti disebut spec awal — lihat ADR-008
> - **Z-score engine:** anomali = z-score ≥ 2 DAN kasus 7 hari ≥ 5 (batas absolut, cegah false alarm angka kecil — REQUIREMENTS.md ANL-02). Threshold **tidak configurable** dari UI (ADM-02 di luar scope MVP). Tidak mengisi `obat_terdampak_id`/`ketahanan_stok_jam`, tidak auto-resolve alert yang sudah tidak anomali.
> - **"Tindakan Darurat"** (kartu saran relokasi/retur) di `/peringatan-dini` **sengaja tetap hardcoded** — tidak ada endpoint untuk menjawab "faskes mana yang surplus?", butuh `GET /api/stok/*` Phase 9. Chart stok-vs-kebutuhan (F19) sama, masih hardcoded.

> [!success] Bug ditemukan & diperbaiki saat verifikasi Z-score engine
> Versi awal `detectAnomalies()` memakai `now`-minus-N-hari untuk batas window (jam:menit ikut
> terbawa dari `now`), sehingga loop day-walking **tidak pernah** menyentuh kalender hari ini —
> kasus hari berjalan diam-diam hilang dari perhitungan. Diverifikasi dengan menyuntik 20 kasus
> ISPA buatan di kecamatan Turi: sebelum fix cuma 8/20 terhitung, sesudah fix (normalisasi ke
> tengah-malam UTC, selaras `DATE_TRUNC('day', ...)` Postgres) 20/20 + baseline terhitung benar.
> Data uji dihapus lagi setelah verifikasi — state DB kembali ke 5 alert seed asli.

**Verifikasi end-to-end:**
- curl + query Postgres langsung: realokasi 10 Amoxicillin Klinik Sleman→Apotek Depok (74→64 asal,
  baris baru 10 di tujuan batch sama), retur 5 unit alasan "rusak" (64→59), PATCH status +
  `ditangani_oleh` terisi benar, validasi 400/401/404 semua dicek
- Playwright: `/peringatan-dini` login → screenshot stat cards/AI banner/list real data cocok
  dengan API → klik alert card → modal detail terisi data real → klik "Tangani" → `PATCH`
  terpanggil → daftar refresh otomatis dari 3 → 2 kartu (alert yang ditangani hilang dari filter
  default `status=aktif`) — tidak ada console error di semua langkah
- `npm run test:tps` di-re-run tiap rebuild backend — 100% lulus, tidak ada regresi

---

## Phase 6 — Selesai (3/3 Plan)

**Goal:** Menghubungkan dashboard manajer di frontend (tabel penyakit, donut chart, stat cards, login/logout, profil) ke endpoint API real yang sudah selesai dibangun di Phase 5.

| Task | Deskripsi | Status |
|------|-----------|--------|
| #1 | Sambungkan tabel penyakit + donut chart + stat cards → `GET /api/cases/summary` | ✅ Selesai |
| #2 | Sambungkan `/proyeksi-tren` → `GET /api/cases/temporal` | ✅ Selesai |
| #3 | Sambungkan AuthContext logout → `POST /api/auth/logout`, load profil → `GET /api/auth/me` | ✅ Selesai |

> [!success] Bug ditemukan & diperbaiki di Plan 06-03
> `AuthContext.logout()` sebelumnya cuma menghapus cookie di JS (`clearAuthCookies()`), yang
> **tidak bisa** menghapus cookie httpOnly `st_auth` — artinya sesi backend tidak pernah benar-benar
> berakhir walau UI sudah redirect ke `/login`. Sekarang `logout()` memanggil `logoutFromApi()` →
> `POST /api/auth/logout` dulu, baru clear state. Diverifikasi: cookie `st_auth` benar-benar hilang
> setelah logout, dan nav langsung ke `/` sesudahnya di-redirect balik ke `/login` oleh middleware.

---

## Kenapa Phase Berubah dari Original

Original ROADMAP.md punya 5 phase, dengan urutan:
```
Phase 4 = EWS & Forecasting
Phase 5 = Auth & Settings
```

Yang sebenarnya terjadi:
- **Auth (original Phase 5) dikerjakan duluan** di 2026-06-30 — dibutuhkan sebagai fondasi multi-user
- **EWS & Forecasting (original Phase 4) belum dikerjakan** — masuk ke Phase 7 & 8 roadmap baru
- **TPS System ditambahkan** (awalnya out of scope di PROJECT.md) — karena user ingin data rekam_medis bisa dipertanggungjawabkan ke faskes dan staf yang input
- **Phase 5 (TPS) selesai** di 2026-07-02.

---

## Pending Todos (setelah Phase 8, 9)

- **Phase 10 (berikutnya):** Settings — edit profil + halaman /settings dari data real. Belum dimulai di branch manapun. Branch baru untuk ini dibuat dari `merge-feat-dashboard` (sudah berisi Phase 8 & 9 hasil rekonsiliasi).
- **F33** (update status SP draf→disetujui→dikirim→diterima) — di luar scope Phase 9, belum ada endpoint.
- **`GET /api/logistic/summary`** (AiBanner nyata untuk `/logistik`) — di luar scope Phase 9, `AiBanner` masih pakai teks default.

---

## Blockers / Concerns

- Tidak ada blocker aktif. Bug kompilasi frontend (`registerUser` import) telah diperbaiki melalui alur Quick Task, dan semua kontainer Docker berhasil dibangun ulang serta dijalankan dengan sukses.

---

## Performance Metrics

| Phase | Plans | Durasi Total | Avg/Plan |
|-------|-------|-------------|----------|
| 1. Environment | 3/3 | 25 min | 8 min |
| 2. Seeding & GIS | 2/2 | 15 min | 7.5 min |
| 3. Core GIS | 3/3 | 40 min | 13 min |
| 4. Auth & Setup | 3/3 | ~90 min | 30 min |
| 5. TPS | 6/6 | ~45 min | 7.5 min |
| 6. MIS Dashboard Integration | 3/3 | ~40 min | ~13 min |
| 7. Early Warning System | 3/3 | ~85 min | ~28 min |
| 8. Forecasting & Proyeksi | 3/3 | ~60 min | ~20 min |
| 9. Logistik & Pengadaan | 3/3 | ~75 min | ~25 min |

---

## Quick Tasks Completed

| Task | Deskripsi | Tanggal |
|------|-----------|---------|
| `20260702-fix-frontend-register-build` | Memperbaiki import registerUser di frontend dan melakukan rebuild docker compose | 2026-07-02 |
| `20260702-responsive-trend-page` | Grid responsif untuk stat cards/chart/alert cards di `/proyeksi-tren` (breakpoint `md`/`xl`, dihitung ulang karena sidebar fixed 349px) — diverifikasi 4 lebar viewport via Playwright, lalu di-rebuild ulang ke Docker (build ke-2 yang sukses hari ini) | 2026-07-02 |
| `20260703-merge-disease-api-integration` | Merge parsial branch teman (`feat/disease-api-integration`) ke branch baru `feat/logistic-ai-integration` — ambil `POST /api/ai/analyze` + 5 endpoint `GET /api/logistic/*` (mengisi gap F24/F26/F27/F31), buang duplikat & docs usang. Lihat [[DECISIONS#ADR-010]]. | 2026-07-03 |
| `20260706-merge-admin-dashboard` | Merge selektif branch teman (`feat/admin-system-and-ai-update`, TonyKeys) ke `merge-feat-dashboard` — ambil 4 dari 6 fitur (admin dashboard layout, guard role, CRUD user, registrasi admin-only), exclude CRUD obat/stok admin & prediksi AI (jadi FA5–FA7 pending, lihat [[FEATURES-MAP#Domain 8 — Admin Panel]]). Ditambah `requireAdmin` middleware di commit terpisah setelah user minta proteksi API-level, bukan cuma UI. Sudah di-push, belum diverifikasi end-to-end di browser. | 2026-07-06 |
| `20260707-verify-admin-dashboard` | Verifikasi end-to-end di browser (Playwright) untuk merge admin dashboard sesi sebelumnya — login admin & manajer, guard redirect FA2 kedua arah, CRUD pengguna FA3 (create/edit/nonaktifkan). Ditemukan & diperbaiki bug: `updateUser` gagal total (500, invalid UUID) kalau `faskes_id` dikosongkan karena tidak ada fallback `\|\| null` seperti di `createUser`. Backend di-rebuild, `npm run test:tps` 100% lulus. | 2026-07-07 |
| `20260707-phase9-logistik-pengadaan` | Phase 9 penuh (bukan Quick Task, tapi dicatat di sini karena dikerjakan sebagai satu sesi bukan 3 Plan formal) — lihat bagian "Phase 9 — Selesai Penuh" di atas untuk detail lengkap. Branch baru `feat/logistik-pengadaan`. | 2026-07-07 |

> [!note] Observasi (bukan tindakan) — `alert_ews` dan `RekamMedis` sedikit lebih besar dari baseline
> Saat verifikasi Quick Task di atas, `alert_ews` menunjukkan 7 baris (bukan 5) dan `RekamMedis`
> 5530 baris (bukan ~5512) — 2 alert `aktif` baru (`Depok/A90`, `Turi/J06.9`) tidak berasal dari
> pekerjaan sesi ini. Kemungkinan hasil pemanggilan `POST /api/alerts/detect` secara independen.
> Tidak dihapus — tidak ada konfirmasi soal asal-usulnya, dan menghapus data tanpa konfirmasi
> melanggar prinsip kehati-hatian terhadap tindakan destruktif.

---

## Session Continuity

Last session: 2026-07-08
Stopped at: Phase 8 (Forecasting & Proyeksi, branch `feat/forecasting-proyeksi`) dan Phase 9 (Logistik & Pengadaan, branch `feat/logistik-pengadaan`) masing-masing selesai penuh secara paralel pada 2026-07-07 — lihat bagian "Phase 8 — Selesai Penuh" dan "Phase 9 — Selesai Penuh" di atas untuk detail lengkap masing-masing. Pada 2026-07-08, Phase 9 di-commit & di-push, lalu kedua branch direkonsiliasi: `feat/forecasting-proyeksi` di-merge ke `merge-feat-dashboard` (fast-forward, tanpa konflik), lalu `feat/logistik-pengadaan` di-merge (konflik di 6 dokumen `.planning/*.md` — API-SPEC, CHANGELOG, DECISIONS, FEATURES-MAP, ROADMAP, STATE — diselesaikan manual; `backend/src/seedAll.ts` auto-merge bersih tanpa konflik). `ADR-011` versi Phase 9 (pbf_id/pergerakan_stok) di-renumber jadi `ADR-012` karena bentrok nomor dengan `ADR-011` versi Phase 8 (forecasting).
Resume: Push `merge-feat-dashboard` yang sudah direkonsiliasi, lalu mulai Phase 10 (Settings) di branch baru yang di-checkout dari `merge-feat-dashboard` — endpoint `PUT /api/pengguna/profile` + sambungkan halaman `/settings` ke data real (F04, F35, F36). FA5–FA7 (CRUD obat/stok admin + prediksi AI) masih pending kalau diminta terpisah.
