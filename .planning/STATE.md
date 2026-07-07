---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 9 completed in full on branch feat/logistik-pengadaan; Phase 8 completed in parallel on branch feat/forecasting-proyeksi (not yet merged here); Phase 10 pending
last_updated: "2026-07-07T00:00:00.000Z"
last_activity: 2026-07-07 -- Phase 9 (Logistik & Pengadaan) executed end-to-end
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 28
  completed_plans: 27
  percent: 96
---

# Project State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Menyediakan early warning spasial dan temporal untuk wabah penyakit berbasis data yang dapat dipertanggungjawabkan per faskes.
**Current focus:** Phase 10 — Profile & Settings (setelah Phase 8 & 9 di-merge ke branch bersama)

---

## Current Position

**Phase:** 09 (logistik-pengadaan) — SELESAI di branch `feat/logistik-pengadaan`
**Plan:** 3 of 3 (setara — dikerjakan sebagai satu sesi, bukan 3 plan formal terpisah)
**Status:** Phase 9 (Logistik & Pengadaan) selesai penuh pada 2026-07-07, diverifikasi (curl, `npm run test:tps`, Playwright end-to-end termasuk eksekusi nyata "Buat Pesanan" & "Tanda retur"). **Catatan penting:** Phase 8 (Forecasting) dikerjakan paralel di branch terpisah `feat/forecasting-proyeksi` dan belum di-merge ke branch ini — dokumen ini (STATE/FEATURES-MAP/API-SPEC) mencerminkan histori branch `feat/logistik-pengadaan` yang di-branch dari `merge-feat-dashboard` **sebelum** Phase 8 selesai. Kedua branch perlu direkonsiliasi (merge berurutan, expect conflict di dokumen `.planning/*.md`) sebelum lanjut Phase 10.

Progress: `[███████████████████░]` 96% (27/28 plan — 24 sebelumnya + Phase 9; Phase 8 di branch lain akan menambah hitungan lagi setelah merge)

---

## Apa yang Sudah Selesai (Phase 1–7, 9 — lihat catatan Phase 8 di atas)

| Phase | Yang Dibangun | Tanggal |
|-------|--------------|---------|
| 1 | Monorepo scaffold, Docker Compose, Sequelize connect PostgreSQL | 2026-06-21 |
| 2 | Seeder 5.500 rekam_medis (Faker.js), validasi GeoJSON 17 kecamatan Sleman | 2026-06-22 |
| 3 | Endpoint `/api/cases/spatial`, `/temporal`, `/region/:name` — choropleth Leaflet + region detail panel + tren chart | 2026-06-24 |
| 4 | JWT auth (login/logout/me), 16 Sequelize models, seedAll.ts idempotent, frontend auth integration, dashboard restructure + UI polish | 2026-06-30 |
| 5 | Database schema update (`dicatat_oleh`), lookup reference endpoints, CRUD Kunjungan, Resep & Stock FEFO deduction in DB transaction, MIS summary endpoint, test suite | 2026-07-02 |
| 6 | Dashboard (tabel/donut/stat card) → `/api/cases/summary`, chart `/proyeksi-tren` → `/api/cases/temporal`, AuthContext logout/profil real via `/api/auth/logout` & `/me` | 2026-07-02 |
| 7 | Alert EWS API (7 endpoint) + Z-score detection engine + `/peringatan-dini` disambungkan penuh (stat cards, AI banner, list, modal, tangani/selesai) | 2026-07-02 |
| 9 | Logistik API (`defekta`, `slow-moving`, `POST surat-pesanan`, `stats`/`stok/chart` diperbaiki) + `obat.pbf_id` baru + riwayat `pergerakan_stok` sintetis + `/logistik` & sisa `/peringatan-dini` (F17, F19) disambungkan penuh | 2026-07-07 |

> Phase 8 (Forecasting, F20–F23) selesai pada tanggal yang sama (2026-07-07) di branch
> `feat/forecasting-proyeksi` — lihat CHANGELOG di branch itu untuk detail, belum tercermin di
> tabel ini sampai kedua branch di-merge.

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

> [!note] Keputusan implementasi — lihat [[DECISIONS#ADR-011]] untuk detail lengkap
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

## Pending Todos (setelah Phase 7, 9)

- **Rekonsiliasi branch (segera):** `feat/forecasting-proyeksi` (Phase 8) dan `feat/logistik-pengadaan`
  (Phase 9) sama-sama di-branch dari `merge-feat-dashboard` dan dikerjakan paralel — keduanya perlu
  di-merge (satu per satu, expect conflict di `.planning/*.md` karena kedua branch update dokumen
  yang sama) sebelum lanjut Phase 10.
- **Phase 10:** Settings — edit profil + halaman /settings dari data real. Belum dimulai di branch manapun.
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

Last session: 2026-07-07
Stopped at: Phase 9 (Logistik & Pengadaan) selesai penuh di branch `feat/logistik-pengadaan` — endpoint defekta/slow-moving/POST surat-pesanan baru, `obat.pbf_id` ditambahkan, riwayat pergerakan_stok sintetis di-seed, `/logistik` + sisa `/peringatan-dini` (F17, F19) disambungkan penuh. 1 bug ditemukan & diperbaiki (POST error di-silent-swallow FE karena fetch() tidak reject di 4xx/5xx — helper `postJson()` baru). Backend+frontend Docker di-rebuild berkali-kali, `npm run test:tps` 100% lulus tiap rebuild, Playwright end-to-end (termasuk eksekusi nyata Buat Pesanan + Tanda Retur) lulus tanpa console error. Belum di-commit/push.
Resume: Commit Phase 9 (belum di-commit) dan push branch `feat/logistik-pengadaan`. **Prioritas berikutnya: rekonsiliasi dengan branch `feat/forecasting-proyeksi`** (Phase 8, selesai paralel tanggal yang sama) — merge keduanya ke `merge-feat-dashboard`, expect conflict di dokumen `.planning/*.md` karena kedua sesi mengedit file yang sama dari baseline yang sama. Setelah itu baru lanjut Phase 10 (Settings) atau FA5–FA7 kalau diminta.
