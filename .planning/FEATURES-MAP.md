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
| ✅ Selesai | 16 | 43% |
| 🟡 Integrasi Pending | 8 | 22% |
| 🟠 BE Pending | 10 | 27% |
| ❌ Belum Ada | 3 | 8% |
| **Total** | **37** | |

```
Progress keseluruhan:
Selesai          ████████░░░░░░░░░░░░  43%
Integrasi        ████░░░░░░░░░░░░░░░░  22%
BE Pending       █████░░░░░░░░░░░░░░░  27%
Belum Ada        ██░░░░░░░░░░░░░░░░░░   8%
```

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
| F04 | Edit profil (nama, telepon, alamat) | 🟠 | `pengguna` | `/settings` |

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
> FE sudah tersambung penuh ke `/peringatan-dini` sejak Plan 07-03 (kecuali F17 tindakan cepat & F19 chart).

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F12 | Kalkulasi anomali Z-score otomatis | ✅ | `RekamMedis`, `alert_ews` | — (cron/trigger, dipicu manual via `POST /api/alerts/detect`) |
| F13 | Daftar alert aktif (Kritis / Waspada) | ✅ | `alert_ews`, `wilayah` | `/peringatan-dini`, `/proyeksi-tren` |
| F14 | Detail alert (lonjakan %, laju harian, sisa stok jam) | ✅ | `alert_ews`, `stok`, `obat` | `/peringatan-dini` (modal) |
| F15 | Stat cards EWS (stok kritis, lonjakan, wilayah) | ✅ | `alert_ews`, `stok` | `/peringatan-dini` |
| F16 | AI ringkasan situasi (teks otomatis dari data alert) | ✅ | `alert_ews` | `/peringatan-dini`, `/logistik` |
| F17 | Tindakan: Relokasi & retur stok dari alert | 🟡 | `alert_ews`, `stok`, `pergerakan_stok` | `/peringatan-dini` |
| F18 | Tindakan: Tandai alert "ditangani / selesai" | ✅ | `alert_ews` | `/peringatan-dini` |
| F19 | Chart stok vs kebutuhan per penyakit | 🟠 | `stok`, `alert_ews`, `obat` | `/peringatan-dini` |

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
> Prediksi kebutuhan 14–30 hari ke depan dengan double exponential smoothing.
> Output disimpan di `prediksi_kebutuhan` agar tidak dihitung ulang tiap request.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F20 | Algoritma proyeksi 14–30 hari (double exp. smoothing) | 🟠 | `RekamMedis`, `prediksi_kebutuhan` | — (backend logic) |
| F21 | Area chart proyeksi tren (ISPA vs DBD) | 🟠 | `prediksi_kebutuhan` | `/proyeksi-tren` |
| F22 | Stat cards proyeksi (peningkatan/penurunan tertinggi) | 🟠 | `prediksi_kebutuhan` | `/proyeksi-tren` |
| F23 | Alert cards rekomendasi obat dari proyeksi | 🟠 | `prediksi_kebutuhan`, `alert_ews`, `obat` | `/proyeksi-tren` |

> [!note] Data Sudah Tersedia
> Tabel `prediksi_kebutuhan` sudah di-seed dengan 6 prediksi untuk periode `2026-07`.
> Yang belum ada: endpoint GET + algoritma kalkulasi otomatis.

---

## 📦 Domain 5 — Manajemen Stok

> [!info] Konteks
> Stok multi-batch per faskes. Near-expiry dan slow-moving dihitung dari `stok` + `pergerakan_stok`.
> FE sudah ada tab "Dead-stock & relokasi" dengan UI lengkap, semua masih hardcoded.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F24 | Stock chart per obat (sisa vs kebutuhan) | 🟡 | `stok`, `obat`, `fasilitas_kesehatan` | `/logistik` |
| F25 | Defekta — obat di bawah stok minimum | 🟠 | `stok`, `obat`, `fasilitas_kesehatan` | `/logistik` |
| F26 | Stat cards logistik (nilai dead-stock, stockout risk, ketahanan) | 🟡 | `stok`, `obat`, `pergerakan_stok` | `/logistik` |
| F27 | Near-expiry — obat mendekati kedaluwarsa (≤ 3 bulan) | 🟡 | `stok`, `obat` | `/logistik` |
| F28 | Slow-moving — obat tidak bergerak dalam N hari | 🟠 | `stok`, `pergerakan_stok`, `obat` | `/logistik` |
| F29 | Realokasi stok antar cabang | 🟡 | `stok`, `pergerakan_stok`, `fasilitas_kesehatan` | `/logistik` |
| F30 | Retur / Penyesuaian stok | 🟡 | `stok`, `pergerakan_stok` | `/logistik` |

> [!success] F29–F30 Backend Selesai (Phase 7, Plan 07-02 — dikonsumsi bareng F17)
> `POST /api/stok/realokasi` dan `POST /api/stok/retur` sama-sama dipakai `/peringatan-dini` (F17)
> dan `/logistik` (F29–F30) — satu backend, dua halaman FE. `/logistik` sudah punya tombol
> "Sarankan realokasi" / "Tanda retur" hardcoded di tab "Dead-stock & relokasi", tinggal disambungkan.

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
> Tabel `stok` (15 baris), `pergerakan_stok` (15 baris awal masuk) sudah di-seed.
> Ada 2 item near-minimum (CTM 15 strip, Metformin 5 strip) dan 1 near-expiry (Antasida exp. Des 2026).

---

## 🧾 Domain 6 — Pengadaan (Surat Pesanan)

> [!info] Konteks
> SP = Surat Pesanan ke PBF. Satu SP per PBF. Item NPP wajib di SP terpisah.
> Hanya `apoteker` (punya `nomor_sipa`) yang boleh menandatangani SP NPP.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F31 | List surat pesanan per faskes | 🟡 | `surat_pesanan`, `sp_item`, `pbf` | `/logistik` |
| F32 | Buat SP otomatis dari defekta (dikelompokkan per PBF) | 🟠 | `surat_pesanan`, `sp_item`, `stok`, `pbf`, `obat` | `/logistik` |
| F33 | Update status SP (draf → disetujui → dikirim → diterima) | ❌ | `surat_pesanan` | Belum ada halaman |
| F34 | SP terpisah otomatis untuk obat NPP | ❌ | `surat_pesanan`, `sp_item`, `obat` | Belum ada |

> [!note] Data Sudah Tersedia
> 1 SP contoh (status `draf`) dengan 2 item sudah ada di database.

---

## ⚙️ Domain 7 — Profil & Settings

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F35 | Load profil dari API saat buka `/settings` | 🟡 | `pengguna`, `fasilitas_kesehatan` | `/settings` |
| F36 | Simpan perubahan profil | 🟠 | `pengguna` | `/settings` |
| F37 | Pilih/ganti cabang (untuk admin multi-faskes) | ❌ | `fasilitas_kesehatan`, `wilayah` | Belum ada |

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
| FA2 | Guard peran admin — FE (`middleware.ts`) + BE (`requireAdmin`) | ✅ | `pengguna` | `/admin/*` (redirect non-admin), link "Admin Panel" muncul kondisional di `Sidebar.tsx` utama |
| FA3 | CRUD pengguna (tambah/edit/nonaktifkan akun) | ✅ | `pengguna`, `fasilitas_kesehatan` | `/admin/users` |
| FA4 | Registrasi mandiri dinonaktifkan, akun baru cuma lewat admin | ✅ (sudah ada sebelum merge ini) | `pengguna` | `/register` (pesan error tetap), `/admin/users` (jalur resmi buat akun) |
| FA5 | CRUD master obat dari admin panel | ❌ | `obat` | Belum ada —**sengaja di-exclude** dari merge 2026-07-06, direncanakan phase berikutnya |
| FA6 | CRUD stok dari admin panel | ❌ | `stok` | Belum ada — sama seperti FA5, phase berikutnya |
| FA7 | Prediksi kebutuhan obat via AI (Groq) dari admin panel | ❌ | `stok`, `pergerakan_stok`, `alert_ews` | Belum ada — sama seperti FA5, phase berikutnya |

> [!note] Kenapa FA5–FA7 di-exclude, bukan cuma "belum sempat"
> Source branch punya `routes/admin.ts`+`controllers/admin.ts` yang menggabungkan CRUD user +
> CRUD obat + CRUD stok jadi satu file. User eksplisit minta cuma 4 fitur (FA1–FA4) yang diambil,
> jadi controller/route di-split manual — FA5–FA7 bukan dihapus karena rusak, tapi memang belum
> diintegrasikan ke branch ini. Kode aslinya (untuk referensi kalau mau dikerjakan lagi) ada di
> branch `feat/admin-system-and-ai-update`, commit `6adaa31`, fungsi `getObat/createObat/updateObat/
> deleteObat/getStokAdmin/updateStok` di `admin.ts` + endpoint `GET /api/ai/predict-drugs`.

---

## 🗂️ Mapping: Endpoint Backend yang Sudah Ada

| Endpoint | Method | Status | Fitur Terkait |
|----------|--------|--------|---------------|
| `/api/auth/login` | POST | ✅ | F01 |
| `/api/auth/logout` | POST | ✅ | F02 |
| `/api/auth/me` | GET | ✅ | F03, F35 |
| `/api/cases/spatial` | GET | ✅ | F05, F07 |
| `/api/cases/temporal` | GET | ✅ | F06, F08 |
| `/api/cases/region/:name` | GET | ✅ | F06 |
| `/api/docs` | GET | ✅ | (Swagger UI) |
| `/api/logistic/stok` | GET | ✅ BE (2026-07-03 merge) | F24 (daftar mentah) |
| `/api/logistic/stok/chart` | GET | ✅ BE (2026-07-03 merge) | F24 |
| `/api/logistic/stats` | GET | ✅ BE (2026-07-03 merge) | F26 |
| `/api/logistic/near-expiry` | GET | ✅ BE (2026-07-03 merge) | F27 |
| `/api/logistic/surat-pesanan` | GET | ✅ BE (2026-07-03 merge) | F31 |
| `/api/ai/analyze` | POST | ✅ BE (2026-07-03 merge, butuh `GROQ_API_KEY`) | fitur baru, di luar 37 fitur map ini |
| `/api/auth/register` | POST | ✅ BE-only (2026-07-03 merge) | tidak dipakai FE (lihat ADR-010) |
| `/api/admin/users` | GET/POST | ✅ (2026-07-06 merge) | FA3 |
| `/api/admin/users/:id` | PUT/DELETE | ✅ (2026-07-06 merge) | FA3 |
| `/api/admin/faskes` | GET | ✅ (2026-07-06 merge) | FA3 |

---

## 🗂️ Mapping: Tabel Database → Fitur

| Tabel | Baris | Dipakai Oleh |
|-------|-------|--------------|
| `wilayah` | 17 | F05, F06, F07, F09, F13 |
| `fasilitas_kesehatan` | 2 | F01–F04, F24–F26, F29, F31–F32, F35–F37 |
| `pengguna` | 4 | F01–F04, F35–F36 |
| `RekamMedis` | 5.500 | F05–F12, F20 |
| `obat` | 14 | F14, F19, F23–F32 |
| `pbf` | 3 | F31–F32, F34 |
| `formula_racikan` | 2 | (racikan resep — fase berikutnya) |
| `formula_komponen` | 4 | (racikan resep — fase berikutnya) |
| `stok` | 15 | F15, F19, F24–F32 |
| `pergerakan_stok` | 15 | F26, F28–F30 |
| `alert_ews` | 5 | F12–F19, F23 |
| `prediksi_kebutuhan` | 6 | F20–F23 |
| `surat_pesanan` | 1 | F31–F34 |
| `sp_item` | 2 | F31–F34 |

---

## 🛣️ Urutan Pengerjaan Backend (Rekomendasi)

### Minggu Ini — Quick Wins (Integrasi FE yang sudah ada)

```
F02  Sambungkan logout FE → POST /api/auth/logout — ✅ Selesai (Phase 6, Plan 06-03)
F03  Sambungkan AuthContext → GET /api/auth/me      — ✅ Selesai (Phase 6, Plan 06-03)
F08  Sambungkan /proyeksi-tren → GET /api/cases/temporal — ✅ Selesai (Phase 6, Plan 06-02)
F35  Sambungkan /settings → GET /api/auth/me
```

### Berikutnya — Backend Core (Domain EWS & Stats)

```
F09–F11  GET /api/cases/summary — ✅ Selesai (Phase 6, Plan 06-01)
F13      GET /api/alerts           — ✅ Selesai (Phase 7, Plan 07-01, FE 07-03)
F18      PATCH /api/alerts/:id     — ✅ Selesai (Phase 7, Plan 07-02, FE 07-03)
F12      POST /api/alerts/detect   — ✅ Selesai (Phase 7, Plan 07-03)
```

### Setelah Itu — Logistik & Pengadaan

```
F24–F26  GET /api/stok             (stok per faskes + stat cards)
F27      GET /api/stok/near-expiry
F28      GET /api/stok/slow-moving
F25      GET /api/stok/defekta
F31–F32  GET/POST /api/surat-pesanan
```

### Terakhir — Forecasting & NPP

```
F20–F23  GET /api/forecasting/:disease
F34      SP NPP logic
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
