# TPS-PLAN.md — Rencana Sistem TPS (Transaction Processing System)
### Public Health Radar — Backend

> **Untuk AI agent (Claude Code / GSD):** Dokumen ini merencanakan pembangunan lapisan TPS.
> Rujuk `SCHEMA.md` (struktur tabel), `API.md` (kontrak endpoint), `CLAUDE.md` (stack & konvensi).
> TPS = lapisan DATA MASUK. **API + Swagger saja, TANPA UI.**

---

## 1. Konteks & Ruang Lingkup

TPS adalah lapisan yang menerima & menyimpan transaksi mentah harian, yang kemudian
diolah oleh lapisan MIS menjadi surveilans, prediksi, dan keputusan logistik.

**Realita lapangan:** di klinik Indonesia, TPS sudah ada dalam bentuk SIMKlinik + RME
(wajib per PMK 24/2022, terintegrasi SATUSEHAT). Sistem ini TIDAK menggantikan SIMKlinik —
ia memposisikan diri sebagai lapisan analitik di atas data yang sudah ada.

**Untuk MVP/tugas akhir:** data TPS diisi lewat **seeding simulasi**, bukan integrasi nyata.
Namun struktur data dirancang **mendekati format FHIR/SATUSEHAT** agar siap integrasi di masa depan.

**Stack:** TypeScript, Express, Sequelize (sequelize-typescript), PostgreSQL, JWT, Zod, Swagger.

### Yang termasuk scope TPS
- Endpoint untuk menerima/menyimpan transaksi (POST) + membaca (GET) untuk konsumsi MIS.
- Seeder data simulasi yang realistis.
- Validasi input, transaksi DB, audit trail.

### Yang TIDAK termasuk scope TPS
- UI/frontend (tidak ada).
- Logika agregasi/prediksi (itu ranah MIS).
- Integrasi SATUSEHAT nyata (roadmap masa depan, cukup selaraskan struktur).

---

## 2. Prinsip Desain

1. **Selaras FHIR/SATUSEHAT.** Gunakan ICD-10 untuk diagnosis. Beri penamaan field yang mudah
   dipetakan ke resource FHIR nanti (lihat bagian 6).
2. **Transaksi DB.** Setiap operasi yang mengubah stok (resep, penerimaan, realokasi, penyesuaian)
   dibungkus transaksi agar konsisten.
3. **Validasi ketat.** Semua request body divalidasi Zod sebelum masuk service.
4. **Normalisasi wilayah.** `kecamatan_domisili` dinormalisasi agar cocok dgn `wilayah.nama_kecamatan`.
5. **RBAC.** Endpoint TPS dibatasi peran (lihat API.md). Data difilter per faskes pengguna.
6. **Audit trail.** Semua perubahan stok tercatat di `pergerakan_stok`.

---

## 3. Komponen TPS (5 sub-sistem)

### TPS-1 — Kunjungan & Diagnosis
- **Tabel:** `rekam_medis`
- **Peran:** sumber utama data penyakit (surveilans, forecasting, EWS).
- **Endpoint:** `POST /api/rekam-medis`, `POST /api/rekam-medis/bulk`, `GET /api/rekam-medis`
- **Aturan:** validasi kode ICD-10; normalisasi `kecamatan_domisili`; `faskes_id` valid.
- **Edge case:** kode ICD-10 tidak dikenal → tolak dgn pesan jelas; kecamatan tidak ada di master → tolak.

### TPS-2 — Resep & Dispensing
- **Tabel:** `resep`, `resep_item`
- **Peran:** sumber data konsumsi obat (penghubung penyakit → obat). Memicu penguraian racikan.
- **Endpoint:** `POST /api/resep`, `GET /api/resep/:id`
- **Aturan kritis:**
  - `resep_item` berisi `obat_id` ATAU `formula_id` (validasi XOR).
  - Jika `formula_id`: baca `formula_komponen`, kurangi stok tiap komponen sebesar `takaran * jumlah`.
  - Seluruh operasi dalam 1 transaksi DB. Jika stok tak cukup → rollback + error.
- **Edge case:** stok komponen habis; formula tidak punya komponen; jumlah ≤ 0.

### TPS-3 — Stok & Inventori
- **Tabel:** `stok`
- **Peran:** kondisi stok terkini per faskes/obat/batch. Sumber near-expiry & dead-stock.
- **Endpoint:** `POST /api/stok/penerimaan`, `POST /api/stok/penyesuaian`, `GET /api/stok`
- **Aturan:** penerimaan menambah stok + catat `pergerakan_stok` tipe 'masuk';
  penyesuaian mengubah stok + catat tipe 'penyesuaian' dgn alasan.
- **Edge case:** batch/ED duplikat (pakai unique key gabungan); penyesuaian negatif melebihi stok.

### TPS-4 — Pergerakan Stok (termasuk realokasi antar-cabang)
- **Tabel:** `pergerakan_stok`
- **Peran:** audit trail semua pergerakan; mendukung realokasi antar-cabang.
- **Endpoint:** `POST /api/stok/realokasi`, `GET /api/stok/pergerakan`
- **Aturan:** realokasi = kurangi stok `faskes_asal`, tambah stok `faskes_tujuan`,
  catat 1 baris tipe 'realokasi' dalam 1 transaksi.
- **Edge case:** stok asal tak cukup; asal = tujuan; obat tak ada di asal.

### TPS-5 — Pengadaan (Surat Pesanan)
- **Tabel:** `surat_pesanan`, `sp_item`
- **Peran:** transaksi pengadaan ke PBF. Dipicu dari defekta MIS, direalisasikan sebagai TPS.
- **Endpoint:** `POST /api/mis/logistik/surat-pesanan`, `GET /api/mis/logistik/surat-pesanan`,
  penerimaan barang masuk lewat TPS-3 (`/api/stok/penerimaan`) dengan referensi ke SP.
- **Aturan kritis:** kelompokkan per `pbf_id`; item golongan `npp` WAJIB SP terpisah (`jenis='npp'`),
  hanya boleh dibuat/ditandatangani apoteker (punya `nomor_sipa`).
- **Edge case:** item campuran reguler+NPP → pecah otomatis; PBF tidak dipilih; jumlah disetujui = 0.

---

## 4. Pemecahan Fase GSD

> Sesuaikan nomor fase dengan roadmap Anda. Fase seeding rekam_medis (02-02) sudah ada — TPS
> melengkapinya. Urutan mengikuti dependensi (integritas referensial).

### Fase T0 — Fondasi TPS
Middleware (auth JWT, RBAC, error handler terpusat), setup validasi Zod, helper transaksi DB,
format response standar. (Models & migrations diasumsikan sudah dibuat dari SCHEMA.md.)

### Fase T1 — TPS Kunjungan & Diagnosis + Seeding
Endpoint rekam-medis + seeder ≥5.000 record realistis (lihat bagian 5).

### Fase T2 — TPS Resep & Dispensing
Endpoint resep + logika penguraian racikan (transaksi DB) + seeder resep terhubung ke rekam_medis.

### Fase T3 — TPS Stok & Pergerakan
Endpoint stok (penerimaan, penyesuaian, baca), realokasi, pergerakan + seeder stok awal & batch.

### Fase T4 — TPS Pengadaan (Surat Pesanan)
Endpoint SP (buat per PBF, pisah NPP), riwayat SP, koneksi penerimaan barang → stok.

### Fase T5 — Swagger & Testing TPS
Lengkapi anotasi Swagger semua endpoint TPS; test Jest+Supertest untuk alur kritis
(resep+racikan, realokasi, SP NPP).

---

## 5. Strategi Seeding (data simulasi realistis)

Agar MIS bisa diverifikasi, data seed harus realistis, bukan acak murni:

- **Volume:** ≥5.000 `rekam_medis` (sesuai plan 02-02), tersebar 12–24 bulan ke belakang.
- **Wilayah:** fokus kecamatan di DI Yogyakarta & Jawa Tengah (cocokkan dgn master `wilayah`).
- **Distribusi penyakit realistis:** ICD-10 umum layanan primer — ISPA (J06), diare (A09),
  DBD (A90), hipertensi (I10), dsb. Beri **pola musiman** (mis. diare naik musim hujan)
  agar forecasting & EWS punya pola untuk dideteksi.
- **Anomali sengaja:** sisipkan 1–2 lonjakan tajam (>200% dalam 3 hari) di kecamatan tertentu
  agar EWS bisa diuji memicu alert.
- **Keterhubungan:** tiap kunjungan menghasilkan resep; resep mengurangi stok; sebagian resep
  berupa racikan (untuk menguji penguraian). Sediakan stok awal + beberapa batch near-expiry
  dan beberapa item slow-moving (untuk menguji dead-stock).

**Urutan seeding (jaga integritas referensial):**
`wilayah` → `fasilitas_kesehatan` → `pengguna` → `obat` → `pbf` → `formula_racikan`+`formula_komponen`
→ `stok` (awal) → `rekam_medis` → `resep`+`resep_item` (kurangi stok) → `pergerakan_stok`
→ (opsional) `prediksi_kebutuhan` & `alert_ews` dummy untuk uji tampilan MIS.

Gunakan `sequelize-cli` seeders. Buat data deterministik (seedable RNG) agar reproducible.

---

## 6. Keselarasan FHIR / SATUSEHAT (untuk masa depan)

Rancang field agar mudah dipetakan nanti (tidak diimplementasikan sekarang, hanya diselaraskan):

| Tabel TPS | Perkiraan resource FHIR | Catatan |
|-----------|-------------------------|---------|
| `rekam_medis` | Encounter + Condition | `kode_icd10` → Condition.code (sistem ICD-10) |
| `resep` / `resep_item` | MedicationRequest | tautkan ke Encounter |
| `obat` | Medication | `kode_atc` membantu pemetaan |
| dispensing (efek resep) | MedicationDispense | pengurangan stok = dispense |
| `stok`, `pergerakan_stok` | operasional (di luar core clinical FHIR) | tidak wajib FHIR |

> Prinsip: JANGAN implementasi FHIR penuh sekarang. Cukup jaga penamaan & pakai ICD-10 standar
> supaya adapter FHIR bisa ditambahkan sebagai fase masa depan tanpa merombak skema.

---

## 7. Success Criteria (per fase)

- **T0:** middleware auth+RBAC+error handler jalan; request invalid ditolak Zod dgn pesan jelas.
- **T1:** endpoint rekam-medis berfungsi; seeder mengisi ≥5.000 record valid; GET bisa difilter
  tanggal/kecamatan/ICD-10.
- **T2:** POST resep mengurangi stok komponen dgn benar (termasuk racikan) dalam transaksi;
  rollback saat stok kurang; test lulus.
- **T3:** penerimaan/penyesuaian/realokasi mengubah stok & mencatat pergerakan dgn benar;
  stok multi-batch terlacak; realokasi konsisten (asal turun, tujuan naik).
- **T4:** pembuatan SP mengelompokkan per PBF & memisahkan item NPP ke SP tersendiri;
  hanya apoteker boleh SP NPP.
- **T5:** `/api-docs` memuat semua endpoint TPS lengkap & bisa dites; test alur kritis hijau.

---

## 8. Arahan discuss-phase (siap tempel ke GSD)

**Fase T0 — Fondasi TPS**
> Bangun fondasi lapisan TPS sesuai TPS-PLAN.md & CLAUDE.md. Buat middleware auth JWT,
> middleware RBAC berbasis peran, error handler terpusat, setup validasi Zod, helper transaksi
> Sequelize, dan format response standar { success, data, error }. Belum buat endpoint domain di fase ini.

**Fase T1 — Kunjungan & Diagnosis + Seeding**
> Implementasikan endpoint rekam-medis (API.md bagian 4) + validasi Zod + normalisasi kecamatan.
> Buat seeder sequelize-cli untuk ≥5.000 rekam_medis realistis sesuai TPS-PLAN.md bagian 5
> (distribusi penyakit musiman + anomali untuk uji EWS). Data deterministik/reproducible.

**Fase T2 — Resep & Dispensing**
> Implementasikan endpoint resep (API.md bagian 5). PENTING: POST /api/resep harus menguraikan
> racikan (baca formula_komponen, kurangi stok tiap komponen) dalam SATU transaksi DB, rollback
> bila stok kurang. Validasi XOR obat_id vs formula_id. Tambah seeder resep terhubung ke rekam_medis.

**Fase T3 — Stok & Pergerakan**
> Implementasikan endpoint stok & pergerakan (API.md bagian 6): penerimaan, penyesuaian, realokasi,
> baca stok, audit trail. Semua yang mengubah stok pakai transaksi + catat pergerakan_stok.
> Dukung multi-batch & tanggal kedaluwarsa. Seed stok awal termasuk item near-expiry & slow-moving.

**Fase T4 — Pengadaan (Surat Pesanan)**
> Implementasikan pembuatan & riwayat Surat Pesanan (API.md bagian 9 bagian SP). Backend WAJIB
> mengelompokkan item per pbf_id dan memisahkan item golongan 'npp' ke SP jenis='npp' tersendiri
> yang hanya boleh dibuat apoteker (punya nomor_sipa). Hubungkan penerimaan barang ke stok.

**Fase T5 — Swagger & Testing**
> Lengkapi anotasi JSDoc Swagger di semua route TPS, pastikan /api-docs lengkap & dapat dites.
> Tulis test Jest+Supertest untuk alur kritis: resep+racikan (pengurangan stok), realokasi antar-cabang,
> dan pemisahan SP NPP.

---

## 9. Catatan Penting

- Untuk MVP, TPS diisi seeding — TIDAK integrasi SATUSEHAT nyata (butuh registrasi resmi & verifikasi Dinkes).
- Fokus diferensiasi sistem ada di MIS (prediksi tren penyakit, realokasi, EWS), bukan di TPS.
- Jaga struktur TPS selaras ICD-10/FHIR agar kredibel di proposal & siap integrasi masa depan.
- Selalu rujuk SCHEMA.md untuk struktur tabel & 7 catatan logika bisnisnya (racikan, NPP, dsb).
