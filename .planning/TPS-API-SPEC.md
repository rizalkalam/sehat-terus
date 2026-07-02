---
title: TPS API Specification — Pencatatan Kunjungan Pasien
updated: 2026-07-02
project: SehatTerus
tags:
  - tps
  - api
  - backend
  - specification
---

# 🏥 TPS API Specification — Pencatatan Kunjungan Pasien

> [!abstract] Tentang Dokumen Ini
> Spesifikasi endpoint TPS (Transaction Processing System) untuk pencatatan kunjungan pasien
> oleh staf klinik/faskes. Endpoint ini adalah sumber data primer yang mengisi tabel `rekam_medis`,
> `resep`, `resep_item`, `stok`, dan `pergerakan_stok` — yang kemudian dikonsumsi oleh MIS dashboard.
>
> **Perbedaan TPS vs MIS:**
> - **TPS** = staf faskes input data kunjungan → menulis ke DB
> - **MIS** = manajer baca dashboard → membaca agregasi dari DB yang sama

> [!success] Status: Semua 10 Endpoint Selesai (Phase 5, 2026-07-02)
> Seluruh endpoint di dokumen ini sudah diimplementasikan di `backend/src/routes/tps.ts` +
> `backend/src/controllers/tps/{kunjungan,resep,referensi}.ts`, sesuai spesifikasi di bawah
> (termasuk validasi kecamatan, lock update/delete setelah resep dibuat, transaksi DB FEFO untuk
> potong stok, dan role check apoteker/admin untuk resep). Lulus 100% di `npm run test:tps`.
>
> **Tidak ada UI/frontend untuk TPS — ini keputusan desain, bukan yang belum dikerjakan.**
> Lihat [[TPS-PLAN]] bagian 1: "TPS = API + Swagger saja, TANPA UI." Untuk MVP, staf klinik
> dianggap sudah punya SIMKlinik/RME sendiri (wajib PMK 24/2022); sistem ini adalah lapisan
> analitik (MIS) di atas data yang masuk lewat seeder yang meniru alur TPS nyata.

---

## Status Legend

| Ikon | Artinya |
|------|---------|
| 🆕 | Perlu dibuat |
| ✅ | Sudah ada |

---

## Alur Kerja Staf Klinik

```
Pasien datang
    ↓
POST /api/tps/kunjungan          ← catat diagnosis + kecamatan domisili
    ↓
(opsional) POST /api/tps/kunjungan/:id/resep  ← tambah resep obat
    ↓ (side effect otomatis)
stok.jumlah_tersedia dikurangi   ← stok faskes berkurang
pergerakan_stok INSERT tipe=keluar  ← audit trail
```

---

## Peran yang Mengakses TPS

| Peran | Bisa Catat Kunjungan | Bisa Buat Resep |
|-------|---------------------|-----------------|
| `apoteker` | ✅ | ✅ |
| `staf_logistik` | ✅ | ❌ |
| `manajer` | ✅ | ❌ |
| `admin` | ✅ | ✅ |

> Semua endpoint TPS dilindungi `requireAuth`. `faskes_id` diambil otomatis dari JWT.

---

## 📋 Domain Kunjungan — `/api/tps/kunjungan`

### ✅ POST `/api/tps/kunjungan`

**Controller:** `src/controllers/tps/kunjungan.ts → createKunjungan()`
**Middleware:** `requireAuth`
**Tabel:** `rekam_medis`

**Deskripsi:** Mencatat satu kunjungan pasien dengan diagnosis penyakit. Ini adalah endpoint utama
pengisian data surveilans.

**Request Body:**
```json
{
  "tanggal_kunjungan": "2026-07-02",
  "kode_icd10": "J06.9",
  "nama_penyakit": "ISPA",
  "kecamatan_domisili": "Depok"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `tanggal_kunjungan` | date string (YYYY-MM-DD) | ❌ | Default: hari ini |
| `kode_icd10` | string | ✅ | Harus ada di daftar `/api/tps/referensi/penyakit` |
| `nama_penyakit` | string | ✅ | Nama awam penyakit |
| `kecamatan_domisili` | string | ✅ | Harus cocok dengan `wilayah.nama_kecamatan` |

**Validasi:**
- `kecamatan_domisili` harus ada di tabel `wilayah` (query dulu, return 400 jika tidak ketemu)
- `tanggal_kunjungan` tidak boleh lebih dari hari ini (tidak bisa input masa depan)
- `faskes_id` diambil dari `req.user.faskes_id` — tidak perlu dikirim dari FE

**Response 201:**
```json
{
  "id": "uuid",
  "tanggal_kunjungan": "2026-07-02",
  "kode_icd10": "J06.9",
  "nama_penyakit": "ISPA",
  "kecamatan_domisili": "Depok",
  "faskes_id": "uuid",
  "created_at": "2026-07-02T08:30:00.000Z"
}
```

**Response 400 (kecamatan tidak valid):**
```json
{
  "error": "Kecamatan 'Xyz' tidak ditemukan. Pastikan nama kecamatan sesuai wilayah terdaftar."
}
```

---

### ✅ GET `/api/tps/kunjungan`

**Controller:** `src/controllers/tps/kunjungan.ts → listKunjungan()`
**Middleware:** `requireAuth`
**Tabel:** `rekam_medis`

**Deskripsi:** List kunjungan pasien di faskes pengguna, default hari ini.

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `tanggal` | YYYY-MM-DD | hari ini | Filter tanggal kunjungan |
| `kode_icd10` | string | — | Filter penyakit tertentu |
| `kecamatan` | string | — | Filter kecamatan domisili |
| `page` | number | 1 | Halaman |
| `limit` | number | 20 | Item per halaman (maks 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tanggal_kunjungan": "2026-07-02",
      "kode_icd10": "J06.9",
      "nama_penyakit": "ISPA",
      "kecamatan_domisili": "Depok",
      "ada_resep": true,
      "created_at": "2026-07-02T08:30:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

> `ada_resep` = true jika ada baris di tabel `resep` dengan `rekam_medis_id` ini.

---

### ✅ GET `/api/tps/kunjungan/:id`

**Controller:** `src/controllers/tps/kunjungan.ts → getKunjunganById()`
**Middleware:** `requireAuth`
**Tabel:** `rekam_medis`, `resep`, `resep_item`, `obat`, `formula_racikan`

**Deskripsi:** Detail satu kunjungan beserta resep yang sudah dibuat (jika ada).

**Response 200:**
```json
{
  "id": "uuid",
  "tanggal_kunjungan": "2026-07-02",
  "kode_icd10": "J06.9",
  "nama_penyakit": "ISPA",
  "kecamatan_domisili": "Depok",
  "faskes_id": "uuid",
  "created_at": "2026-07-02T08:30:00.000Z",
  "resep": {
    "id": "uuid",
    "tanggal": "2026-07-02T08:35:00.000Z",
    "dibuat_oleh": "uuid-apoteker",
    "items": [
      {
        "id": "uuid",
        "tipe": "obat",
        "obat_id": "uuid",
        "nama": "Amoksisilin 500mg",
        "satuan": "strip",
        "jumlah": 2
      },
      {
        "id": "uuid",
        "tipe": "racikan",
        "formula_id": "uuid",
        "nama": "Racikan Batuk Anak",
        "jumlah": 1
      }
    ]
  }
}
```

> `resep: null` jika kunjungan belum punya resep.

---

### ✅ PUT `/api/tps/kunjungan/:id`

**Controller:** `src/controllers/tps/kunjungan.ts → updateKunjungan()`
**Middleware:** `requireAuth`
**Tabel:** `rekam_medis`

**Deskripsi:** Koreksi data kunjungan yang sudah dicatat (salah diagnosis, salah kecamatan, dll).
Hanya bisa diupdate jika **belum ada resep** yang terhubung (karena resep sudah memotong stok).

**Request Body:** (semua field opsional, kirim yang perlu diubah saja)
```json
{
  "kode_icd10": "J11",
  "nama_penyakit": "Influenza",
  "kecamatan_domisili": "Mlati",
  "tanggal_kunjungan": "2026-07-02"
}
```

**Response 200:** data kunjungan setelah update (format sama dengan GET /:id tanpa resep)

**Response 409 (sudah ada resep):**
```json
{
  "error": "Kunjungan tidak dapat diubah karena resep sudah dibuat dan stok sudah dipotong."
}
```

---

### ✅ DELETE `/api/tps/kunjungan/:id`

**Controller:** `src/controllers/tps/kunjungan.ts → deleteKunjungan()`
**Middleware:** `requireAuth`
**Tabel:** `rekam_medis`

**Deskripsi:** Hapus kunjungan yang salah input. Hanya bisa dihapus jika **belum ada resep**.

**Response 200:**
```json
{ "message": "Kunjungan berhasil dihapus." }
```

**Response 409 (sudah ada resep):**
```json
{
  "error": "Kunjungan tidak dapat dihapus karena resep sudah dibuat."
}
```

---

## 💊 Domain Resep — `/api/tps/kunjungan/:id/resep`

### ✅ POST `/api/tps/kunjungan/:id/resep`

**Controller:** `src/controllers/tps/resep.ts → createResep()`
**Middleware:** `requireAuth` + cek `peran` (`apoteker` atau `admin`)
**Tabel:** `resep`, `resep_item`, `stok`, `pergerakan_stok`, `formula_komponen`

**Deskripsi:** Membuat resep untuk kunjungan. Satu kunjungan hanya boleh punya **satu resep**.
Saat resep disimpan, stok faskes langsung dipotong dan `pergerakan_stok` dicatat.

**Request Body:**
```json
{
  "items": [
    {
      "obat_id": "uuid",
      "jumlah": 2
    },
    {
      "formula_id": "uuid",
      "jumlah": 1
    }
  ]
}
```

| Field | Keterangan |
|-------|------------|
| `obat_id` | Diisi jika item adalah obat tunggal (salah satu dari `obat_id` / `formula_id`) |
| `formula_id` | Diisi jika item adalah racikan |
| `jumlah` | Jumlah yang diberikan (dalam satuan obat) |

**Validasi:**
- Kunjungan harus ada dan milik faskes yang sama dengan `req.user.faskes_id`
- Kunjungan belum punya resep (cek tabel `resep`)
- Setiap `obat_id` harus punya stok cukup di faskes (`stok.jumlah_tersedia >= jumlah`)
- Setiap `formula_id` harus diperiksa komponen-komponennya via `formula_komponen` — semua komponen harus stok cukup
- Salah satu dari `obat_id` atau `formula_id` harus diisi per item (tidak boleh keduanya atau keduanya null)

**Side Effects (dalam satu transaksi DB):**
1. INSERT `resep` → header resep
2. INSERT `resep_item` per item
3. Untuk item `obat_id`:
   - UPDATE `stok` → kurangi `jumlah_tersedia`
   - INSERT `pergerakan_stok` tipe=`keluar`, referensi=resep.id
4. Untuk item `formula_id`:
   - SELECT `formula_komponen` WHERE `formula_id`
   - Untuk tiap komponen: UPDATE `stok` + INSERT `pergerakan_stok`

**Response 201:**
```json
{
  "id": "uuid",
  "rekam_medis_id": "uuid",
  "dibuat_oleh": "uuid-apoteker",
  "tanggal": "2026-07-02T08:35:00.000Z",
  "items": [
    {
      "id": "uuid",
      "obat_id": "uuid",
      "nama_obat": "Amoksisilin 500mg",
      "jumlah": 2,
      "stok_setelah": 78
    }
  ]
}
```

**Response 400 (stok tidak cukup):**
```json
{
  "error": "Stok tidak cukup",
  "detail": [
    {
      "obat": "Amoksisilin 500mg",
      "diminta": 5,
      "tersedia": 2
    }
  ]
}
```

**Response 409 (resep sudah ada):**
```json
{
  "error": "Kunjungan ini sudah memiliki resep."
}
```

---

## 📖 Domain Referensi — `/api/tps/referensi`

Endpoint lookup untuk mengisi dropdown di form input TPS.

### ✅ GET `/api/tps/referensi/penyakit`

**Controller:** `src/controllers/tps/referensi.ts → listPenyakit()`
**Middleware:** `requireAuth`

**Deskripsi:** Daftar kode ICD-10 yang tersedia untuk dipilih saat input kunjungan.
Data bersumber dari distinct `kode_icd10` di `rekam_medis` + daftar master yang di-hardcode.

**Response 200:**
```json
[
  { "kode_icd10": "J06.9", "nama_penyakit": "ISPA" },
  { "kode_icd10": "J11",   "nama_penyakit": "Influenza" },
  { "kode_icd10": "A09",   "nama_penyakit": "Diare" },
  { "kode_icd10": "A90",   "nama_penyakit": "DBD" },
  { "kode_icd10": "I10",   "nama_penyakit": "Darah Tinggi" }
]
```

---

### ✅ GET `/api/tps/referensi/wilayah`

**Controller:** `src/controllers/tps/referensi.ts → listWilayah()`
**Middleware:** `requireAuth`
**Tabel:** `wilayah`

**Deskripsi:** Daftar kecamatan valid untuk dropdown `kecamatan_domisili` pada form kunjungan.
Penting agar input selalu cocok dengan `wilayah.nama_kecamatan` (konsistensi heatmap).

**Response 200:**
```json
[
  { "id": "uuid", "nama_kecamatan": "Depok",    "kabupaten": "Sleman" },
  { "id": "uuid", "nama_kecamatan": "Mlati",    "kabupaten": "Sleman" },
  { "id": "uuid", "nama_kecamatan": "Ngemplak", "kabupaten": "Sleman" }
]
```

---

### ✅ GET `/api/tps/referensi/obat`

**Controller:** `src/controllers/tps/referensi.ts → listObat()`
**Middleware:** `requireAuth`
**Tabel:** `obat`, `stok`

**Deskripsi:** Daftar obat tersedia di faskes pengguna — untuk picker item resep.
Hanya tampilkan obat yang `stok.jumlah_tersedia > 0` di faskes pengguna.

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `q` | string | — | Search nama obat (partial match) |
| `golongan` | `reguler\|npp` | semua | Filter golongan obat |

**Response 200:**
```json
[
  {
    "id": "uuid",
    "nama": "Amoksisilin 500mg",
    "satuan": "strip",
    "golongan": "reguler",
    "stok_tersedia": 80
  },
  {
    "id": "uuid",
    "nama": "Parasetamol 500mg",
    "satuan": "strip",
    "golongan": "reguler",
    "stok_tersedia": 150
  }
]
```

---

### ✅ GET `/api/tps/referensi/formula`

**Controller:** `src/controllers/tps/referensi.ts → listFormula()`
**Middleware:** `requireAuth`
**Tabel:** `formula_racikan`, `formula_komponen`, `stok`

**Deskripsi:** Daftar formula racikan yang bisa dipilih untuk item resep.
Hanya tampilkan formula yang **semua komponennya** punya stok cukup di faskes pengguna (minimal 1 unit).

**Response 200:**
```json
[
  {
    "id": "uuid",
    "nama_racikan": "Racikan Batuk Anak",
    "deskripsi": "Kombinasi Ambroxol + CTM + Paracetamol",
    "komponen_count": 3,
    "stok_cukup": true
  }
]
```

---

## 📊 Ringkasan Semua Endpoint TPS

| # | Method | Endpoint | Tabel | Peran | Status |
|---|--------|----------|-------|-------|--------|
| 1 | POST | `/api/tps/kunjungan` | `rekam_medis` | Semua | ✅ |
| 2 | GET | `/api/tps/kunjungan` | `rekam_medis` | Semua | ✅ |
| 3 | GET | `/api/tps/kunjungan/:id` | `rekam_medis`, `resep`, `resep_item` | Semua | ✅ |
| 4 | PUT | `/api/tps/kunjungan/:id` | `rekam_medis` | Semua | ✅ |
| 5 | DELETE | `/api/tps/kunjungan/:id` | `rekam_medis` | Semua | ✅ |
| 6 | POST | `/api/tps/kunjungan/:id/resep` | `resep`, `resep_item`, `stok`, `pergerakan_stok` | `apoteker`, `admin` | ✅ |
| 7 | GET | `/api/tps/referensi/penyakit` | *(static + `rekam_medis`)* | Semua | ✅ |
| 8 | GET | `/api/tps/referensi/wilayah` | `wilayah` | Semua | ✅ |
| 9 | GET | `/api/tps/referensi/obat` | `obat`, `stok` | Semua | ✅ |
| 10 | GET | `/api/tps/referensi/formula` | `formula_racikan`, `formula_komponen`, `stok` | Semua | ✅ |

**Total: 10 endpoint — semua sudah diimplementasikan & lulus test integrasi (`npm run test:tps`), selesai di Phase 5 (2026-07-02)**

---

## 🛣️ Urutan Implementasi

### Tahap 1 — Core Input (paling dibutuhkan)
```
POST /api/tps/kunjungan           ← data surveilans masuk ke rekam_medis
GET  /api/tps/referensi/wilayah   ← dropdown kecamatan (validasi konsistensi nama)
GET  /api/tps/referensi/penyakit  ← dropdown ICD-10
GET  /api/tps/kunjungan           ← list hari ini
```

### Tahap 2 — Detail & Koreksi
```
GET    /api/tps/kunjungan/:id     ← detail + status resep
PUT    /api/tps/kunjungan/:id     ← koreksi salah input
DELETE /api/tps/kunjungan/:id     ← hapus yang salah
```

### Tahap 3 — Resep & Stok
```
GET  /api/tps/referensi/obat      ← picker item resep
GET  /api/tps/referensi/formula   ← picker racikan
POST /api/tps/kunjungan/:id/resep ← buat resep + potong stok (transaksi DB)
```

---

## ⚠️ Catatan Penting Implementasi

### 1. Transaksi DB untuk Resep
`POST /api/tps/kunjungan/:id/resep` WAJIB menggunakan `sequelize.transaction()`.
Jika salah satu stok tidak cukup → rollback semua, tidak ada yang terpotong.

```typescript
await sequelize.transaction(async (t) => {
  const resep = await Resep.create({ rekam_medis_id, dibuat_oleh }, { transaction: t });
  for (const item of items) {
    // cek stok, kurangi, insert pergerakan_stok
  }
});
```

### 2. Konsistensi Nama Kecamatan
`rekam_medis.kecamatan_domisili` HARUS cocok persis dengan `wilayah.nama_kecamatan`.
Jangan izinkan free-text — selalu validasi ke tabel `wilayah` sebelum INSERT.
Ini krusial agar choropleth map dan EWS bisa join dengan benar.

### 3. Nama Tabel RekamMedis (Legacy PascalCase)
Model ini menggunakan `tableName: '"RekamMedis"'` (dengan quotes karena PostgreSQL case-sensitive).
Ini legacy, jangan diubah.

### 4. Folder Structure Controller
```
backend/src/
  controllers/
    tps/
      kunjungan.ts    ← handler POST/GET/PUT/DELETE kunjungan
      resep.ts        ← handler POST resep
      referensi.ts    ← handler semua /referensi/*
  routes/
    tps.ts            ← semua route /api/tps/* di-mount di sini
```

### 5. Seeder
Tambahkan ke `seedAll.ts`: 10–20 kunjungan contoh untuk hari ini + minggu lalu
agar endpoint GET bisa langsung ditest tanpa input manual.

---

## 🔗 Keterkaitan dengan MIS

Setelah TPS endpoint aktif, data `rekam_medis` akan terisi dari input nyata.
MIS endpoint berikut langsung mendapat manfaatnya:

| MIS Endpoint (dashboard) | Membaca dari |
|--------------------------|-------------|
| `GET /api/cases/spatial` | `rekam_medis` (sudah ✅) |
| `GET /api/cases/temporal` | `rekam_medis` (sudah ✅) |
| `GET /api/cases/summary` | `rekam_medis` (sudah ✅, terhubung ke FE dashboard sejak Phase 6 Plan 06-01) |
| `GET /api/alerts/...` | `alert_ews` ← dibuat dari agregasi `rekam_medis` |

---

## 🔗 Navigasi Dokumen

| Dokumen | Isi |
|---------|-----|
| [[API-SPEC]] | Spesifikasi MIS endpoint (dashboard manajer) |
| [[FEATURES-MAP]] | Status 37 fitur |
| [[research/SCHEMA]] | SQL schema lengkap semua tabel |
| [[DECISIONS]] | Keputusan arsitektur (ADR) |

---

*Dibuat 2026-07-02 — domain TPS untuk staf klinik pencatatan kunjungan pasien*
