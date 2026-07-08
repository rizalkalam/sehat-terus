---
title: Feature Map — SehatTerus
updated: 2026-07-02
project: SehatTerus
tags:
  - feature-map
  - backend
  - planning
---

# 🗺️ Feature Map — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Peta fitur lengkap SehatTerus — dipetakan berdasarkan **fitur** (bukan halaman).
> Setiap fitur menunjukkan status pengerjaan, tabel database yang terlibat, dan halaman frontend-nya.

> [!success] Bug diperbaiki 2026-07-02 — Modal Tidak Meng-blur Sidebar (component-level, semua halaman)
> **[Update: fix awal di bawah ini TERNYATA BELUM CUKUP — lihat bagian "Koreksi" di akhir.]**
>
> `Sidebar.tsx` punya `z-[1001]`, sementara semua popup (`ConfirmModal`, `AlertDetailModal`,
> `EditProfileModal` — `z-50`; `NotificationPanel` — `z-40`/`z-50`) jauh di bawahnya. Fix awal:
> naikkan z-index ke `z-[1100]`/`z-[1101]` di ke-4 komponen popup. Diverifikasi waktu itu cuma
> pakai `getComputedStyle` (bandingkan angka z-index) + screenshot visual — **keduanya tidak
> cukup untuk membuktikan urutan render sungguhan**, karena blur 4px itu efek halus dan sidebar
> sendiri sudah semi-transparan secara default (mirip terlihat blur walau sebenarnya tidak).
>
> **Koreksi (sesi berikutnya, setelah user laporkan masih belum blur):** pengujian yang benar
> pakai `document.elementFromPoint()` — ternyata masih balikin `ASIDE`, bukan modal. Root cause
> sebenarnya ada 2 lapis:
> 1. Sidebar `position: static` (default) — `z-index` **tidak berlaku sama sekali** pada elemen
>    static. `z-[1001]` sudah ada sejak awal tapi tidak pernah aktif. Fix: tambah `relative`.
> 2. Wrapper div tiap halaman (`px-[41px] py-[29px] ... max-w-[1163px]`) punya
>    `position: relative; z-index: 10` — bikin **stacking context baru** yang menjebak z-index
>    modal di dalamnya. Modal cuma dibanding-bandingkan dengan sibling DI DALAM wrapper itu; di
>    level root, yang dibandingkan ke Sidebar (z-1001) adalah kontribusi wrapper (z-10), bukan
>    z-1100 modal — Sidebar selalu menang.
>
> **Fix final:** ke-4 komponen popup di-portal ke `document.body` via `createPortal()` (React) —
> keluar total dari stacking context wrapper halaman manapun, solusi permanen bukan workaround.
> Diverifikasi ulang dengan `elementFromPoint()` untuk ke-4 jenis modal, di local dev DAN
> terhadap container Docker yang di-rebuild — hasil konsisten benar di keduanya.

---

## Legend Status

| Ikon | Status | Artinya |
|------|--------|---------|
| ✅ | **Selesai** | BE endpoint ada + FE sudah memanggil API |
| 🟡 | **Integrasi Pending** | BE ✅ FE ✅ tapi FE masih pakai data mock/hardcoded |
| 🟠 | **BE Pending** | FE ✅ UI sudah ada, BE ❌ endpoint belum dibuat |
| ❌ | **Belum Ada** | Belum ada di FE maupun BE |

---

## 📊 Ringkasan Progress

| Status | Jumlah | Persentase |
|--------|--------|------------|
| ✅ Selesai | 35 | 95% |
| 🟡 Integrasi Pending | 0 | 0% |
| 🟠 BE Pending | 0 | 0% |
| ❌ Belum Ada | 2 | 5% |
| **Total** | **37** | |

```
Progress keseluruhan:
Selesai          ████████████████████░  95%
Belum Ada        █░░░░░░░░░░░░░░░░░░░░   5%
```

> [!note] Phase 8, 9 & 10 sudah selesai
> F20–F23 (Phase 8), F17/F19/F24–F32/F34 (Phase 9), dan F04/F35/F36 (Phase 10 — Settings) sekarang
> semuanya ✅. Sisa pending: F33 (SP status workflow), F37 (multi-faskes) — lihat detail di tabel
> Domain di bawah.

> [!info] Merge parsial dari branch `feat/disease-api-integration` (2026-07-03)
> Branch teman satu kelompok (`TonyKeys`) dibuat dari snapshot project yang jauh lebih lama
> (sebelum Phase 5 TPS & Phase 7 EWS/stok ada) — merge polos akan menghapus `tps`/`alerts`/`stok`
> router yang sudah dibangun. Diambil manual & selektif ke branch baru
> `feat/logistic-ai-integration`: endpoint `GET /api/logistic/*` (mengisi gap F24, F26, F27, F31)
> dan `POST /api/ai/analyze` (ringkasan LLM via Groq, fitur baru di luar 37 fitur map ini).
> `getAlerts` versi teman **tidak diambil** (duplikat, versi kita di `alerts.ts` lebih lengkap).
> `POST /api/auth/register` juga diambil tapi **backend-only** — FE tetap pakai
> `registerUser()` yang sengaja mengembalikan pesan "dinonaktifkan" (keputusan produk yang sudah
> ada, tidak diubah oleh merge ini). Lihat [[DECISIONS#ADR-010]].

---

## 🔐 Domain 1 — Autentikasi

> [!info] Konteks
> Login berbasis JWT cookie. Backend set `st_auth` (HttpOnly) dan `st_user` (readable).
> Model: `pengguna`, `fasilitas_kesehatan`

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F01 | Login email & password → set JWT cookie | ✅ | `pengguna` | `/login` |
| F02 | Logout → hapus cookie sesi | ✅ | — | Sidebar |
| F03 | Load profil otomatis saat app dibuka | ✅ | `pengguna` | Semua (AuthContext) |
| F04 | Edit profil (nama, telepon, alamat) | ✅ | `pengguna` | `/settings` |

> [!success] F02–F03 Selesai (Phase 6, Plan 06-03)
> `AuthContext.logout()` sekarang memanggil `logoutFromApi()` → `POST /api/auth/logout`, yang
> menghapus cookie `st_auth` (httpOnly) di server. Sebelumnya `logout()` cuma hapus cookie di
> JS, yang **tidak bisa** menghapus cookie httpOnly — sesi sebenarnya tidak pernah benar-benar
> berakhir. `AuthProvider` juga sekarang panggil `GET /api/auth/me` (`getMe()`) saat mount untuk
> validasi sesi + refresh profil dari server, bukan cuma baca cookie `st_user` yang bisa basi.

---

## 🗺️ Domain 2 — Surveilans Penyakit (GIS)

> [!info] Konteks
> Data bersumber dari `RekamMedis` (5.500 records). Backend sudah punya 3 endpoint agregasi.
> Peta menggunakan Leaflet + GeoJSON kecamatan Sleman.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F05 | Peta choropleth kasus per kecamatan | ✅ | `RekamMedis`, `wilayah` | `/` |
| F06 | Detail kecamatan (kasus, insiden rate, klik peta) | ✅ | `RekamMedis`, `wilayah` | `/` |
| F07 | Filter peta by rentang waktu & jenis penyakit | ✅ | `RekamMedis` | `/` |
| F08 | Tren temporal time-series chart (multi-penyakit) | ✅ | `RekamMedis` | `/proyeksi-tren` |
| F09 | Dashboard stat cards (total kasus, kecamatan aktif) | ✅ | `RekamMedis`, `wilayah` | `/` |
| F10 | Komposisi penyakit — donut chart | ✅ | `RekamMedis` | `/` |
| F11 | Tabel penyakit aktif (top 5 + jumlah kasus) | ✅ | `RekamMedis` | `/` |

> [!success] F05–F07 Selesai
> Endpoint `GET /api/cases/spatial`, `/api/cases/temporal`, `/api/cases/region/:name` sudah jalan
> dan dashboard sudah memanggil API ini.

> [!success] F09–F11 Selesai (Phase 6, Plan 06-01)
> Dashboard (`/`) sekarang memanggil `GET /api/cases/summary`: tabel penyakit, donut chart,
> dan stat card "Total Pasien Aktif" pakai data real (`top_diseases`, `active_patients`).
> Legend donut pakai alias singkat (`shortDiseaseLabel`) supaya nama panjang tidak overflow.

> [!success] F08 Selesai (Phase 6, Plan 06-02)
> Halaman `/proyeksi-tren` sekarang fetch `GET /api/cases/temporal?diseases=J06.9,A90` (6 bulan
> terakhir, interval bulanan) untuk area chart ISPA vs DBD. Stat cards (Peningkatan/Penurunan
> Tertinggi, Total Kasus Aktif) dan alert cards rekomendasi masih hardcoded — itu F22/F23,
> perlu endpoint `/api/forecasting/*` di Phase 8, di luar scope 06-02.
>
> **Update 2026-07-02 (post-Phase 7 review):** 2 penyakit yang dibandingkan tadinya hardcoded
> ke ISPA+DBD. Ditambah dropdown selector (fetch daftar lengkap dari
> `GET /api/tps/referensi/penyakit`, 10 penyakit) supaya manajer bisa pilih sendiri 2 penyakit
> yang mau dibandingkan — bukan cuma ISPA/DBD terus-menerus. Diverifikasi: ganti dropdown ke
> "Influenza / Flu" langsung update chart + tooltip dengan angka real dari API.
>
> **Update 2026-07-07 (Phase 8):** Chart diganti total ke `GET /api/forecasting/projection`
> (mingguan, bukan bulanan) supaya bagian proyeksi bisa digambar garis putus-putus menyambung
> dari titik historis terakhir. Stat cards & alert cards yang disebut di atas sebagai "masih
> hardcoded" sekarang hidup dari `/api/forecasting/{stats,alerts}` — lihat [[#Domain 4]] F20–F23.
>
> **Update 2026-07-02 — Responsive layout:** Halaman `/proyeksi-tren` sebelumnya 100% fixed-pixel
> (tidak ada breakpoint Tailwind sama sekali di seluruh area dashboard). Stat cards & alert cards
> (`flex-1` 3-kolom) jadi sangat sempit/terpotong di viewport sedang karena sidebar fixed 349px
> memakan porsi besar layar. Diperbaiki jadi grid responsif: `grid-cols-1` di bawah `md` (768px),
> `md:grid-cols-2` untuk stat cards, `xl:grid-cols-3` (1280px) baru full 3-kolom seperti desain
> asli — breakpoint `xl` dipilih setelah dihitung ulang (bukan `lg`/1024px) karena sidebar+padding
> masih menyisakan < 600px area konten pada 1024px, cukup untuk 2 kolom tapi belum 3. Chart card
> tinggi responsif (`h-[260px] sm:h-[320px] xl:h-[368px]`), header (judul + 2 dropdown) stack
> vertikal di bawah `xl`. Diverifikasi Playwright di 4 lebar viewport (1512/1100/900/700) —
> tidak ada lagi teks terpotong parah atau elemen tumpang-tindih di lebar manapun.

---

## 🚨 Domain 3 — Early Warning System (EWS)

> [!info] Konteks
> Deteksi lonjakan kasus berbasis Z-score. Output disimpan di `alert_ews`.
> FE sudah tersambung penuh ke `/peringatan-dini` sejak Plan 07-03; F17 & F19 selesai di Phase 9
> (2026-07-07) begitu `GET /api/logistic/{defekta,slow-moving,stok/chart}` ada.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F12 | Kalkulasi anomali Z-score otomatis | ✅ | `RekamMedis`, `alert_ews` | — (cron/trigger, dipicu manual via `POST /api/alerts/detect`) |
| F13 | Daftar alert aktif (Kritis / Waspada) | ✅ | `alert_ews`, `wilayah` | `/peringatan-dini`, `/proyeksi-tren` |
| F14 | Detail alert (lonjakan %, laju harian, sisa stok jam) | ✅ | `alert_ews`, `stok`, `obat` | `/peringatan-dini` (modal) |
| F15 | Stat cards EWS (stok kritis, lonjakan, wilayah) | ✅ | `alert_ews`, `stok` | `/peringatan-dini` |
| F16 | AI ringkasan situasi (teks otomatis dari data alert) | ✅ | `alert_ews` | `/peringatan-dini` — **belum** di `/logistik`, lihat catatan Domain 5 |
| F17 | Tindakan: Relokasi & retur stok dari alert | ✅ | `stok`, `pergerakan_stok`, `fasilitas_kesehatan` | `/peringatan-dini` |
| F18 | Tindakan: Tandai alert "ditangani / selesai" | ✅ | `alert_ews` | `/peringatan-dini` |
| F19 | Chart stok vs kebutuhan per obat kritis | ✅ | `stok`, `pergerakan_stok`, `obat` | `/peringatan-dini` |

> [!success] F13–F16, F18 Selesai Penuh — Backend + FE (Phase 7, Plan 07-01→07-03)
> `GET /api/alerts`, `/:id`, `/stats`, `/summary`, dan `PATCH /api/alerts/:id` semua terimplementasi
> di `backend/src/controllers/alerts.ts` dan sekarang **disambungkan ke `/peringatan-dini`**
> (Plan 07-03): stat cards, `AiBanner`, daftar alert card, modal detail, dan tombol Tangani/Selesai
> semua hidup dari API real. Diverifikasi via Playwright: klik "Tangani" pada alert Ngaglik
> (waspada) benar-benar memanggil `PATCH`, dan daftar otomatis refresh dari 3 → 2 kartu (Ngaglik
> keluar dari filter default `status=aktif`).
>
> **Keputusan implementasi (tidak ada di schema, didekati dengan aturan sederhana):**
> - `level` (kritis/waspada) dihitung dari `persen_lonjakan >= 150%` ATAU `ketahanan_stok_jam <= 48` — tidak disimpan sebagai kolom
> - `estimasi_puncak` di detail alert = heuristik dari `laju_harian` (bukan model prediksi — itu Phase 8)
> - `wilayah_detail` (daftar kelurahan) di response `GET /api/alerts/:id` **tidak disertakan** — skema `wilayah` cuma granularitas kecamatan; modal FE menampilkan nama kecamatan saja
> - `penyebab` (dugaan penyebab lonjakan) di modal FE **tidak difabrikasi** — tampil placeholder jujur "Belum dianalisis otomatis" karena tidak ada sumber data analisis penyebab

> [!success] F12 Selesai — Z-score Detection Engine (Phase 7, Plan 07-03)
> `POST /api/alerts/detect` (`detectAnomalies()`) bandingkan 7 hari terakhir vs baseline 28 hari
> per (kecamatan, kode_icd10): anomali = z-score ≥ 2 **DAN** total kasus 7 hari ≥ 5 (batas absolut,
> sesuai REQUIREMENTS.md ANL-02, cegah "1→3 kasus = 300% lonjakan" jadi false alarm). Alert aktif
> yang cocok di-update, kalau belum ada dibuat baru. Tidak mengisi `obat_terdampak_id`/
> `ketahanan_stok_jam` (tidak ada pemetaan penyakit→obat) dan tidak auto-selesaikan alert yang
> sudah tidak anomali — keduanya scope masa depan. Threshold Z-score/absolut **tidak configurable**
> dari UI (REQUIREMENTS.md ADM-02 di luar scope MVP ini) — masih konstanta di kode.
>
> **Bug ditemukan & diperbaiki saat verifikasi:** boundary hari pertama versi awal pakai
> `now`-minus-N-hari yang membawa jam:menit `now`, sehingga loop day-walking **tidak pernah**
> menyentuh kalender hari ini (`d < now` gagal tepat sebelum mencapai hari ini) — kasus hari
> berjalan diam-diam hilang dari hitungan. Diperbaiki dengan menormalkan semua batas ke
> tengah-malam UTC, cocok dengan `DATE_TRUNC('day', ...)` di Postgres. Diverifikasi dengan
> menyuntik 20 kasus ISPA buatan di kecamatan Turi (dihapus lagi setelah verifikasi) — sebelum
> fix cuma 8/20 terhitung, sesudah fix 20/20 (+ baseline) terhitung benar.

> [!success] F17 (Sebagian), F18 Backend Selesai (Phase 7, Plan 07-02)
> `PATCH /api/alerts/:id` (tangani/selesai, dengan `ditangani_oleh` — kolom baru, lihat catatan di
> bawah), `POST /api/stok/realokasi`, dan `POST /api/stok/retur` semua terimplementasi
> (`backend/src/controllers/stok.ts` + `alerts.ts`), diverifikasi via curl end-to-end (stok
> berkurang di asal/bertambah di tujuan untuk realokasi, berkurang untuk retur) dan validasi query
> langsung ke Postgres. `npm run test:tps` re-run — 100% lulus, tidak ada regresi.
>
> **F17 tetap 🟡** — bagian "Tandai ditangani/selesai" (F18) sudah tersambung penuh, tapi bagian
> "Tindakan Darurat" (kartu saran relokasi/retur) di `/peringatan-dini` **sengaja tetap hardcoded**:
> tidak ada endpoint yang bisa menjawab "faskes mana yang punya stok surplus untuk direlokasi?" —
> itu butuh `GET /api/stok/*` (Phase 9) untuk membaca stok lintas faskes. `POST /api/stok/realokasi`
> & `/retur` itu sendiri sudah live dan siap dipakai begitu sumber datanya ada. Endpoint yang sama
> juga akan dipakai F29/F30 di Domain 5 (`/logistik`) — lihat catatan di sana.
>
> **Kolom baru `ditangani_oleh`** ditambah ke `alert_ews` (via `sequelize.sync({ alter: true })`,
> ADR-002) — dulu tidak ada, sama seperti `dicatat_oleh` ditambah ke `RekamMedis` di Phase 5.
>
> **Deviasi dari API-SPEC.md:** `POST /api/stok/realokasi` mencatat **1 baris** `pergerakan_stok`
> (`tipe='realokasi'`, `faskes_asal`+`faskes_tujuan` di baris yang sama), bukan "2 baris
> keluar+masuk" seperti disebut di spec awal — lihat [[DECISIONS#ADR-008]] untuk alasannya.

> [!success] Bug diperbaiki 2026-07-02 — Horizontal overflow di `/peringatan-dini` (dan sebenarnya SEMUA halaman)
> User laporkan "bagian grafis overflow ke kanan" di Early Warning. Investigasi awal (fix
> `flex gap-[16px]` tanpa wrap + chart card `shrink-0 w-[460px]` jadi `flex-col xl:flex-row` +
> lebar responsif, sama pola dengan fix Trend sebelumnya) **tidak cukup** — overflow tetap ada
> bahkan di 1512px (lebar desain asli), 115px lebih lebar dari viewport, membesar linear makin
> sempit viewport-nya.
>
> **Root cause sebenarnya:** `frontend/src/app/layout.tsx` (root layout, bukan halaman tertentu) —
> 3 elemen dekoratif "Figma Ambient Blurry Ellipses" (blur blob absolute-positioned, salah satunya
> `left-[65%] w-[644px]`, sengaja meluber ke luar viewport untuk efek gradient) di-clip dengan
> `overflow-hidden` di `<body>`. Tapi **`<html>` adalah scrolling root** di standards mode, bukan
> `<body>` — jadi `overflow-hidden` di body tidak efektif mencegah `<html>` jadi scrollable
> horizontal. Bug ini ada di SEMUA halaman dashboard sejak awal, cuma baru terlapor sekarang.
>
> **Fix:** tambah `overflow-x-hidden` ke elemen `<html>` di `app/layout.tsx` (1 baris). Diverifikasi
> dengan script pengukuran `document.documentElement.scrollWidth` vs `clientWidth` (bukan cuma
> screenshot visual) di 5 lebar viewport × 5 halaman (`/`, `/proyeksi-tren`, `/peringatan-dini`,
> `/logistik`, `/settings`) — overflow = 0px di semua kombinasi, sebelumnya 115–399px tergantung
> lebar viewport. Perubahan layout responsif dari investigasi awal (chart card, `InfoStatCards.tsx`
> jadi grid, "Tindakan Darurat" cards) tetap dipertahankan sebagai perbaikan proporsionalitas yang
> valid, walau bukan penyebab utama overflow-nya.

> [!success] Penyempurnaan 2026-07-02 — Daftar Alert Presisi dengan Tinggi Chart
> Kolom daftar alert di `/peringatan-dini` sekarang `xl:h-[288px] xl:overflow-y-auto` — tinggi
> persis sama dengan kartu chart di sebelahnya (240px chart + 24px×2 padding), bukan tinggi
> mengikuti jumlah alert. Kalau alert lebih banyak dari yang muat, list di-scroll internal
> (bukan pagination — dipilih karena lebih cocok untuk feed yang live-update, tidak perlu reset
> state halaman tiap refetch setelah aksi Tangani/Selesai). Diverifikasi: `alertColHeight=288`
> vs `chartColHeight≈290` (beda 2px = border), `scrollHeight=480` saat 5 alert aktif (scroll aktif).

> [!note] Data Sudah Tersedia
> Tabel `alert_ews` sudah di-seed dengan 5 contoh alert (3 aktif, 1 ditangani, 1 selesai).
> Yang belum ada: endpoint REST untuk membaca dan mengupdate alert.

---

## 📈 Domain 4 — Proyeksi & Forecasting

> [!info] Konteks
> Prediksi kasus 14–30 hari ke depan dengan double exponential smoothing (Holt's linear trend).
> **Update 2026-07-07:** `prediksi_kebutuhan` ternyata bukan untuk ini — schema-nya `obat_id`/
> `faskes_id`/`jumlah_prediksi` (kebutuhan obat per faskes, dipakai Phase 9), bukan proyeksi kasus
> penyakit. Dihitung on-the-fly dari `RekamMedis` tiap request (mingguan, minggu berjalan
> dikeluarkan dari fit). Lihat [[DECISIONS#ADR-011]] dan [[API-SPEC#Domain Forecasting]].

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F20 | Algoritma proyeksi 14–30 hari (double exp. smoothing) | ✅ | `RekamMedis` | — (backend logic) |
| F21 | Area chart proyeksi tren, garis putus-putus untuk proyeksi | ✅ | `RekamMedis` | `/proyeksi-tren` |
| F22 | Stat cards proyeksi (peningkatan/penurunan tertinggi) | ✅ | `RekamMedis` | `/proyeksi-tren` |
| F23 | Alert cards rekomendasi obat dari proyeksi | ✅ | `RekamMedis`, `resep`, `resep_item`, `obat`, `alert_ews` | `/proyeksi-tren` |

> [!note] rekomendasi_obat (F23) — tidak ada pemetaan penyakit→obat fabrikasi
> Diambil dari riwayat `resep_item` nyata untuk penyakit itu, fallback ke `alert_ews.
> obat_terdampak_id` kalau riwayat resep kosong, atau array kosong kalau tidak ada sumber data
> nyata sama sekali. Beberapa baris `resep`/`resep_item` contoh ditambahkan ke `seedAll.ts` (satu
> per penyakit utama) supaya fallback ini punya sinyal nyata untuk diuji.

---

## 📦 Domain 5 — Manajemen Stok

> [!info] Konteks
> Stok multi-batch per faskes. Near-expiry dan slow-moving dihitung dari `stok` + `pergerakan_stok`.
> Semua disambungkan penuh di Phase 9 (2026-07-07) — lihat [[CHANGELOG]] dan [[DECISIONS#ADR-012]].

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F24 | Stock chart per obat (sisa vs kebutuhan) | ✅ | `stok`, `obat`, `pergerakan_stok` | `/logistik` |
| F25 | Defekta — obat di bawah stok minimum | ✅ | `stok`, `obat`, `pbf`, `surat_pesanan` | `/logistik` |
| F26 | Stat cards logistik (nilai dead-stock, stockout risk, ketahanan) | ✅ | `stok`, `obat`, `pergerakan_stok` | `/logistik` |
| F27 | Near-expiry — obat mendekati kedaluwarsa (≤ 3 bulan) | ✅ | `stok`, `obat` | `/logistik` |
| F28 | Slow-moving — obat tidak bergerak dalam N hari | ✅ | `stok`, `pergerakan_stok`, `obat`, `fasilitas_kesehatan` | `/logistik`, `/peringatan-dini` |
| F29 | Realokasi stok antar cabang | ✅ | `stok`, `pergerakan_stok`, `fasilitas_kesehatan` | `/logistik`, `/peringatan-dini` |
| F30 | Retur / Penyesuaian stok | ✅ | `stok`, `pergerakan_stok` | `/logistik`, `/peringatan-dini` |

> [!success] F24–F30 Selesai Penuh (Phase 9, 2026-07-07)
> `POST /api/stok/realokasi` dan `POST /api/stok/retur` (Phase 7) akhirnya disambungkan ke FE lewat
> `GET /api/logistic/slow-moving` (F28) yang menghitung nyata **penyakit mana yang butuh
> realokasi** vs **retur** — bukan cuma sekadar dua tombol tersambung, tapi rekomendasinya sendiri
> nyata: `saran='realokasi'` hanya kalau ada faskes lain yang benar-benar kekurangan obat yang sama,
> else `'retur'`. Dipakai bareng di `/logistik` (F29–F30) dan `/peringatan-dini` "Tindakan Darurat" (F17).
> `getStats` (F26) yang tadinya pakai asumsi tetap "stok / 10 per hari" untuk `ketahanan_hari`
> sekarang pakai rata-rata pemakaian nyata dari `pergerakan_stok` tipe `'keluar'`.

> [!success] Penyempurnaan 2026-07-02 — F26 (4 Stat Card) Tetap Statis Satu Baris
> User minta 4 stat card di `/logistik` (F26) TIDAK ikut pola grid responsif yang dipakai
> `/peringatan-dini` (F15, 3 card) — harus tetap satu baris, tidak pernah wrap ke baris baru
> seberapa pun sempit viewportnya. `InfoStatCards.tsx` (component bareng untuk F15 & F26) sekarang
> punya prop `wrap?: boolean` (default `true` = grid responsif; `false` = flex satu baris statis,
> dipakai `/logistik`). Aman dari overflow karena kartu tetap `flex-1 min-w-0` (bukan lebar fixed)
> — menyempit & teks wrap di dalam kartu, tidak memaksa halaman melebar. Diverifikasi: 4 kartu
> tetap 1 baris (top offset identik) di 1512px & 900px, 0px overflow di keduanya.
>
> **Update 2026-07-02 — Padding/spacing lebih proper:** internal kartu direstrukturisasi —
> label jadi abu-abu kecil (`text-black/60`) di atas value bold, `justify-between` supaya badge
> nempel di bawah kartu (bukan nempel langsung di bawah value, jadi kartu dengan konten pendek
> gak keliatan kosong), badge jadi pill chip (`bg-[#0c818a]/8 rounded-[6px]`) bukan teks polos.

> [!note] Data Sudah Tersedia
> Tabel `stok` (16 baris), `pergerakan_stok` (192 baris — 41 dari sebelumnya + 151 riwayat
> `keluar` sintetis 45 hari ditambah Phase 9 untuk fast/medium-mover, lihat [[DECISIONS#ADR-012]]).
> Ada beberapa item di bawah minimum (Codein 8/10, Metformin 5/30, CTM 6/50) dan 1 near-expiry
> (CTM exp. 1 bln lagi).

---

## 🧾 Domain 6 — Pengadaan (Surat Pesanan)

> [!info] Konteks
> SP = Surat Pesanan ke PBF. Satu SP per PBF. Item NPP wajib di SP terpisah.
> Hanya `apoteker` (punya `nomor_sipa`) yang boleh menandatangani SP NPP.
> F31–F32, F34 selesai Phase 9 (2026-07-07) — lihat [[DECISIONS#ADR-012]].

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F31 | List surat pesanan per faskes | ✅ | `surat_pesanan`, `sp_item`, `pbf`, `obat` | `/logistik` |
| F32 | Buat SP dari defekta (dikelompokkan per PBF+tipe) | ✅ | `surat_pesanan`, `sp_item`, `stok`, `pbf`, `obat` | `/logistik` |
| F33 | Update status SP (draf → disetujui → dikirim → diterima) | ❌ | `surat_pesanan` | Belum ada halaman |
| F34 | SP terpisah untuk obat NPP (validasi tolak campur golongan) | ✅ | `surat_pesanan`, `sp_item`, `obat`, `pengguna` | `/logistik` (lewat grouping defekta + validasi BE) |

> [!note] F32/F34 — "otomatis" berarti server memaksa pemisahan, bukan satu klik bikin semua SP
> Defekta (`GET /api/logistic/defekta`) sudah pre-group per `(pbf_id, tipe)` — item npp tidak
> pernah tercampur dengan reguler di grup manapun. Tombol "Buat Pesanan" tetap per-grup (user klik
> tiap grup), tapi `POST` di backend menolak keras (400) kalau ada percobaan mencampur golongan,
> dan `tipe='npp'` ditolak (403) kalau bukan dibuat oleh pengguna dengan `nomor_sipa`. F33 (update
> status SP setelah dibuat) masih belum ada — di luar scope Phase 9.

> [!note] Data Sudah Tersedia
> 1 SP contoh (status `draf`) dengan 2 item sudah ada di database.

---

## ⚙️ Domain 7 — Profil & Settings

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F35 | Load profil dari API saat buka `/settings` | ✅ | `pengguna`, `fasilitas_kesehatan` | `/settings` |
| F36 | Simpan perubahan profil | ✅ | `pengguna` | `/settings` |
| F37 | Pilih/ganti cabang (untuk admin multi-faskes) | ❌ | `fasilitas_kesehatan`, `wilayah` | Belum ada |

> [!success] F04, F35, F36 Selesai (Phase 10 — 2026-07-08)
> `GET /api/auth/me` diperluas untuk sertakan `nomor_sipa`, `telepon`, `alamat`, dan join `faskes`
> (nama/tipe/alamat). Endpoint baru `PUT /api/pengguna/profile` (`controllers/pengguna.ts`) validasi
> `nama` wajib lalu update `nama`/`telepon`/`alamat` milik pengguna yang login. `/settings` ditulis
> ulang total — field lama (`nickname`, `city`, `district`, `village`, `postcode`, `street`, dll.)
> dibuang karena tidak ada di skema `pengguna` manapun, diganti field nyata (nama, telepon, alamat
> editable; email, nomor_sipa, peran, faskes read-only). Lihat [[DECISIONS#ADR-013]].

---

## 🛡️ Domain 8 — Admin Panel (di luar 37 fitur original)

> [!abstract] Konteks
> Ditambahkan lewat merge selektif dari branch teman `feat/admin-system-and-ai-update` (author
> TonyKeys) ke `merge-feat-dashboard`, 2026-07-06. Source branch aslinya menggabungkan 6 fitur
> jadi satu commit besar; hanya 4 yang diambil (scope dipersempit atas permintaan user) — lihat
> [[CHANGELOG]] entri 2026-07-06 untuk rincian apa yang dipangkas dan kenapa.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| FA1 | Admin dashboard layout + sidebar navigasi (`/admin`) | ✅ | — | `/admin` |
| FA2 | Guard peran admin — FE (`middleware.ts`) + BE (`requireAdmin`) | ✅ | `pengguna` | `/admin/*` (redirect non-admin), admin diblokir total dari semua halaman MIS |
| FA3 | CRUD pengguna (tambah/edit/nonaktifkan akun) | ✅ (diverifikasi browser 2026-07-07, 1 bug diperbaiki — lihat [[CHANGELOG]]) | `pengguna`, `fasilitas_kesehatan` | `/admin/users` |
| FA4 | Registrasi mandiri dinonaktifkan, akun baru cuma lewat admin | ✅ (sudah ada sebelum merge ini) | `pengguna` | `/register` (pesan error tetap), `/admin/users` (jalur resmi buat akun) |
| FA5 | CRUD master obat dari admin panel | ✅ (2026-07-08) | `obat` | `/admin/obat` |
| FA6 | CRUD stok dari admin panel | ✅ (2026-07-08) | `stok` | `/admin/stok` |
| FA8 | Landing per peran setelah login (`middleware.ts`) | ✅ | `pengguna` | admin → `/admin`; manajer → `/` (dashboard MIS); apoteker & staf_logistik → **Swagger UI backend** (`/api/docs`), karena belum ada halaman FE untuk peran itu (lihat [[CHANGELOG]] 2026-07-06) |
| FA7 | Prediksi kebutuhan obat via AI (Groq) dari admin panel | ✅ (2026-07-08 — kode selesai & guard terverifikasi, tapi `GROQ_API_KEY` belum diisi di `.env` jadi panggilan Groq sungguhan belum diverifikasi — sama seperti F16 sebelumnya) | `stok`, `pergerakan_stok` (via `computeDefekta`/`computeSlowMoving`) | `/admin/prediksi-obat` |

> [!success] FA5 Selesai — Backend (2026-07-08)
> `GET/POST /api/admin/obat`, `PUT/DELETE /api/admin/obat/:id` diimplementasi di `admin.ts`
> (controller + route), diambil & diadaptasi dari kode referensi commit `6adaa31` (lihat catatan
> di bawah). Guard `requireAuth`+`requireAdmin` otomatis lewat router-level middleware yang sudah
> ada. **Bug ditemukan saat verifikasi curl end-to-end:** `deleteObat` awalnya andalkan Postgres FK
> constraint error, tapi asosiasi `Obat.hasMany(Stok/...)` di `models/index.ts` ternyata default
> `ON DELETE CASCADE` (default Sequelize untuk FK NOT NULL) — delete obat yang masih punya stok
> **sukses dan diam-diam menghapus riwayat stok**, bukan gagal. Diperbaiki dengan guard eksplisit
> level aplikasi (cek `COUNT` ke 6 tabel terkait sebelum `destroy()`) — lihat [[CHANGELOG]] untuk
> detail. FE (halaman admin untuk kelola obat) belum dibuat — di luar scope sesi ini.
>
> **Update 2026-07-08 (lanjutan sesi yang sama):** FK constraint DB-level juga sudah diperbaiki —
> `models/index.ts` sekarang set `onDelete: 'RESTRICT'` eksplisit di 6 asosiasi `Obat.hasMany(...)`
> (`Stok`, `PergerakanStok`, `ResepItem`, `SpItem`, `PrediksiKebutuhan`, `FormulaKomponen`), dan
> constraint yang sudah ada di DB dev diubah manual lewat `ALTER TABLE ... DROP/ADD CONSTRAINT`
> (bukan `sync({alter:true})` — kurang reliable untuk ubah referential action di Sequelize).
> Diverifikasi dengan `DELETE FROM obat` mentah lewat psql (bypass total lapisan aplikasi) pada obat
> yang punya baris `stok` — Postgres sendiri sekarang menolak dengan
> `violates foreign key constraint "stok_obat_id_fkey"`. Guard aplikasi di `deleteObat` tetap
> dipertahankan (pesan error 409 yang lebih ramah ke user daripada raw DB error 500).
> `alert_ews_obat_terdampak_id_fkey` sengaja tidak disentuh — tetap `SET NULL` karena kolomnya
> nullable dan alert memang boleh tetap ada tanpa referensi obat.

> [!success] FA5 Selesai Penuh — FE (2026-07-08, sesi lanjutan)
> Halaman `/admin/obat` dibuat (`frontend/src/app/admin/obat/page.tsx`), pola persis mengikuti
> `/admin/users` (fetch inline + modal form inline, bukan komponen shared) — tabel obat (nama,
> jenis, golongan, satuan, harga beli, stok minimum, kode ATC, PBF) + modal tambah/edit. Beda dari
> `/admin/users`: `deleteObat` di backend itu **hard delete** (bukan nonaktifkan), jadi tombol hapus
> pakai `Trash2` (bukan `PowerOff`) dan menampilkan pesan 409 dari server (obat masih dipakai) di
> banner error di atas tabel, bukan diabaikan begitu saja.
> Endpoint baru `GET /api/admin/pbf` ditambahkan (mengikuti pola `getFaskes`) karena dropdown PBF di
> form obat butuh daftar PBF, dan sebelumnya belum ada endpoint admin untuk itu.
> Link "Obat" ditambah ke `AdminSidebar.tsx` (ikon `Pill` dari lucide-react).
> Diverifikasi: `npx tsc --noEmit` bersih di FE & BE, docker image di-rebuild, curl end-to-end
> penuh (create → update → delete) dengan payload persis sama seperti yang dikirim form React,
> serta halaman di-fetch dengan cookie sesi admin — render 200 dengan judul "Kelola Obat" dan link
> sidebar "Obat" muncul di HTML.

> [!success] FA6 Selesai Penuh — Backend + FE (2026-07-08)
> `getStokAdmin`/`createStok`/`updateStok`/`deleteStok` ditambah ke `admin.ts` (controller + route),
> diadaptasi dari referensi lama commit `6adaa31` yang cuma punya `getStokAdmin`/`updateStok` —
> `createStok` dan `deleteStok` ditulis baru, ikut pola validasi FK (`validateFaskesId`/
> `validateObatId`, sama seperti `validatePbfId` di FA5). Halaman `/admin/stok`
> (`frontend/src/app/admin/stok/page.tsx`) dibuat dengan pola sama persis `/admin/obat` — tabel
> (obat, faskes, jumlah, satuan, kedaluwarsa, batch) + modal tambah/edit dengan dropdown obat
> (reuse `GET /api/admin/obat`) dan faskes (reuse `GET /api/admin/faskes` yang sudah ada, tidak
> perlu endpoint baru). Link "Stok" ditambah ke `AdminSidebar.tsx` (ikon `Boxes`).
>
> **Beda penting dari CRUD lain:** endpoint ini adalah **override admin langsung** ke tabel `stok`
> (koreksi inventaris manual) — beda dari `POST /api/stok/realokasi`/`retur` (`stok.ts`, dipakai F17/
> F29–F30) yang FEFO-aware dan selalu mencatat baris `pergerakan_stok`. CRUD admin ini **tidak**
> membuat baris `pergerakan_stok` — perubahan `jumlah_tersedia` lewat sini tidak punya jejak audit,
> sengaja karena ini jalur koreksi cepat, bukan transaksi bisnis. Kalau butuh audit trail, pakai
> endpoint `stok.ts` yang sudah ada.
>
> `createStok`/`updateStok` juga menangani `SequelizeUniqueConstraintError` (index unik
> `faskes_id+obat_id+batch+tanggal_kedaluwarsa`) jadi 409 dengan pesan jelas, bukan raw 500 —
> diverifikasi dengan percobaan insert duplikat kombinasi yang sama persis. `deleteStok` hard-delete
> polos tanpa guard (tidak ada tabel lain yang FK ke `stok.id`, beda dari `deleteObat`).
>
> Diverifikasi: `npx tsc --noEmit` bersih FE & BE, docker rebuild, curl end-to-end penuh
> (create → duplicate 409 → jumlah negatif 400 → update → delete), dan halaman `/admin/stok`
> di-fetch dengan cookie admin — render 200, judul "Kelola Stok" + link sidebar "Stok" ada di HTML.
>
> **Catatan:** asosiasi `Stok.belongsTo(FasilitasKesehatan)` / `FasilitasKesehatan.hasMany(Stok)`
> masih **tidak** punya `onDelete` eksplisit (default Sequelize CASCADE untuk FK NOT NULL) — beda
> dari `Obat.hasMany(Stok, { onDelete: 'RESTRICT' })` yang sudah diperbaiki FA5. Artinya hapus
> `fasilitas_kesehatan` masih bisa diam-diam menghapus semua `stok` terkait. Di luar scope FA6 (tidak
> ada CRUD faskes di admin panel), dicatat di sini kalau nanti ada fitur hapus faskes.

> [!success] FA7 Selesai Penuh — Backend + FE (2026-07-08)
> `GET /api/ai/predict-drugs` ditambah ke `ai.ts` (controller + route), tapi **desain sengaja beda**
> dari referensi lama (commit `6adaa31`, `predictDrugNeeds`) — bukan cuma port langsung.
>
> **Kenapa didesain ulang, bukan di-port apa adanya:** referensi lama dump `stok`+`alert_ews` mentah
> ke prompt dan minta LLM **mengarang sendiri** angka `prediksi_kebutuhan`/`total_estimasi_biaya` —
> tidak deterministik, gampang halusinasi angka yang tidak match data asli. Referensi itu juga
> query `pergerakan` (30 hari) tapi **tidak pernah dipakai** di prompt (dead code) dan tidak ada guard
> kalau `GROQ_API_KEY` kosong.
>
> **Desain baru:** `computeDefekta`/`computeSlowMoving` — logika inti F25/F28 di `logistic.ts` yang
> sudah battle-tested — diekstrak jadi fungsi terpisah dari handler HTTP-nya (`getDefekta`/
> `getSlowMoving` sekarang cuma manggil lalu `res.json`, tidak ada perubahan hasil — diverifikasi
> `diff` byte-identik response sebelum/sesudah refactor). `predictDrugNeeds` (di `ai.ts`) manggil
> kedua fungsi itu untuk dapat angka pasti (`usulan_pesanan`, `ketahanan_hari`, `nilai_modal_rp`,
> `saran` realokasi/retur — semua sudah dihitung sistem, bukan LLM), lalu Groq **cuma diminta
> menulis ringkasan naratif + rekomendasi** dari angka itu (prompt eksplisit larang mengarang angka
> sendiri). Response akhir menggabungkan narasi Groq (`summary`, `alert_status`, `rekomendasi`)
> dengan angka asli dari `computeDefekta`/`computeSlowMoving` (`kebutuhan_mendesak`,
> `stok_berlebih`) — hasil sekarang konsisten dengan angka yang dilihat manajer di `/logistik`.
>
> **Guard tambahan yang tidak ada di referensi lama:** kalau `GROQ_API_KEY` kosong → 500 dengan
> pesan jelas (bukan diam-diam gagal parsing respons Groq yang tidak terautentikasi). Kalau tidak
> ada obat defekta maupun slow-moving sama sekali → balik langsung tanpa panggil Groq (hemat biaya
> API, tidak ada yang perlu diringkas). Route dipasang `requireAuth` **+ `requireAdmin`** (referensi
> lama tidak ada guard auth sama sekali) — sesuai konteks "admin panel" di nama fitur.
>
> Halaman `/admin/prediksi-obat` (`frontend/src/app/admin/prediksi-obat/page.tsx`) — beda dari
> FA5/FA6 (bukan tabel CRUD): dropdown pilih faskes (opsional, default semua) + tombol "Jalankan
> Prediksi", lalu render badge status (Normal/Waspada/Bahaya), ringkasan, daftar rekomendasi, dan
> 2 tabel (kebutuhan mendesak, stok berlebih). Link "Prediksi AI" ditambah ke `AdminSidebar.tsx`
> (ikon `Sparkles`).
>
> **Diverifikasi:** `npx tsc --noEmit` bersih FE & BE, docker rebuild, refactor `computeDefekta`/
> `computeSlowMoving` diverifikasi tidak mengubah hasil (`diff` byte-identik terhadap seed data asli
> sebelum & sesudah rebuild), guard `requireAdmin` diverifikasi (403 login sebagai manajer), guard
> `GROQ_API_KEY` kosong diverifikasi (500 pesan jelas), halaman `/admin/prediksi-obat` di-fetch
> dengan cookie admin — render 200 + link sidebar "Prediksi AI" ada di HTML.
>
> **Belum diverifikasi:** panggilan Groq sungguhan (`GROQ_API_KEY` belum ada di `.env` lokal —
> sama seperti `/api/ai/analyze`/F16 sebelumnya, yang juga belum pernah diverifikasi live). Isi key
> asli sebelum dipakai produksi.

---

## 🗂️ Mapping: Endpoint Backend yang Sudah Ada

| Endpoint | Method | Status | Fitur Terkait |
|----------|--------|--------|---------------|
| `/api/auth/login` | POST | ✅ | F01 |
| `/api/auth/logout` | POST | ✅ | F02 |
| `/api/auth/me` | GET | ✅ (Phase 10 — sekarang sertakan nomor_sipa/telepon/alamat/faskes) | F03, F35 |
| `/api/pengguna/profile` | PUT | ✅ (Phase 10 — baru) | F04, F36 |
| `/api/cases/spatial` | GET | ✅ | F05, F07 |
| `/api/cases/temporal` | GET | ✅ | F06, F08 |
| `/api/cases/region/:name` | GET | ✅ | F06 |
| `/api/docs` | GET | ✅ | (Swagger UI) |
| `/api/logistic/stok` | GET | ✅ FE tersambung (Phase 9) | F24 (daftar mentah) |
| `/api/logistic/stok/chart` | GET | ✅ FE tersambung (Phase 9, +`mode=line`) | F24, F19 |
| `/api/logistic/stats` | GET | ✅ FE tersambung (Phase 9, ketahanan pakai data nyata) | F26 |
| `/api/logistic/near-expiry` | GET | ✅ FE tersambung (Phase 9) | F27 |
| `/api/logistic/defekta` | GET | ✅ (Phase 9 — baru) | F25 |
| `/api/logistic/slow-moving` | GET | ✅ (Phase 9 — baru) | F28, F17 |
| `/api/logistic/surat-pesanan` | GET | ✅ FE tersambung (Phase 9) | F31 |
| `/api/logistic/surat-pesanan` | POST | ✅ (Phase 9 — baru) | F32, F34 |
| `/api/ai/analyze` | POST | ✅ BE (2026-07-03 merge, butuh `GROQ_API_KEY`) | fitur baru, di luar 37 fitur map ini |
| `/api/auth/register` | POST | ✅ BE-only (2026-07-03 merge) | tidak dipakai FE (lihat ADR-010) |
| `/api/admin/users` | GET/POST | ✅ (2026-07-06 merge) | FA3 |
| `/api/admin/users/:id` | PUT/DELETE | ✅ (2026-07-06 merge) | FA3 |
| `/api/admin/faskes` | GET | ✅ (2026-07-06 merge) | FA3 |
| `/api/admin/obat` | GET/POST | ✅ (2026-07-08 — baru) | FA5 |
| `/api/admin/obat/:id` | PUT/DELETE | ✅ (2026-07-08 — baru) | FA5 |
| `/api/admin/pbf` | GET | ✅ (2026-07-08 — baru) | FA5 (dropdown PBF di form obat) |
| `/api/admin/stok` | GET/POST | ✅ (2026-07-08 — baru) | FA6 |
| `/api/admin/stok/:id` | PUT/DELETE | ✅ (2026-07-08 — baru) | FA6 |
| `/api/ai/predict-drugs` | GET | ✅ BE (2026-07-08 — baru, butuh `GROQ_API_KEY`, `requireAdmin`) | FA7 |
| `/api/forecasting/projection` | GET | ✅ (2026-07-07) | F21 |
| `/api/forecasting/stats` | GET | ✅ (2026-07-07) | F22 |
| `/api/forecasting/alerts` | GET | ✅ (2026-07-07) | F23 |

---

## 🗂️ Mapping: Tabel Database → Fitur

| Tabel | Baris | Dipakai Oleh |
|-------|-------|--------------|
| `wilayah` | 17 | F05, F06, F07, F09, F13 |
| `fasilitas_kesehatan` | 2 | F01–F04, F24–F26, F29, F31–F32, F35–F37 |
| `pengguna` | 4 | F01–F04, F35–F36 |
| `RekamMedis` | 5.532 | F05–F12, F20–F22 |
| `resep` / `resep_item` | 5 / 6 | F23 (rekomendasi obat, sumber utama) |
| `obat` | 14 (semua punya `pbf_id` sejak Phase 9) | F14, F19, F23–F32 |
| `pbf` | 3 | F25, F31–F32, F34 |
| `formula_racikan` | 2 | (racikan resep — fase berikutnya) |
| `formula_komponen` | 4 | (racikan resep — fase berikutnya) |
| `stok` | 16 | F15, F19, F24–F32 |
| `pergerakan_stok` | 192 (41 + 151 riwayat sintetis Phase 9) | F17, F19, F26, F28–F30 |
| `alert_ews` | 5 | F12–F19, F23 (fallback rekomendasi obat) |
| `prediksi_kebutuhan` | 6 | Phase 9 tidak memakainya (kebutuhan obat per faskes, bukan proyeksi kasus F20–F23) — lihat [[DECISIONS#ADR-012]] |
| `surat_pesanan` | 1 | F31–F34 |
| `sp_item` | 2 | F31–F34 |

---

## 🛣️ Urutan Pengerjaan Backend (Rekomendasi)

### Minggu Ini — Quick Wins (Integrasi FE yang sudah ada)

```
F02  Sambungkan logout FE → POST /api/auth/logout — ✅ Selesai (Phase 6, Plan 06-03)
F03  Sambungkan AuthContext → GET /api/auth/me      — ✅ Selesai (Phase 6, Plan 06-03)
F08  Sambungkan /proyeksi-tren → GET /api/cases/temporal — ✅ Selesai (Phase 6, Plan 06-02)
F35  Sambungkan /settings → GET /api/auth/me — ✅ Selesai (Phase 10, 2026-07-08)
```

### Berikutnya — Backend Core (Domain EWS & Stats)

```
F09–F11  GET /api/cases/summary — ✅ Selesai (Phase 6, Plan 06-01)
F13      GET /api/alerts           — ✅ Selesai (Phase 7, Plan 07-01, FE 07-03)
F18      PATCH /api/alerts/:id     — ✅ Selesai (Phase 7, Plan 07-02, FE 07-03)
F12      POST /api/alerts/detect   — ✅ Selesai (Phase 7, Plan 07-03)
```

### Logistik & Pengadaan — ✅ Selesai (Phase 9, 2026-07-07)

```
F24–F30  GET /api/logistic/{stats,stok/chart,defekta,near-expiry,slow-moving} — ✅ Selesai
F31–F32  GET/POST /api/logistic/surat-pesanan                                — ✅ Selesai
F34      Validasi SP NPP terpisah (BE reject campur golongan)                — ✅ Selesai
F17, F19 /peringatan-dini Tindakan Darurat + chart stok vs kebutuhan         — ✅ Selesai
```

### Forecasting — ✅ Selesai (Phase 8, 2026-07-07)

```
F20–F23  GET /api/forecasting/{projection,stats,alerts} — ✅ Selesai (Phase 8)
```

### Profile & Settings — ✅ Selesai (Phase 10, 2026-07-08)

```
F04      PUT /api/pengguna/profile          — ✅ Selesai
F35–F36  /settings load + simpan profil real — ✅ Selesai
```

### Terakhir — Sisa Pekerjaan (belum dikerjakan)

```
F33            Update status SP (draf → disetujui → dikirim → diterima)
F37            Pilih/ganti cabang admin multi-faskes
```

---

---

## 🔗 Navigasi Dokumen

| Dokumen | Isi |
|---------|-----|
| [[API-SPEC]] | Spesifikasi lengkap semua endpoint + request/response shape |
| [[CHANGELOG]] | Progress per sesi — apa yang dikerjakan dan kapan |
| [[DECISIONS]] | Keputusan arsitektur dan alasannya (ADR) |
| [[ROADMAP]] | Phase plan original (Phase 1–5) |
| [[STATE]] | State mesin — phase berapa sekarang |
| [[research/SCHEMA]] | Schema database lengkap (SQL reference) |

---

*Diperbarui otomatis oleh Claude Code — 2026-06-30*
