---
title: Architecture Decisions — SehatTerus
tags:
  - decisions
  - architecture
---

# 🏛️ Architecture Decisions — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Catatan keputusan arsitektur dan teknis penting beserta alasannya.
> Berguna ketika ada pertanyaan "kenapa dibuat begini?" di kemudian hari.

---

## ADR-001 — Cookie HttpOnly untuk JWT (bukan localStorage)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
JWT disimpan di cookie `st_auth` yang bersifat HttpOnly dan SameSite=Lax.
Cookie kedua `st_user` (non-HttpOnly) menyimpan data display user (nama, email).

**Alasan:**
- HttpOnly mencegah XSS mengakses token
- Next.js middleware server-side dapat membaca cookie HttpOnly untuk proteksi route
- `st_user` non-HttpOnly tetap dibutuhkan agar `getUserFromCookie()` di client bisa baca nama user tanpa harus panggil `/api/auth/me` setiap render

**Alternatif yang ditolak:**
- localStorage → rentan XSS, tidak bisa dibaca server-side middleware
- Bearer token manual → perlu tambah header di setiap fetch, lebih kompleks

---

## ADR-002 — Sequelize `sync({ alter: true })` bukan Migration Files

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Menggunakan `sequelize.sync({ alter: true })` di seeders untuk membuat/mengupdate tabel,
bukan Sequelize migration files (`sequelize-cli migrate`).

**Alasan:**
- Project ini adalah MVP university project, bukan production system
- `alter: true` lebih cepat untuk iterasi development
- Seeder sudah idempotent (`findOrCreate`) sehingga aman dijalankan berulang

**Risiko:**
- `alter: true` bisa kehilangan data jika tipe kolom berubah drastis
- Tidak ada rollback mechanism seperti migration

**Mitigasi:**
- Seeder selalu pakai `findOrCreate` (tidak truncate)
- Data RekamMedis (5.500 records) di-seed terpisah dan bisa di-regenerate

---

## ADR-003 — Tabel `RekamMedis` nama PascalCase (bukan snake_case)

**Tanggal:** 2026-06-30
**Status:** Aktif (legacy, tidak diubah)

**Keputusan:**
Tabel di PostgreSQL bernama `"RekamMedis"` (PascalCase dengan quotes), bukan `rekam_medis`.

**Alasan:**
Dibuat di Phase 1 sebelum konvensi snake_case ditetapkan di SCHEMA.md.
Mengubah nama tabel sekarang akan break existing 5.500 records dan semua query di `/api/cases/*`.

**Konsekuensi:**
Inkonsistensi dengan tabel lain yang semuanya snake_case.
Jika di-refactor di masa depan, perlu `ALTER TABLE "RekamMedis" RENAME TO rekam_medis` + update semua model dan controller.

---

## ADR-004 — Dockerfile Backend: `npm install` bukan `npm ci`

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Dockerfile backend menggunakan `npm install` (bukan `npm ci`) di kedua stage.

**Alasan:**
Project ini adalah npm workspace monorepo. `npm install` dari dalam folder `backend/`
menulis ke root `package-lock.json`, bukan ke `backend/package-lock.json`.
Sehingga `backend/package-lock.json` menjadi stale dan `npm ci` (yang membutuhkan lock file sync) selalu gagal.

**Konsekuensi:**
Build Docker sedikit lebih lambat dan tidak 100% reproducible.
Untuk production yang sebenarnya, solusi yang lebih baik adalah pindahkan backend ke monorepo dengan lock file terpusat atau pisahkan menjadi repo terpisah.

---

## ADR-005 — `removeComments: false` di tsconfig Backend

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Menambahkan `"removeComments": false` di `backend/tsconfig.json`.

**Alasan:**
`swagger-jsdoc` membaca komentar `@openapi` JSDoc dari file source untuk generate spec.
TypeScript by default strip semua comments saat compile ke JS.
Di Docker, hanya file `dist/*.js` yang ada — tanpa flag ini Swagger spec kosong di production.

**Efek samping:**
File `dist/` sedikit lebih besar karena semua comments ikut ter-compile.
Tidak ada dampak fungsional lain.

---

## ADR-006 — Dual Cookie Pattern (`st_auth` + `st_user`)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Backend set 2 cookie terpisah saat login:
- `st_auth` — JWT token, HttpOnly, SameSite=Lax, MaxAge 7 hari
- `st_user` — JSON `{email, name, displayName}`, non-HttpOnly, MaxAge 7 hari

**Alasan:**
Next.js middleware (server-side) membaca `st_auth` untuk proteksi route.
Frontend React components membaca `st_user` untuk tampilkan nama user di header/sidebar.
Karena `st_auth` HttpOnly tidak bisa dibaca JS browser, butuh cookie kedua untuk data display.

**Alternatif yang ditolak:**
- Panggil `GET /api/auth/me` di setiap komponen → terlalu banyak request
- Simpan user di localStorage → tidak aman + tidak sinkron dengan cookie auth

---

## ADR-007 — Swagger JSDoc di Route Files (bukan terpisah)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Dokumentasi Swagger ditulis sebagai JSDoc comment langsung di file `src/routes/*.ts`,
bukan di file `.yaml` terpisah atau di controller.

**Alasan:**
- Dokumentasi dekat dengan definisi route → lebih mudah di-maintain
- `swagger-jsdoc` + `tsconfig removeComments: false` sudah handle parsing otomatis
- Tidak perlu tool eksternal atau step generate manual

---

## ADR-008 — Realokasi Stok: Satu Baris `pergerakan_stok` (bukan 2 baris keluar+masuk)

**Tanggal:** 2026-07-02
**Status:** Aktif

**Keputusan:**
`POST /api/stok/realokasi` (Phase 7, Plan 07-02) mencatat **satu** baris `pergerakan_stok`
dengan `tipe='realokasi'`, `faskes_asal` DAN `faskes_tujuan` terisi sekaligus di baris yang sama.
`API-SPEC.md` versi awal menyebut "Insert 2 baris pergerakan_stok (keluar + masuk)" — implementasi
sengaja menyimpang dari deskripsi teks itu.

**Alasan:**
- Model `PergerakanStok` (dan `CREATE TYPE` di `SCHEMA.md`) sudah punya kolom `faskes_asal`
  *dan* `faskes_tujuan` di baris yang sama, plus enum `tipe` sudah punya nilai `'realokasi'`
  tersendiri (terpisah dari `'masuk'`/`'keluar'`) — desain skema jelas dimaksudkan untuk satu
  baris gabungan, bukan sepasang baris `keluar`+`masuk` seperti pola di `resep.ts`.
- Satu baris lebih auditable: satu event = satu baris, tidak perlu korelasikan 2 baris terpisah
  lewat `referensi` untuk tahu itu 1 transaksi yang sama.
- `pergerakan_stok` tidak punya kolom `batch`/`tanggal_kedaluwarsa` — jadi granularitas per-batch
  tetap dijaga di level `stok` (FEFO deduct di asal, carry-over batch/expiry yang sama ke tujuan),
  bukan di `pergerakan_stok`.

**Alternatif yang ditolak:**
- 2 baris terpisah (`keluar` di asal + `masuk` di tujuan) sesuai teks literal API-SPEC.md — ditolak
  karena tidak memanfaatkan kolom `faskes_asal`+`faskes_tujuan` ganda yang sudah ada di skema, dan
  menambah kompleksitas query untuk merekonstruksi "siapa pindah ke siapa" dari 2 baris terpisah.

**Dampak dokumentasi:** `API-SPEC.md` bagian `POST /api/stok/realokasi` masih menyebut "2 baris" di
teks aslinya — response API yang sebenarnya (dan perilaku DB) mengikuti keputusan ADR ini.

---

## ADR-009 — Modal/Popup Overlay WAJIB Portal ke `document.body`

**Tanggal:** 2026-07-02
**Status:** Aktif

**Keputusan:**
Semua komponen popup full-screen (`ConfirmModal`, `AlertDetailModal`, `EditProfileModal`,
`NotificationPanel`) me-render kontennya lewat `createPortal(<Modal/>, document.body)`,
bukan `return <div>...</div>` langsung di tempat komponen itu dipanggil dalam tree React.

**Alasan:**
Setiap halaman dashboard punya wrapper div root dengan `position: relative; z-index: 10`
(dipakai supaya konten halaman tampil di atas 3 blob dekoratif blur di root layout). Div ini
**membentuk stacking context CSS baru**. Modal manapun yang di-render sebagai descendant di
dalam wrapper itu (biasanya lewat `PageHeader` atau langsung di JSX halaman) — walau punya
`z-index` setinggi apapun secara internal (mis. `z-[1100]`) — **tidak bisa "bocor keluar"**
untuk dibandingkan langsung dengan elemen di luar wrapper itu, seperti `Sidebar.tsx`
(`z-[1001]`, di luar wrapper). Yang dibandingkan di level root cuma kontribusi z-index milik
wrapper-nya sendiri (10), bukan z-index modal yang tertanam di dalamnya — jadi Sidebar (1001)
selalu menang walau modal internalnya 1100.

`createPortal` ke `document.body` membuat modal jadi **direct child dari `<body>`** di DOM,
keluar total dari stacking context wrapper halaman manapun — perbandingan z-index-nya jadi
langsung di level root, terlepas dari halaman mana yang memanggilnya atau berapa pun z-index
wrapper halaman itu di masa depan.

**Cara verifikasi yang benar (bukan screenshot):**
`document.elementFromPoint(x, y)` di browser sungguhan pada titik yang tertutup elemen lain
(mis. area Sidebar) untuk konfirmasi elemen mana yang benar-benar di render teratas. Screenshot
visual **tidak cukup** untuk bug stacking-context — efek blur 4px itu halus dan gampang salah
dinilai "sudah benar" dari mata telanjang, apalagi kalau elemen yang seharusnya ke-blur sudah
punya tampilan semi-transparan sebagai default-nya (seperti `Sidebar.tsx` yang punya
`backdrop-blur-md` sendiri).

**Alternatif yang ditolak:**
- Naikkan z-index modal lebih tinggi lagi tanpa portal — TIDAK akan pernah cukup selama modal
  masih ter-nest di dalam wrapper halaman yang punya z-index sendiri; z-index modal internal
  tidak pernah dibandingkan langsung ke elemen di luar wrapper-nya
- Hapus/turunkan `z-10` dari wrapper tiap halaman — rapuh (harus konsisten diterapkan ke semua
  halaman baru selamanya) dan berisiko merusak hubungan wrapper itu dengan blob dekoratif
  (`z-0`) di root layout yang jadi alasan `z-10` itu ada

**Dampak untuk komponen popup baru di masa depan:** kalau bikin komponen modal/overlay baru,
WAJIB pakai pola `createPortal(..., document.body)` yang sama — jangan `return <div className="fixed inset-0">`
langsung.

---

## ADR-010 — Merge Parsial `feat/disease-api-integration` (bukan Merge Penuh)

**Tanggal:** 2026-07-03
**Status:** Aktif

**Keputusan:**
Branch teman satu kelompok (`TonyKeys`, `feat/disease-api-integration`) diambil **manual &
selektif** ke branch baru `feat/logistic-ai-integration`, bukan lewat `git merge` biasa.

**Alasan:**
Branch itu ternyata dibuat dari snapshot project yang jauh lebih lama (`git log` menunjukkan
commit pertamanya adalah *root commit* tanpa parent, lalu di-splice manual ke histori lama kita
lewat commit "resolve merge conflicts") — dari sebelum Phase 5 (TPS) dan Phase 7 (EWS + stok)
ada. `app.ts` versi branch itu tidak mengimpor `tps`/`alerts`/`stok` router sama sekali. Kalau
di-merge polos, ketiga router yang sudah kita bangun akan **hilang**.

**Yang diambil (ditambahkan manual ke `backend/src/`):**
- `controllers/ai.ts` + `routes/ai.ts` — `POST /api/ai/analyze`, ringkasan situasi penyakit via
  Groq LLM (`llama-3.1-8b-instant`). Fitur baru, di luar 37 fitur di `FEATURES-MAP.md`. Butuh
  env var `GROQ_API_KEY` (ditambahkan ke `.env.example` & `docker-compose.yml`) — tanpa key ini
  endpoint akan gagal saat dipanggil, bukan saat startup.
- `controllers/logistic.ts` + `routes/logistic.ts` — mengisi gap F24 (stock chart), F26 (stat
  cards logistik), F27 (near-expiry), F31 (list surat pesanan) yang sebelumnya masih 🟠 BE
  Pending. **`getAlerts` dari versi teman TIDAK diambil** — duplikat dari `alerts.ts` kita yang
  jauh lebih lengkap (ada filter status, detail per-id, stats, summary, PATCH).
- `controllers/auth.ts` — fungsi `register()` + `POST /api/auth/register`, **backend-only**.

**Yang sengaja TIDAK diambil:**
- Seluruh duplikat `.planning/*` dari snapshot lama branch itu (versi kita lebih baru).
- `app.ts`, `cases.ts`, model-model versi lama (branch itu tidak punya perubahan Phase 5/7 kita).
- Frontend register page tidak disambungkan ke `POST /api/auth/register` — FE tetap pakai
  `registerUser()` di `frontend/src/lib/auth.client.ts` yang sengaja mengembalikan pesan
  "Pendaftaran mandiri dinonaktifkan, hubungi Administrator" (keputusan produk yang sudah ada
  sebelum merge ini, lihat catatan di `.planning/quick/20260702-fix-frontend-register-build/`).
  Endpoint backend disediakan untuk kebutuhan Admin/testing saja.

**Deviasi dari `API-SPEC.md`:** spec awal merencanakan endpoint logistik di bawah prefix
`GET /api/stok/*` (Tahap 5). Implementasi yang diambil dari merge ini pakai prefix
`GET /api/logistic/*` — dipertahankan apa adanya (bukan di-rename ke `/api/stok/*`) supaya kode
teman tidak diubah lebih jauh dari yang perlu. FE yang menyambungkan endpoint ini nanti (Phase 9)
harus pakai prefix `/api/logistic/*`, bukan `/api/stok/*` seperti di spec lama.

---

## ADR-011 — Forecasting Dihitung On-the-fly dari `RekamMedis`, Bukan `prediksi_kebutuhan`

**Tanggal:** 2026-07-07
**Status:** Aktif

**Keputusan:**
Ketiga endpoint `GET /api/forecasting/{projection,stats,alerts}` menghitung proyeksi kasus
langsung dari `RekamMedis` tiap request (Holt's linear trend / double exponential smoothing,
granularitas mingguan), bukan membaca dari tabel `prediksi_kebutuhan` seperti disebutkan di
draft awal `API-SPEC.md`.

**Alasan:**
`prediksi_kebutuhan` schema-nya `obat_id` + `faskes_id` + `jumlah_prediksi` — itu untuk kebutuhan
obat per faskes (dipakai `logistic.ts` di Phase 9), bukan proyeksi kasus per penyakit. Tidak ada
kolom `kode_icd10`/`nama_penyakit` di tabel itu sama sekali, dan tidak ada tabel `penyakit` atau
proyeksi-kasus lain di schema manapun. Draft `API-SPEC.md` sebelumnya salah mengira tabel ini bisa
dipakai untuk keduanya.

**Deviasi lain dari draft `API-SPEC.md`:**
- **Granularitas mingguan, bukan bulanan.** `REQUIREMENTS.md` ANL-01 minta "proyeksi 14-30 hari
  ke depan" dengan garis tren putus-putus — bucket bulanan (contoh di draft lama) terlalu kasar
  untuk horizon itu dan tidak mendukung tampilan garis putus-putus yang jelas. Minggu yang sedang
  berjalan (belum penuh 7 hari, karena query selalu sampai "sekarang") dikeluarkan dari data
  historis — kalau tidak, minggu itu selalu under-count dan mencemari fit + perbandingan
  persen_change sebagai penurunan palsu.
- **`rekomendasi_obat` (F23) tidak pakai pemetaan penyakit→obat statis.** Draft awal mencontohkan
  `{"ISPA": ["Ibu Profen", "Masker Medis"]}` yang tidak bisa diturunkan dari data manapun. Diambil
  dari riwayat `resep_item` nyata (join `RekamMedis`→`resep`→`resep_item`→`obat`/`formula_racikan`
  filter `kode_icd10`), fallback ke `alert_ews.obat_terdampak_id` untuk kode ICD-10 yang sama,
  atau array kosong kalau tidak ada sumber data nyata sama sekali — konsisten dengan keputusan
  yang sama di `POST /api/alerts/detect` (Phase 7): "tidak ada pemetaan penyakit→obat di skema".
  Karena DB cuma punya 1 baris `resep` manual sebelum ini, `seedAll.ts` ditambah beberapa baris
  `resep`/`resep_item` contoh (satu per penyakit utama di `seed.ts`: ISPA→Amoxicillin,
  Flu→Paracetamol, Diare→Oralit, DBD→Paracetamol, Hipertensi→Amlodipine) supaya fallback nyata
  ini punya sinyal untuk diuji, bukan selalu kosong.
- **Stat card caption diganti jadi generik.** Draft lama punya caption seperti "Terbanyak di
  Sleman" / "Kampanye Sanitasi Berhasil" yang tidak bisa dihitung dari data manapun. Diganti jadi
  "Proyeksi minggu depan" untuk keduanya. `penurunan_terbesar` bisa `null` kalau tidak ada
  penyakit dengan tren menurun saat itu — tidak dipaksakan jadi kartu palsu.

**Konsekuensi:** persentase perubahan (`persen_change`) bisa terlihat volatil untuk penyakit
dengan volume kasus mingguan kecil (mis. Hipertensi, ~3-4 kasus/minggu) karena data seed
(`seed.ts`) memakai bobot acak tanpa musiman yang direkayasa — ini karakteristik data asli yang
diharapkan, bukan bug.

---

## ADR-012 — `obat.pbf_id` Ditambahkan + Riwayat `pergerakan_stok` Sintetis untuk Phase 9

**Tanggal:** 2026-07-07
**Status:** Aktif

**Keputusan:**
1. Kolom nullable `pbf_id` (FK ke `pbf`) ditambahkan ke tabel/model `Obat` via `sequelize.sync({
   alter: true })` (pola yang sama dengan ADR-002), di-seed round-robin ke 3 PBF yang ada.
2. `seedAll.ts` ditambah ~150 baris `pergerakan_stok` tipe `'keluar'` sintetis (45 hari riwayat,
   ditandai `referensi='SEED-KELUAR-HIST'`) untuk obat "fast" dan "medium mover"; obat lain
   sengaja tidak diberi riwayat sama sekali — itulah kandidat slow-moving yang jujur.

**Alasan:**
- `API-SPEC.md` draft awal Domain Stok bilang defekta harus "group by `obat.pbf_id`", tapi kolom
  itu **tidak ada** di skema manapun — `pbf_id` cuma ada di `surat_pesanan` (dipilih per-order,
  bukan properti tetap katalog obat). Tanpa kolom ini, endpoint defekta (Phase 9) tidak bisa
  mengelompokkan obat per PBF sama sekali.
- Sebelum Phase 9, 38 dari 38 baris `pergerakan_stok` yang ada semuanya `tipe='masuk'` (penerimaan
  awal dari seeder Phase 1) — nyaris tidak ada baris `'keluar'` nyata (cuma dari beberapa kali
  `test-tps.ts` dijalankan). `getStats` (F26) sebelumnya menutupi ini dengan asumsi tetap
  "`jumlah_tersedia / 10`" untuk `ketahanan_hari` — sekarang diganti pakai rata-rata nyata, tapi
  itu perlu ADA data pergerakan nyata dulu untuk berarti apa-apa.

**Alternatif yang ditolak:**
- Membiarkan defekta tidak dikelompokkan sama sekali (flat list) — ditolak karena bertentangan
  dengan alur kerja yang diminta ("Buat Pesanan" per grup PBF di UI, satu SP per PBF per skema).
- Memakai data `pergerakan_stok` yang ada apa adanya (nyaris kosong) — ditolak karena `tren_harian`/
  `ketahanan_hari`/`slow-moving` semuanya akan menunjukkan nol/tak terhingga untuk hampir semua
  obat, membuat fitur terlihat tidak berfungsi walau logikanya benar.

**Konsekuensi:**
- `usulan_pesanan`, `tren_harian`, dan `ketahanan_hari` di endpoint defekta/stats sekarang
  mencerminkan pola konsumsi **buatan** (bukan data TPS nyata) untuk obat "fast"/"medium mover" —
  ini seed data historis sintetis, bukan fabrikasi runtime di response API. Kalau nanti data TPS
  nyata (`resep_item` via alur kunjungan) terkumpul cukup banyak, riwayat sintetis ini idealnya
  digantikan/diabaikan, tinggal filter `referensi != 'SEED-KELUAR-HIST'` di query terkait.

---

*Diperbarui oleh Claude Code setiap ada keputusan arsitektur baru*
