---
title: Changelog — SehatTerus
tags:
  - changelog
  - progress
---

# 📋 Changelog — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Catatan progress pengerjaan per sesi. Entri terbaru selalu di **paling atas**.
> Setiap entri menyertakan ID fitur dari [[FEATURES-MAP]] yang berubah statusnya.

---

## 2026-07-03 — Session: Merge Parsial Branch Teman (`feat/disease-api-integration`)

### ✅ Diselesaikan

Branch baru `feat/logistic-ai-integration` dibuat dari `feat/mis-dashboard-ews-integration`.
Branch teman satu kelompok (`TonyKeys`) ternyata root commit terpisah (snapshot lama, sebelum
Phase 5 TPS & Phase 7 EWS/stok) yang di-splice ke histori lewat commit "resolve merge conflicts"
— merge polos akan menghapus router `tps`/`alerts`/`stok` yang sudah kita bangun. Diambil manual
& selektif, lihat [[DECISIONS#ADR-010]] untuk detail lengkap.

**Ditambahkan:**
- `POST /api/ai/analyze` (fitur baru, di luar 37 fitur map) — ringkasan situasi penyakit via Groq LLM
- `GET /api/logistic/stok`, `/stok/chart`, `/stats`, `/near-expiry`, `/surat-pesanan` — mengisi
  gap F24, F26, F27, F31 (status naik dari 🟠 BE Pending → 🟡 Integrasi Pending, FE belum disambung)
- `POST /api/auth/register` — backend-only, FE tetap pakai pesan "dinonaktifkan" (tidak diubah)
- `GROQ_API_KEY` ditambahkan ke `.env.example` & `docker-compose.yml` (backend service)

**Dibuang (duplikat/usang, sengaja tidak diambil):** `getAlerts` versi teman (kalah lengkap dari
`alerts.ts` kita), seluruh `.planning/*` versi lama dari snapshot branch itu, `app.ts`/model versi
lama yang tidak punya Phase 5/7.

Diverifikasi: `npx tsc --noEmit` di `backend/` lulus tanpa error setelah semua penambahan.

---

## 2026-07-02 — Session: Modal Blur — Fix Sebenarnya (Sesi Sebelumnya Belum Tuntas)

### ⚠️ Koreksi Diri
User laporkan sidebar masih belum ke-blur meski sudah "diperbaiki" di sesi sebelumnya (bump
z-index modal ke `z-[1100]`). Verifikasi sesi lalu **cuma pakai screenshot visual** — blur 4px itu
efek yang halus, gampang keliru dinilai "sudah benar" dari mata telanjang doang, apalagi sidebar
sendiri sudah punya `backdrop-blur-md` + background semi-transparan sebagai tampilan defaultnya
(jadi keduanya — versi blur dan versi tidak — terlihat mirip di screenshot). Sesi ini pakai
`document.elementFromPoint()` di browser sungguhan — pengujian DOM yang presisi, bukan tebakan visual.

### ✅ Root Cause Sebenarnya (2 Lapis)

**Lapis 1 — Sidebar `position: static` bikin `z-[1001]` mati total.** Dikonfirmasi lewat
`getComputedStyle(sidebar).position === "static"`. Fakta CSS: `z-index` **tidak berlaku sama
sekali** pada elemen dengan `position: static` (default). Class `z-[1001]` di `Sidebar.tsx`
sudah ada sejak awal tapi tidak pernah benar-benar aktif. Fix: tambah `relative` ke className
`<aside>`. **Perlu, tapi ternyata belum cukup** — re-test elementFromPoint masih balikin `ASIDE`.

**Lapis 2 — Modal terjebak nested stacking context.** Investigasi lanjutan: telusuri seluruh
ancestor chain dari overlay modal sampai `<html>`, ketemu **wrapper div tiap halaman**
(`px-[41px] py-[29px] ... max-w-[1163px]`) punya `position: relative; z-index: 10`. Ini
membentuk **stacking context baru**. Modal (`z-[1100]`) yang dirender sebagai descendant di
dalam wrapper itu (lewat `PageHeader`/komponen halaman) **cuma dibandingkan dengan sibling di
DALAM wrapper itu** — z-1100-nya tidak pernah "bocor keluar" untuk dibandingkan langsung dengan
Sidebar. Di level ROOT (tempat Sidebar & wrapper halaman jadi sibling), yang dibandingkan adalah
z-1001 (Sidebar) vs z-10 (kontribusi wrapper halaman ke root) — Sidebar menang telak, modal
di dalamnya kalah walau z-index internalnya 1100.

### ✅ Fix Sebenarnya — React Portal
- `ConfirmModal.tsx`, `AlertDetailModal.tsx`, `EditProfileModal.tsx`, `NotificationPanel.tsx` —
  semua sekarang `return createPortal(<Modal/>, document.body)` alih-alih return langsung
- Portal ke `document.body` bikin modal jadi **direct child of body** dalam DOM — otomatis
  keluar dari stacking context wrapper halaman manapun, permanen, tidak tergantung z-index
  konvensi tiap halaman (solusi standar industri untuk kelas bug ini, bukan cuma workaround)
- `Sidebar.tsx` tetap dikasih `relative` (perbaikan lapis 1 tetap dipertahankan — sekarang
  benar-benar berfungsi karena modal sudah lolos ke level root untuk dibandingkan langsung)

### 🧪 Verifikasi (metodologi baru: DOM testing, bukan screenshot)
- Ditulis ulang skrip verifikasi pakai `document.elementFromPoint(x, y)` pada koordinat di
  dalam area sidebar, dicek untuk **ke-4 jenis modal** (EditProfileModal, NotificationPanel,
  AlertDetailModal, ConfirmModal): sebelum fix layer 2 → semua balikin `ASIDE`; sesudah fix
  layer 2 → semua balikin div overlay modal (`z-[1100]`), bukan `ASIDE`
- Diverifikasi 2x: local dev dulu, lalu ulang persis sama terhadap container Docker yang sudah
  di-rebuild — hasil identik di keduanya

### 🎉 Docker frontend di-rebuild (build ke-6 sejak registerUser fix)

---

## 2026-07-02 — Session: Logistik Card Polish + Modal Blur Tidak Menutup Sidebar

### ✅ Diselesaikan

Dua permintaan lanjutan: (1) konten 4 kartu stat di `/logistik` kurang proper padding/margin-nya,
(2) popup/modal harusnya blur SEMUA konten termasuk sidebar, tapi sidebar belum ke-blur.

#### Frontend — Bug: Modal Tidak Meng-blur Sidebar (semua popup, semua halaman)
- **Root cause:** `Sidebar.tsx` punya `z-[1001]`, sementara SEMUA overlay modal
  (`ConfirmModal`, `AlertDetailModal`, `EditProfileModal`) cuma `z-50`, dan `NotificationPanel`
  cuma `z-40`/`z-50` — jauh di bawah sidebar dalam stacking order. Efeknya: sidebar selalu
  render DI ATAS layer blur backdrop modal, jadi walau `backdropFilter: blur(4px)` diterapkan
  ke elemen overlay, sidebar tidak pernah benar-benar "di belakang" overlay itu secara visual
- **Fix:** naikkan z-index ke `z-[1100]` (overlay) / `z-[1101]` (panel konten NotificationPanel)
  di ke-4 komponen popup — sekarang konsisten di atas sidebar
- Bug ini systemic (component-level, bukan page-specific) — otomatis berlaku ke SEMUA popup di
  SEMUA halaman begitu di-fix di komponennya, bukan cuma satu halaman
- Diverifikasi: `getComputedStyle` di browser — `sidebarZ=1001`, `modalZ=1100` (modal di atas),
  screenshot menunjukkan sidebar ikut blur saat modal "Konfirmasi Realokasi" terbuka

#### Frontend — Polish Kartu Stat `/logistik` (F26, dipakai bareng F15)
- `frontend/src/components/InfoStatCards.tsx` — restrukturisasi internal kartu:
  - `p-[22px]` flat → `px-[22px] py-[20px]` + `min-h-[124px]` + `justify-between` (label+value
    nempel di atas, badge nempel di bawah — kartu dengan konten pendek gak lagi keliatan
    "kosong" di bagian bawah)
  - Label: `text-[20px]` hitam solid → `text-[16px]` abu-abu (`text-black/60`) untuk hierarki
    visual yang lebih jelas terhadap value
  - Value: `text-[34px]` → `text-[30px]` (proporsi lebih pas dengan card yang lebih ramping)
  - Badge: dari teks polos dipisah gap → pill chip (`px-[8px] py-[4px] rounded-[6px] bg-[#0c818a]/8`,
    warna teks teal brand) — lebih "proper" secara visual, konsisten dengan gaya badge/chip di
    tempat lain (mis. `AlertDetailModal`)
  - Tambah `truncate` di label & value sebagai pengaman tambahan (kartu tetap statis 1 baris
    per permintaan sebelumnya, jadi bisa sangat sempit di viewport kecil)

### 🎉 Docker frontend di-rebuild (build ke-5 sejak registerUser fix)

---

## 2026-07-02 — Session: Alert List Precision-Sized + Logistik 4-Card Static Row

### ✅ Diselesaikan

Dua permintaan penyempurnaan UI setelah fix overflow sebelumnya:

#### Frontend — Daftar Alert Presisi dengan Chart di `/peringatan-dini`
- `frontend/src/app/(dashboard)/peringatan-dini/page.tsx` — kolom daftar alert (kiri) sekarang
  `xl:h-[288px] xl:overflow-y-auto` — tinggi persis sama dengan kartu chart di sebelahnya
  (240px tinggi chart + 24px×2 padding = 288px), bukan tinggi mengikuti jumlah alert
- Pilih **scroll internal** daripada pagination (user bilang bebas pilih salah satu) — lebih
  cocok untuk feed alert yang sifatnya live-update, tidak perlu state halaman tambahan yang harus
  di-reset tiap kali refetch setelah aksi Tangani/Selesai
- Diverifikasi: `alertColHeight=288` pas dengan `chartColHeight≈290` (beda 2px karena border),
  `scrollHeight=480` (konten lebih tinggi dari container → scroll aktif, `overflow-y: auto`
  terkonfirmasi), tidak ada overflow halaman

#### Frontend — Logistik: 4 Stat Card Tetap Statis Satu Baris
- `frontend/src/components/InfoStatCards.tsx` (dipakai `/peringatan-dini` DAN `/logistik`) —
  tambah prop `wrap?: boolean` (default `true`, grid responsif seperti sekarang). `wrap={false}`
  → balik ke `flex` satu baris tanpa breakpoint, kartu `flex-1` (bukan grid), tidak pernah wrap
  ke baris baru berapa pun sempit viewport-nya — sesuai permintaan eksplisit user "jangan ada
  yg kebawah"
- `frontend/src/app/(dashboard)/logistik/page.tsx` — `<InfoStatCards items={statCards} wrap={false} />`
- Kenapa aman dari overflow (beda dari bug blur-blob sebelumnya): kartu pakai `flex-1` + `min-w-0`,
  bukan lebar fixed — jadi menyempit mengikuti ruang tersedia, teks wrap ke beberapa baris di
  dalam kartu, TIDAK memaksa parent row melebihi lebar viewport
- Diverifikasi: 4 kartu tetap di baris yang sama (`top` offset identik) di 1512px maupun 900px,
  0px overflow halaman di kedua lebar

### 🎉 Docker frontend di-rebuild (build ke-4 sejak registerUser fix)
- Kedua fix di atas live di container setelah `docker compose up -d --build frontend`

---

## 2026-07-02 — Session: Fix Horizontal Overflow (Root Layout Bug, Bukan Chart)

### ✅ Diselesaikan

User laporkan "tampilan pada early warning masih overflow untuk layoutnya, bagian grafis overflow
ke kanan". Diagnosis pakai script pengukuran `document.documentElement.scrollWidth` vs
`clientWidth` di Playwright (bukan cuma cek visual) untuk membuktikan overflow secara presisi
dan menemukan elemen penyebabnya lewat DOM query.

#### Upaya pertama (perlu, tapi bukan penyebab utama)
- `frontend/src/app/(dashboard)/peringatan-dini/page.tsx`: baris `flex gap-[16px]` yang berisi
  daftar alert (`flex-1`) + chart card (`shrink-0 w-[460px]`, lebar tetap tanpa wrap) diubah jadi
  `flex-col xl:flex-row` + lebar chart responsif (`w-full xl:w-[460px]`) — pola sama seperti fix
  Trend sebelumnya. Kartu "Tindakan Darurat" juga dirapikan (`flex-col sm:flex-row`, `flex-wrap`)
- `frontend/src/components/InfoStatCards.tsx` (dipakai `/peringatan-dini` DAN `/logistik`): `flex`
  1-baris tanpa wrap diubah jadi `grid grid-cols-1 md:grid-cols-3`
- Diverifikasi: layout terlihat lebih baik, TAPI script pengukuran overflow masih menunjukkan
  115px lebih lebar dari viewport bahkan di 1512px (lebar desain asli) — jadi ada penyebab lain

#### Root cause sebenarnya — ditemukan lewat DOM query, bukan tebakan
- Script `page.evaluate()` mencari semua elemen dengan `getBoundingClientRect().right > innerWidth`
  → ketemu: `<div className="absolute top-[33px] left-[65%] w-[644px] ... blur-[120px]">` — salah
  satu dari 3 "Figma Ambient Blurry Ellipses" (blob dekoratif blur) di **`frontend/src/app/layout.tsx`**
  (root layout, bukan halaman manapun), sengaja diposisikan meluber ke luar viewport untuk efek
  gradient lembut
- `<body>` sudah punya `overflow-hidden`, tapi **`<html>` adalah scrolling root** di standards mode
  browser modern, bukan `<body>` — jadi clip di body tidak efektif mencegah `<html>` jadi scrollable
  horizontal akibat blob yang meluber itu
- **Bug ini sudah ada di SEMUA halaman dashboard sejak awal proyek** (root layout dipakai semua
  route), cuma baru terlapor sekarang karena user kebetulan perhatikan di Early Warning

#### Fix
- `frontend/src/app/layout.tsx` — tambah `overflow-x-hidden` ke `<html>` (1 baris)
- Diverifikasi ulang dengan script pengukuran yang sama di **5 lebar viewport × 5 halaman**
  (`/`, `/proyeksi-tren`, `/peringatan-dini`, `/logistik`, `/settings`) — overflow = 0px di
  semua 15 kombinasi, sebelumnya 115–399px tergantung lebar viewport
- Perubahan responsif dari upaya pertama (chart card, `InfoStatCards.tsx`, Tindakan Darurat)
  tetap dipertahankan — valid sebagai perbaikan proporsionalitas terpisah dari bug overflow ini

### 🎉 Docker frontend di-rebuild lagi (build ke-3 sejak registerUser fix)
- `docker compose up -d --build frontend` sukses, fix ini live di container
- Diverifikasi langsung ke container (bukan local dev): overflow = 0px di semua 5 lebar viewport
  yang diuji pada `/peringatan-dini`, tidak ada console error

---

## 2026-07-02 — Session: Responsive Layout Trend + Docker Frontend Akhirnya Di-rebuild

### ✅ Diselesaikan

Diminta user untuk perbaiki tampilan grafik Trend agar "lebih proporsional" dan layout halaman
Trend agar "lebih konsisten" untuk responsive layouting.

#### Frontend — Responsive Layout `/proyeksi-tren`
- Halaman ini (dan sebenarnya seluruh area dashboard) sebelumnya 100% fixed-pixel, nol breakpoint Tailwind. Ditambah breakpoint responsif menyeluruh:
  - Stat cards & alert cards: `grid-cols-1` di bawah `md` (768px) → `md:grid-cols-2` (stat cards saja) → `xl:grid-cols-3` (1280px, desain 3-kolom asli)
  - Breakpoint `xl` (bukan `lg`/1024px) dipilih setelah dihitung ulang: sidebar fixed 349px + padding menyisakan < 600px area konten pada 1024px viewport — cukup untuk 2 kolom, belum nyaman untuk 3. Terbukti lewat screenshot: di 1100px dengan `lg:grid-cols-3` teks kartu terpotong parah ("Peningkat...", "Total Kasus ...")
  - Chart card tinggi responsif: `h-[260px] sm:h-[320px] xl:h-[368px]` (sebelumnya fixed 368px, jadi terlalu gepeng di viewport sempit)
  - Header chart (judul + 2 dropdown penyakit) stack vertikal di bawah `xl`, dropdown dibatasi `max-w` per breakpoint supaya nama penyakit panjang tidak melebar tak terkendali
- Diverifikasi Playwright di 4 lebar viewport (1512/1100/900/700px), 2 iterasi (breakpoint pertama `lg` masih terlalu sempit di 1100px, direvisi ke `xl`; breakpoint 2-kolom `sm` masih terlalu sempit di 700px, direvisi ke `md`) — hasil akhir tidak ada teks terpotong parah/tumpang-tindih di semua lebar yang diuji

### 🎉 Milestone: Docker Frontend Image Akhirnya Di-rebuild
- Bug `registerUser` yang memblokir `docker compose build frontend` sejak Plan 06-01 (2026-07-02) **sudah teratasi** — `frontend/src/lib/auth.client.ts` sekarang punya implementasi `registerUser()` (stub yang menolak pendaftaran mandiri dengan pesan jelas)
- `docker compose up -d --build frontend` **berhasil** untuk pertama kalinya sejak Phase 6. Artinya **seluruh perubahan Phase 6, 7, dan sesi ini sekarang benar-benar live di container**, bukan cuma terverifikasi lewat `npm run dev` lokal seperti selama ini
- Diverifikasi ulang lewat Playwright **langsung ke container Docker** (bukan local dev): dropdown penyakit Trend (2 ditemukan), daftar alert Early Warning (5 kartu real), tidak ada console error

### 📝 Catatan (bukan tindakan, sekadar observasi)
- Saat verifikasi, `alert_ews` menunjukkan 7 baris (bukan 5 baseline) dan `RekamMedis` 5530 baris
  (bukan ~5512) — ada 2 alert baru berstatus `aktif` (`Depok/A90`, `Turi/J06.9`) yang bukan hasil
  kerja sesi ini. Kemungkinan hasil eksplorasi `POST /api/alerts/detect` secara independen
  (mis. oleh user). **Tidak dihapus** — bukan wewenang untuk menghapus data yang tidak jelas
  asal-usulnya tanpa konfirmasi, sesuai prinsip kehati-hatian terhadap tindakan destruktif.

---

## 2026-07-02 — Session: Audit Grafik Trend/Early Warning + Dropdown Pilih Penyakit

### ✅ Diselesaikan

Diminta user untuk cek apakah grafik di `/proyeksi-tren` dan `/peringatan-dini` sudah dinamis
sesuai data backend, dan minta rekomendasi penyakit apa yang sebaiknya ditampilkan di chart Trend.

**Hasil audit:**
- `/proyeksi-tren` — nilai chart **sudah dinamis** (real dari `GET /api/cases/temporal`, sejak
  Plan 06-02), tapi penyakit yang dibandingkan **hardcoded** ke ISPA+DBD di kode
- `/peringatan-dini` — line chart "sisa stok vs kebutuhan" **masih 100% statis**, sesuai
  keputusan Plan 07-03 (butuh `GET /api/stok/chart`, Phase 9) — bukan regresi baru
- Cek distribusi kasus 6 bulan riil: ISPA (591) > **Flu (322)** > DBD (207) > Diare (197) >
  Hipertensi (74) — DBD di posisi 3, bukan 2, walau tetap relevan sebagai penyakit vektor musiman

**Keputusan user:** tambah dropdown manual, bukan top-2 otomatis atau tetap hardcode ISPA/DBD.

#### Frontend — Dropdown Pilih Penyakit di `/proyeksi-tren` (F08, enhancement)
- `frontend/src/app/(dashboard)/proyeksi-tren/page.tsx` — 2 badge warna (oranye/ungu) yang tadinya teks statis "Ispa"/"DBD" diganti `<select>` dropdown, opsi diambil dari `GET /api/tps/referensi/penyakit` (10 penyakit)
- State `disease1`/`disease2` (default tetap `J06.9`/`A90` — perilaku default tidak berubah), masing-masing dropdown menonaktifkan opsi yang sedang dipilih di dropdown satunya (cegah pilih penyakit sama 2x)
- `ChartPoint` field di-generic-kan dari `ispa`/`dbd` → `v1`/`v2`; nama seri di tooltip/legend Recharts ambil dari `nama_penyakit` hasil lookup, bukan hardcoded lagi
- Diverifikasi Playwright: ganti dropdown kedua ke "Influenza / Flu" → chart & tooltip langsung update ke angka real (54 kasus di bulan April, cocok dengan data DB)

---

## 2026-07-02 — Session: Phase 7 Plan 07-03 — Z-score Engine + Peringatan Dini FE (Phase 7 Selesai)

### ✅ Diselesaikan

#### Backend — Z-score Detection Engine (F12)
- `POST /api/alerts/detect` ditambah ke `alerts.ts` — bandingkan kasus 7 hari terakhir vs baseline 28 hari per `(kecamatan, kode_icd10)`. Anomali = z-score ≥ 2 **DAN** kasus 7 hari ≥ 5 (batas absolut, cegah "1→3 kasus = 300%" jadi false alarm, sesuai REQUIREMENTS.md ANL-02)
- Alert `status='aktif'` yang cocok diperbarui; kalau belum ada, dibuat baru (`aksi: "baru"` vs `"diperbarui"` di response)
- Swagger JSDoc lengkap, requireAuth

#### Frontend — Halaman `/peringatan-dini` Disambungkan Penuh (F13–F16, F18)
- `frontend/src/app/(dashboard)/peringatan-dini/page.tsx` — fetch paralel `GET /api/alerts/stats`, `/summary`, `/alerts` saat mount
- 3 `InfoStatCards` sekarang render dari `GET /api/alerts/stats` (label/badges langsung dari API)
- `AiBanner` pakai teks real dari `GET /api/alerts/summary` + `timeAgo()` helper untuk label "diperbarui X lalu"
- Daftar alert card di-render dari `GET /api/alerts`, badge Kritis/Waspada dari field `level`
- Klik card → fetch `GET /api/alerts/:id` → modal detail terisi data real (map field API-response ke `AlertDetailData` yang dipakai `AlertDetailModal`)
- Tombol baru **"Tangani"/"Selesai"** di tiap card → `PATCH /api/alerts/:id` via `ConfirmModal`, lalu refetch semua data
- Chart stok-vs-kebutuhan dan kartu "Tindakan Darurat" (relokasi/retur suggestion) **tetap hardcoded** — didokumentasikan sebagai keputusan, bukan kelalaian (lihat di bawah)

### 🧭 Keputusan implementasi
- **Modal detail — field yang tidak difabrikasi:** `wilayah` cuma tampilkan nama kecamatan (bukan daftar kelurahan — data itu tidak ada di skema); `penyebab` tampil placeholder jujur "Belum dianalisis otomatis" karena tidak ada sumber data analisis penyebab lonjakan
- **"Tindakan Darurat" & chart tetap hardcoded:** tidak ada endpoint yang bisa menjawab "faskes mana yang punya stok surplus untuk direlokasi?" — itu perlu `GET /api/stok/*` (Phase 9) untuk membaca stok lintas faskes. `POST /api/stok/realokasi`/`retur` itu sendiri (dari Plan 07-02) sudah live dan siap dipakai begitu sumber datanya ada — bukan endpoint yang belum dibuat, tapi *data pemicu*-nya yang belum ada
- **Threshold Z-score tidak configurable dari UI** — REQUIREMENTS.md ADM-02 (admin bisa atur threshold) di luar scope MVP ini; nilai `ZSCORE_THRESHOLD=2` dan `MIN_KASUS_RECENT=5` masih konstanta kode

### 🐛 Bug ditemukan & diperbaiki (saat verifikasi Z-score engine)
- Versi pertama `detectAnomalies()` menghitung batas window pakai `now`-minus-N-hari, tapi `now` membawa jam:menit:detik saat ini — loop day-walking (`d < now`, step per hari) **tidak pernah** menyentuh kalender hari ini karena nilai terakhir yang dikunjungi selalu "kemarin, jam yang sama". Akibatnya kasus yang tercatat *hari ini* diam-diam hilang dari perhitungan (baseline maupun recent).
- Diverifikasi dengan menyuntik 20 baris `RekamMedis` buatan (ISPA, kecamatan Turi, tersebar dalam ~20 jam terakhir): sebelum fix cuma 8/20 kasus terhitung (`jumlah_kasus: 8`), sesudah fix (normalisasi semua batas ke tengah-malam UTC, selaras `DATE_TRUNC('day', ...)` Postgres) 20/20 + baseline lama terhitung benar (`jumlah_kasus: 21`).
- Data uji (baris `RekamMedis` + alert hasil deteksi) dihapus lagi setelah verifikasi — state database kembali ke 5 alert seed asli (3 aktif, 1 ditangani, 1 selesai) dan 5510 `rekam_medis`.

### 🧪 Verifikasi
- **Backend:** curl `POST /api/alerts/detect` sebelum & sesudah fix, idempotency dicek (run kedua kali menghasilkan `aksi: "diperbarui"` bukan duplikat baris), 401 tanpa auth
- **Frontend (Playwright):** login → `/peringatan-dini` → screenshot stat cards/AI banner/daftar alert cocok dengan response API mentah → klik card Depok → modal detail terisi benar (kasus aktif 45, estimasi puncak "2–3 hari mendatang", tren "Meningkat 188%...", obat "Oralit Sachet (300 tersisa)") → klik "Tangani" pada card Ngaglik → `ConfirmModal` muncul → konfirmasi → daftar alert refresh otomatis dari 3 → 2 kartu, tidak ada console error di semua langkah
- `npm run test:tps` di-re-run setelah rebuild — 100% lulus, tidak ada regresi
- Ditemukan & diperbaiki juga: lupa mengembalikan status alert Ngaglik ke `aktif` setelah pengujian manual PATCH di sesi Plan 07-02 sebelumnya (tertinggal sebagai `ditangani`) — dibersihkan sebelum sesi ini berakhir

### 📌 Status
**Phase 7 (Early Warning System) selesai penuh — 3/3 plan.** Lanjut ke Phase 8 (Forecasting & Proyeksi).

---

## 2026-07-02 — Session: Phase 7 Plan 07-02 — PATCH Alert Status + Realokasi/Retur Stok

### ✅ Diselesaikan

#### Backend — Model (F18)
- `backend/src/models/AlertEws.ts` — tambah kolom `ditangani_oleh` (UUID, nullable, FK ke `pengguna`). Kolom ini tidak ada di schema/model sebelumnya; ditambahkan mengikuti pola `dicatat_oleh` di `RekamMedis` (Phase 5) demi akuntabilitas siapa yang menangani alert.
- `backend/src/models/index.ts` — tambah asosiasi `Pengguna.hasMany(AlertEws, { foreignKey: 'ditangani_oleh' })` + inverse `belongsTo`
- `research/SCHEMA.md` — `CREATE TABLE alert_ews` diupdate dengan kolom baru ini
- Kolom diterapkan ke DB nyata via `npm run seed:all` (`sequelize.sync({ alter: true })`, ADR-002) — bukan cuma perubahan model TypeScript

#### Backend — `PATCH /api/alerts/:id` (F18)
- `updateAlertStatus()` ditambah ke `alerts.ts` — `requireAuth`, validasi `status` harus `ditangani`/`selesai` (400 kalau bukan), 404 kalau alert tidak ada, set `ditangani_pada` + `ditangani_oleh` dari `req.user.id`

#### Backend — Domain Stok baru (F17, F29, F30)
- File baru: `backend/src/controllers/stok.ts`, `backend/src/routes/stok.ts`, di-mount di `app.ts` sebagai `/api/stok`
- `POST /api/stok/realokasi` — pindah stok antar faskes. FEFO-deduct di faskes asal (bisa lintas beberapa batch), carry-over batch+tanggal_kedaluwarsa yang sama ke faskes tujuan (`findOrCreate`), validasi faskes asal≠tujuan, jumlah>0, stok cukup (400 dengan detail kalau tidak), `obat_id`/`faskes_id`/`alert_id` (opsional) tervalidasi ada
- `POST /api/stok/retur` — tarik stok dari peredaran (alasan `near_expiry`/`slow_moving`/`rusak`), FEFO-deduct, catat `pergerakan_stok` dengan `jumlah` negatif sesuai spec
- Endpoint yang sama dikonsumsi 2 halaman FE: `/peringatan-dini` (F17, tombol "Pindahkan"/"Tanda Retur") dan `/logistik` (F29/F30, tab "Dead-stock & relokasi") — satu backend, dua konsumen

### 🧭 Keputusan implementasi
- **ADR-008 (baru):** `POST /api/stok/realokasi` mencatat **satu** baris `pergerakan_stok` (`tipe='realokasi'`, `faskes_asal`+`faskes_tujuan` di baris yang sama) — bukan "2 baris keluar+masuk" seperti disebut literal di `API-SPEC.md`. Model `PergerakanStok` memang sudah didesain dengan kedua kolom faskes di baris yang sama plus enum `tipe='realokasi'` tersendiri, jadi mengikuti desain skema dianggap lebih benar daripada mengikuti teks spec secara harfiah.
- FEFO deduction untuk realokasi & retur memakai pola yang sama persis dengan `resep.ts` (Phase 5): urutkan `Stok` per `tanggal_kedaluwarsa ASC`, potong beruntun sampai `jumlah` terpenuhi.

### 🧪 Verifikasi
- `curl` end-to-end + query Postgres langsung (`docker exec ... psql`): realokasi 10 Amoxicillin dari Klinik Sleman → Apotek Depok (stok 74→64 di asal, baris baru batch sama 10 unit di tujuan, 1 baris `pergerakan_stok` tipe realokasi), retur 5 unit alasan "rusak" (64→59, `pergerakan_stok.jumlah=-5`)
- Kasus 400 diverifikasi: faskes asal=tujuan, stok tidak cukup (detail obat/diminta/tersedia), alasan retur invalid
- Kasus 401 (PATCH/POST tanpa cookie auth) dan 404 (alert tidak ada) diverifikasi
- Swagger `/api/docs.json` dicek — `/api/stok/realokasi`, `/api/stok/retur`, `PATCH /api/alerts/{id}` semua muncul
- `npm run test:tps` di-re-run setelah rebuild backend — 100% lulus, tidak ada regresi (termasuk chain stok Amoxicillin yang sama dipakai TPS test)

### 📌 Status
Phase 7: 2/3 plan selesai. Belum: Z-score detection engine (F12) + sambungkan FE `/peringatan-dini` ke 7 endpoint yang sudah ada (Plan 07-03).

---

## 2026-07-02 — Session: Phase 7 Plan 07-01 — Endpoint Alerts EWS

### ✅ Diselesaikan

#### Backend — Domain Alerts (F13, F14, F15, F16)
- File baru: `backend/src/controllers/alerts.ts`, `backend/src/routes/alerts.ts`, di-mount di `app.ts` sebagai `/api/alerts` (mengikuti pola `cases.ts` — GET tanpa `requireAuth`, konsisten dengan endpoint MIS read-only lain)
- `GET /api/alerts` — daftar alert dari `alert_ews`, default `status=aktif`, filter `status`/`faskes_id`/`limit`
- `GET /api/alerts/:id` — detail alert + `obat_kritis` (join `Obat` + `Stok` untuk sisa stok) + `estimasi_puncak`
- `GET /api/alerts/stats` — 3 stat card (stok kritis, total lonjakan aktif, wilayah terdampak vs total kecamatan dari `Wilayah.count()`)
- `GET /api/alerts/summary` — teks ringkasan situasi (template string dari alert aktif, bukan LLM, sesuai spec MVP)
- Swagger JSDoc lengkap untuk keempat endpoint, terverifikasi muncul di `/api/docs.json`
- **Docker backend di-rebuild** (`docker compose up -d --build backend`) — endpoint ini live di container, bukan cuma lewat local dev

### 🧭 Keputusan implementasi (field yang tidak ada di schema `alert_ews`)
- **`level` (kritis/waspada):** tidak ada kolom tersimpan. Dihitung: `persen_lonjakan >= 150%` ATAU `ketahanan_stok_jam <= 48` jam → `kritis`, selain itu `waspada`. Threshold 48 jam dipilih supaya konsisten dengan copy "&lt;48 jam" yang sudah ada di mockup `/peringatan-dini`.
- **`estimasi_puncak`** (di `GET /api/alerts/:id`): heuristik sederhana dari `laju_harian` (bukan model prediksi — real forecasting itu Phase 8 double exponential smoothing).
- **`wilayah_detail`** (daftar kelurahan) di contoh response API-SPEC.md: **tidak diimplementasikan**. Tabel `wilayah` cuma granularitas kecamatan; tidak ada data kelurahan yang bisa dikembalikan tanpa fabrikasi data palsu — bertentangan dengan prinsip akuntabilitas data yang jadi alasan Phase 5 (TPS) dibangun.
- **`obat_kritis`** maksimal 1 item (bukan array multi-obat seperti contoh spec) karena `alert_ews.obat_terdampak_id` adalah FK tunggal, bukan relasi many-to-many.

### 🧪 Verifikasi
- `curl` terhadap seluruh 4 endpoint memakai data seed (3 alert aktif, 1 ditangani, 1 selesai) — hasil `level`, `stok_kritis`, `total_lonjakan`, `wilayah_terdampak` dicek manual cocok dengan logic di atas
- Kasus 404 (`GET /api/alerts/:id` dengan UUID tidak ada) dan kasus `obat_kritis: []` (alert tanpa `obat_terdampak_id`) diverifikasi
- `npm run test:tps` dijalankan ulang setelah rebuild backend — semua 100% masih lulus, tidak ada regresi

### 📌 Status
Phase 7: 1/3 plan selesai. Belum: `PATCH /api/alerts/:id` + realokasi/retur (Plan 07-02), Z-score detection engine + sambungkan FE `/peringatan-dini` (Plan 07-03).

---

## 2026-07-02 — Session: Audit & Sinkronisasi Dokumentasi TPS/MIS

### ✅ Diselesaikan

Diminta user untuk cek apakah ada endpoint di `TPS-API-SPEC.md` yang belum diimplementasikan.
Hasil audit terhadap kode backend aktual (`backend/src/routes/tps.ts` + `controllers/tps/*.ts`):
**semua 10 endpoint TPS sudah terimplementasi penuh** sejak Phase 5, tapi dokumen masih
menandai semuanya 🆕 (perlu dibuat) — dokumentasi basi, bukan gap implementasi.

#### `TPS-API-SPEC.md`
- Semua 10 status endpoint (header + tabel ringkasan) diubah 🆕 → ✅
- Tambah banner status di atas dokumen: konfirmasi semua endpoint selesai + lulus `npm run test:tps`, dan catatan eksplisit bahwa TPS memang tanpa UI/frontend (keputusan desain, lihat [[TPS-PLAN]], bukan pekerjaan yang tertinggal)
- Update baris `GET /api/cases/summary` di tabel "Keterkaitan dengan MIS" (sudah terhubung ke FE sejak Phase 6 06-01)

#### `API-SPEC.md`
- `POST /api/auth/logout` (F02), `GET /api/auth/me` on-mount (F03), `/proyeksi-tren` chart (F08), dan `GET /api/cases/summary` (F09–F11) ditandai ✅ — semua terhubung FE sejak Phase 6
- `/settings` load profil (F35) tetap 🟡 — belum, menunggu Phase 10
- Banner "Prerequisite Phase 5" (peringatan block) diganti jadi ringkasan status Phase 5 & 6 selesai
- Tabel ringkasan 36 endpoint + total counter diperbarui: 17 selesai (7 MIS + 10 TPS), 19 pending
- Seksi "Urutan Implementasi" — Tahap 0/1/2 ditandai selesai per item

### 🧭 Kesimpulan untuk user
- Tidak ada endpoint TPS yang belum diimplementasikan
- Tidak adanya UI TPS memang di luar scope by design (staf klinik dianggap punya SIMKlinik/RME sendiri; sistem ini lapisan analitik MIS di atasnya)
- Domain stok lanjutan (penerimaan, penyesuaian, realokasi, SP) yang sempat direncanakan di `TPS-PLAN.md` sudah direklasifikasi jadi endpoint MIS di `API-SPEC.md` (Phase 7 & 9), bukan hilang

---

## 2026-07-02 — Session: Phase 6 Plan 06-03 — Auth Logout + Profile Integration (Phase 6 Selesai)

### ✅ Diselesaikan

#### Frontend — AuthContext (F02, F03)
- `frontend/src/lib/auth.client.ts` — tambah `getMe()`, fetch `GET /api/auth/me` (credentials include), map response ke `User`
- `frontend/src/contexts/AuthContext.tsx`:
  - `logout()` sekarang `async`, panggil `logoutFromApi()` → `POST /api/auth/logout` sebelum clear state & redirect
  - `useEffect` mount: paint optimis dari cookie `st_user`, lalu panggil `getMe()` untuk validasi sesi + refresh profil dari server; kalau gagal (401/expired), clear cookie lokal & set user null

### 🐛 Bug ditemukan & diperbaiki
- `AuthContext.logout()` versi lama cuma menghapus cookie via `document.cookie = ...max-age=0`, yang **tidak bisa** menghapus cookie `st_auth` karena httpOnly. Efeknya, sesi backend tidak pernah benar-benar berakhir walau UI sudah pindah ke `/login`. Fix: panggil endpoint backend dulu (`res.clearCookie` di server bisa hapus httpOnly cookie).

### 🧪 Verifikasi
- Playwright: login → cek cookie `st_auth` (httpOnly) & `st_user` ada → klik "Log Out" di sidebar → cookie keduanya kosong (bukan cuma `st_user`) → nav langsung ke `/` sesudahnya di-redirect middleware ke `/login?from=%2F` → tidak ada console error
- Dijalankan via `npm run dev` lokal port 3000, container Docker frontend dihentikan sementara lalu di-restart

### 📌 Phase 6 (MIS Dashboard Integration) selesai penuh — 3/3 plan (06-01, 06-02, 06-03)

---

## 2026-07-02 — Session: Phase 6 Plan 06-02 — Proyeksi-Tren Chart Integration

### ✅ Diselesaikan

#### Frontend — Halaman Trend (F08)
- `frontend/src/app/(dashboard)/proyeksi-tren/page.tsx` sekarang fetch `GET /api/cases/temporal?diseases=J06.9,A90` (6 bulan terakhir → interval bulanan otomatis dari backend)
- Area chart ISPA vs DBD di-render dari data real, di-pivot per bulan (`byMonth` map) dengan bulan kosong tetap tampil sebagai 0 agar sumbu-X konsisten
- `CustomXTick` tidak lagi hardcode highlight bulan "Apr" — sekarang highlight titik data terakhir (`isLast`)
- Tambah state kosong "Memuat data tren..." saat data belum masuk

### ⚠️ Belum termasuk scope ini (tetap hardcoded, menunggu Phase 8)
- 3 stat cards atas (Peningkatan Tertinggi, Penurunan Terbesar, Total Kasus Aktif) — F22, butuh `GET /api/forecasting/stats`
- 3 alert cards rekomendasi obat di bawah chart — F23, butuh `GET /api/forecasting/alerts`

### 🧪 Verifikasi
- Sama seperti 06-01: dijalankan via `npm run dev` lokal port 3000 (container Docker frontend dihentikan sementara), login `carmen@sehatterus.id`, screenshot menunjukkan tooltip chart cocok persis dengan response `GET /api/cases/temporal` (contoh: April → DBD 28, ISPA 85), tidak ada console error

---

## 2026-07-02 — Session: Phase 6 Plan 06-01 — Dashboard Summary Integration

### ✅ Diselesaikan

#### Frontend — Dashboard MIS (F09, F10, F11)
- `frontend/src/app/(dashboard)/page.tsx` sekarang fetch `GET /api/cases/summary` (mengikuti filter `dateRange` yang sudah ada untuk peta spasial)
- Tabel penyakit — render dinamis dari `top_diseases` (kode ICD-10, nama, jumlah), ganti 5 baris hardcoded (ISPA/DBD/Diare/Flu/Darah Tinggi) dan ID palsu `#89094`/`#85252`
- Donut chart "Komposisi Penyakit" — segmen `stroke-dasharray`/`stroke-dashoffset` dihitung dari `persen` real per penyakit, bukan array statis
- Legend donut pakai alias singkat (`shortDiseaseLabel` — ambil singkatan dalam kurung atau setelah `/`) supaya nama medis panjang dari API tidak overflow di kotak legend
- `ActivePatientsCard` ("Total Pasien Aktif") menerima `totalPatients` dari `summary.active_patients`

### ⚠️ Ditemukan (di luar scope, belum diperbaiki)
- Build produksi frontend (`npm run build` / `docker compose build frontend`) gagal: `frontend/src/app/(auth)/register/page.tsx` mengimpor `registerUser` yang tidak lagi diekspor dari `@/lib/auth.client`. Sudah ada sebelum sesi ini (bukan bagian dari perubahan Plan 06-01). Container `frontend` di Docker Compose saat ini masih menjalankan image lama (pre-built) karena tidak ada volume mount untuk dev — perlu rebuild image begitu bug ini diperbaiki agar perubahan Plan 06-01 ini live di container.

### 🧪 Verifikasi
- Dijalankan via `npm run dev` lokal di port 3000 (container Docker frontend dihentikan sementara untuk membebaskan port, lalu di-restart setelah selesai) karena CORS backend hanya mengizinkan origin `http://localhost:3000`
- Login sebagai `carmen@sehatterus.id`, screenshot dashboard menunjukkan tabel/donut/stat card terisi data real (`total_kasus`, `top_diseases`) dari `GET /api/cases/summary`, tidak ada console error

---

## 2026-06-30 — Session: Backend Auth + Full Database Setup

### ✅ Diselesaikan

#### Backend — Autentikasi (F01)
- Endpoint `POST /api/auth/login` — validasi bcrypt, return JWT via cookie `st_auth` (HttpOnly) + `st_user` (readable)
- Endpoint `POST /api/auth/logout` — clear kedua cookie
- Endpoint `GET /api/auth/me` — ambil data pengguna dari JWT (dilindungi `requireAuth` middleware)
- Swagger UI tersedia di `GET /api/docs` + spec JSON di `GET /api/docs.json`

#### Backend — Models Baru (semua tabel schema)
Dibuat 13 Sequelize model baru menggunakan `declare` (tidak shadow getter Sequelize):

| Model | Tabel | Keterangan |
|-------|-------|------------|
| `Wilayah` | `wilayah` | 17 kecamatan Sleman |
| `FasilitasKesehatan` *(update)* | `fasilitas_kesehatan` | Tambah `wilayah_id`, `lat`, `long` |
| `Pengguna` | `pengguna` | Akun internal + bcrypt hash |
| `Obat` | `obat` | 14 item (12 obat jadi + 2 bahan baku) |
| `Pbf` | `pbf` | 3 distributor farmasi |
| `FormulaRacikan` | `formula_racikan` | 2 formula |
| `FormulaKomponen` | `formula_komponen` | Junction formula ↔ obat |
| `RekamMedis` *(update)* | `RekamMedis` | Tambah `faskes_id` |
| `Resep` | `resep` | Header resep |
| `ResepItem` | `resep_item` | Item resep (obat atau racikan) |
| `Stok` | `stok` | 15 baris per faskes per batch |
| `PergerakanStok` | `pergerakan_stok` | 15 baris masuk awal |
| `AlertEws` | `alert_ews` | 5 sample alert |
| `PrediksiKebutuhan` | `prediksi_kebutuhan` | 6 prediksi Juli 2026 |
| `SuratPesanan` | `surat_pesanan` | 1 SP draf |
| `SpItem` | `sp_item` | 2 item SP |

#### Backend — Seeders
- `npm run seed:auth` — seed `fasilitas_kesehatan` (2) + `pengguna` (4) dengan bcrypt
- `npm run seed:all` — seed lengkap semua tabel (idempotent, aman dijalankan ulang)

#### Frontend — Auth Integration
- `auth.client.ts` — fungsi `loginWithApi()` dan `logoutFromApi()` yang panggil API backend
- `login/page.tsx` — ganti `validateCredentials()` lokal → `loginWithApi()`
- `.env.local` — tambah `NEXT_PUBLIC_API_URL=http://localhost:5000`

#### Infrastructure
- Install deps backend: `bcryptjs`, `jsonwebtoken`, `swagger-ui-express`, `swagger-jsdoc`, `cookie-parser`
- `tsconfig.json` tambah `removeComments: false` agar Swagger JSDoc survive TS compile
- `Dockerfile` backend: ganti `npm ci` → `npm install` (workspace monorepo tidak punya backend-level lockfile)
- Tambah `JWT_SECRET=st-jwt-secret-2026` ke `.env`

### 🔄 Status Fitur Berubah

| ID | Fitur | Sebelum | Sesudah |
|----|-------|---------|---------|
| F01 | Login email & password | ❌ | ✅ |
| F02 | Logout | ❌ | 🟡 |
| F03 | Load profil dari token | ❌ | 🟡 |

### 📁 File Baru / Diubah

```
backend/src/
├── models/
│   ├── index.ts              ← diupdate (semua model + asosiasi)
│   ├── RekamMedis.ts         ← diupdate (tambah faskes_id, fix declare)
│   ├── FasilitasKesehatan.ts ← diupdate (tambah wilayah_id, lat, long)
│   ├── Pengguna.ts           ← baru
│   ├── Wilayah.ts            ← baru
│   ├── Obat.ts               ← baru
│   ├── Pbf.ts                ← baru
│   ├── FormulaRacikan.ts     ← baru
│   ├── FormulaKomponen.ts    ← baru
│   ├── Resep.ts              ← baru
│   ├── ResepItem.ts          ← baru
│   ├── Stok.ts               ← baru
│   ├── PergerakanStok.ts     ← baru
│   ├── AlertEws.ts           ← baru
│   ├── PrediksiKebutuhan.ts  ← baru
│   ├── SuratPesanan.ts       ← baru
│   └── SpItem.ts             ← baru
├── middleware/
│   └── auth.ts               ← baru (requireAuth JWT middleware)
├── controllers/
│   └── auth.ts               ← baru (login, logout, me)
├── routes/
│   └── auth.ts               ← baru (+ Swagger JSDoc)
├── config/
│   └── swagger.ts            ← baru
├── seedAuth.ts               ← baru
└── seedAll.ts                ← baru

frontend/src/
├── lib/
│   └── auth.client.ts        ← diupdate (loginWithApi, logoutFromApi)
└── app/(auth)/login/page.tsx ← diupdate (pakai loginWithApi)

.env                          ← diupdate (tambah JWT_SECRET)
frontend/.env.local           ← baru
.planning/
├── FEATURES-MAP.md           ← baru
├── CHANGELOG.md              ← baru (file ini)
└── DECISIONS.md              ← baru
```

### 🐛 Masalah & Solusi

| Masalah | Solusi |
|---------|--------|
| `st_user` cookie double-encoded | Hapus `encodeURIComponent()` di backend — Express sudah encode otomatis |
| Sequelize warning "public class fields shadowing getters" | Ganti `public id!: string` → `declare id: string` di semua model |
| Docker build gagal (`npm ci` lock file mismatch) | Ganti ke `npm install` di Dockerfile (workspace monorepo tidak maintain backend lockfile terpisah) |
| Swagger paths kosong di Docker prod | Tambah `removeComments: false` di `tsconfig.json` agar JSDoc survive compile |
| Docker Hub 500 saat `docker compose build` | Tunggu beberapa menit, coba lagi |

---

## 2026-06-24 — Session: Phase 3 Selesai

- Implementasi GIS aggregation endpoints (`/api/cases/spatial`, `/temporal`, `/region/:name`)
- Choropleth map dengan Leaflet di dashboard
- Region detail panel + time-series Recharts chart
- **Status:** Phase 3 complete (3/5 phases)

---

## 2026-06-22 — Session: Phase 2 Selesai

- Seeder `RekamMedis` dengan Faker.js (5.500 records)
- Validasi GeoJSON kecamatan Sleman

---

## 2026-06-21 — Session: Phase 1 Selesai

- Scaffold Next.js 15 + Express.js + PostgreSQL
- Docker Compose setup
- Sequelize model `RekamMedis` + migration

---

*Diperbarui oleh Claude Code setiap sesi*
