---
title: API Specification — SehatTerus Backend
updated: 2026-06-30
project: SehatTerus
tags:
  - api
  - backend
  - specification
---

# 📡 API Specification — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Spesifikasi lengkap semua endpoint backend yang dibutuhkan untuk menghidupkan data di setiap halaman dashboard manajer.
> Gunakan dokumen ini sebagai **konteks utama** saat develop endpoint baru.
>
> **Konvensi:** Semua endpoint butuh Swagger JSDoc di route file + data seeder idempotent.

---

## Status Legend

| Ikon | Artinya |
|------|---------|
| ✅ | Endpoint sudah ada dan berjalan |
| 🟡 | Endpoint ada, FE belum terhubung |
| 🆕 | Perlu dibuat |

---

## 🔐 Domain Auth — `/api/auth`

### ✅ POST `/api/auth/login`

**Controller:** `src/controllers/auth.ts → login()`
**Tabel:** `pengguna`, `fasilitas_kesehatan`
**FE:** `/login` → `loginWithApi()`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "message": "Login berhasil.",
  "user": {
    "id": "uuid",
    "nama": "string",
    "email": "string",
    "peran": "manajer | apoteker | staf_logistik | admin",
    "faskes_id": "uuid | null"
  }
}
```

**Side effect:** Set cookie `st_auth` (HttpOnly JWT) + `st_user` (readable JSON)

---

### ✅ POST `/api/auth/logout`

**Controller:** `src/controllers/auth.ts → logout()`
**FE:** Sidebar tombol logout → `logoutFromApi()` *(FE belum terhubung — F02 🟡)*

**Response 200:**
```json
{ "message": "Logout berhasil." }
```

---

### ✅ GET `/api/auth/me`

**Controller:** `src/controllers/auth.ts → me()`
**Middleware:** `requireAuth`
**Tabel:** `pengguna`, `fasilitas_kesehatan`
**FE:** `AuthContext` on mount (F03 🟡), `/settings` load profil (F35 🟡)

**Response 200:**
```json
{
  "id": "uuid",
  "nama": "string",
  "email": "string",
  "peran": "manajer",
  "nomor_sipa": "string | null",
  "faskes_id": "uuid | null",
  "faskes": {
    "nama": "string",
    "tipe": "klinik | apotek | rumah_sakit",
    "alamat": "string | null"
  }
}
```

---

### 🆕 PUT `/api/pengguna/profile`

**Controller:** `src/controllers/pengguna.ts → updateProfile()`
**Middleware:** `requireAuth`
**Tabel:** `pengguna`
**FE:** `/settings` tombol "Simpan Perubahan" (F36)

**Request Body:**
```json
{
  "nama": "string",
  "telepon": "string | null",
  "alamat": "string | null"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "nama": "string",
  "email": "string",
  "updated_at": "ISO8601"
}
```

---

## 🗺️ Domain Cases — `/api/cases`

### ✅ GET `/api/cases/spatial`

**Controller:** `src/controllers/cases.ts → getSpatialCases()`
**Tabel:** `RekamMedis`
**FE:** `/` → choropleth map (F05, F07)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `start_date` | ISO8601 | 30 hari lalu | Batas awal rentang waktu |
| `end_date` | ISO8601 | sekarang | Batas akhir rentang waktu |
| `diseases` | string | semua | Kode ICD-10 dipisah koma: `J06.9,A90` |

**Response 200:**
```json
[
  {
    "kecamatan_domisili": "Depok",
    "total_cases": 143,
    "population": 123456
  }
]
```

---

### ✅ GET `/api/cases/region/:name`

**Controller:** `src/controllers/cases.ts → getRegionDetail()`
**Tabel:** `RekamMedis`
**FE:** `/` → popup detail kecamatan saat klik peta (F06)

**URL Params:** `name` = nama kecamatan (e.g. `Depok`, `Mlati`)

**Query Params:** `start_date`, `end_date` (opsional)

**Response 200:**
```json
{
  "name": "Depok",
  "population": 123456,
  "cases": 143
}
```

---

### ✅ GET `/api/cases/temporal`

**Controller:** `src/controllers/cases.ts → getTemporalCases()`
**Tabel:** `RekamMedis`
**FE:** `/proyeksi-tren` → area chart historis (F08 🟡 — FE belum terhubung)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `start_date` | ISO8601 | 24 bulan lalu | — |
| `end_date` | ISO8601 | sekarang | — |
| `diseases` | string | semua | Kode ICD-10 dipisah koma |

**Auto-interval:** `< 30 hari` → per hari · `≤ 180 hari` → per minggu · `> 180 hari` → per bulan

**Response 200:**
```json
[
  {
    "visit_date": "2026-01-01T00:00:00.000Z",
    "kode_icd10": "J06.9",
    "nama_penyakit": "ISPA",
    "total_cases": 80
  }
]
```

---

### 🆕 GET `/api/cases/summary`

**Controller:** `src/controllers/cases.ts → getCasesSummary()`
**Tabel:** `RekamMedis`
**FE:** `/` → stat cards total kasus (F09), donut chart (F10), disease table (F11)

**Query Params:** `start_date`, `end_date` (opsional, default 30 hari)

**Response 200:**
```json
{
  "total_kasus": 1250,
  "active_kecamatan": 14,
  "active_patients": 342,
  "periode_label": "30 hari terakhir",
  "top_diseases": [
    {
      "nama_penyakit": "ISPA",
      "kode_icd10": "J06.9",
      "jumlah": 480,
      "persen": 38.4
    },
    {
      "nama_penyakit": "Influenza",
      "kode_icd10": "J11",
      "jumlah": 310,
      "persen": 24.8
    },
    {
      "nama_penyakit": "Diare",
      "kode_icd10": "A09",
      "jumlah": 280,
      "persen": 22.4
    },
    {
      "nama_penyakit": "DBD",
      "kode_icd10": "A90",
      "jumlah": 120,
      "persen": 9.6
    },
    {
      "nama_penyakit": "Darah Tinggi",
      "kode_icd10": "I10",
      "jumlah": 60,
      "persen": 4.8
    }
  ]
}
```

**Logic:**
- `total_kasus` = COUNT semua `RekamMedis` dalam rentang
- `active_kecamatan` = COUNT DISTINCT `kecamatan_domisili` dengan > 0 kasus
- `active_patients` = COUNT DISTINCT `nik_pasien` dalam rentang
- `top_diseases` = GROUP BY `kode_icd10` DESC LIMIT 5

---

## 🚨 Domain Alerts — `/api/alerts`

> [!note] Sumber Data
> Tabel `alert_ews` di-seed dengan 5 contoh alert.
> Z-score detection engine (F12) akan mengisi tabel ini secara otomatis — untuk MVP, data alert berasal dari seeder.

### 🆕 GET `/api/alerts`

**Controller:** `src/controllers/alerts.ts → getAlerts()`
**Tabel:** `alert_ews`, `wilayah`
**FE:** `/peringatan-dini` → list alert cards (F13) · `/` notification bell · `/proyeksi-tren` alert cards (F13)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `status` | `aktif\|ditangani\|selesai` | `aktif` | Filter status |
| `limit` | number | 20 | Maks item |
| `faskes_id` | uuid | — | Filter per faskes (opsional) |

**Response 200:**
```json
[
  {
    "id": "uuid",
    "kecamatan": "Depok",
    "jenis_penyakit": "Diare",
    "kode_icd10": "A09",
    "persen_lonjakan": 247,
    "laju_harian": 3,
    "jumlah_kasus": 143,
    "status": "aktif",
    "level": "kritis",
    "ketahanan_stok_jam": 48,
    "terdeteksi_pada": "2026-06-28T10:00:00.000Z"
  }
]
```

---

### 🆕 GET `/api/alerts/stats`

**Controller:** `src/controllers/alerts.ts → getAlertsStats()`
**Tabel:** `alert_ews`, `stok`
**FE:** `/peringatan-dini` → 3 InfoStatCards (F15)

**Query Params:** `faskes_id` (opsional)

**Response 200:**
```json
{
  "stok_kritis": {
    "jumlah": 3,
    "label": "Obat stok kritis",
    "badges": ["Oralit", "Cabang Sleman"]
  },
  "total_lonjakan": {
    "jumlah": 5,
    "label": "Lonjakan kasus aktif",
    "badges": ["Diare", "3 Hari"]
  },
  "wilayah_terdampak": {
    "jumlah": 4,
    "label": "Kecamatan terdampak",
    "badges": ["Dari 17 kecamatan"]
  }
}
```

---

### 🆕 GET `/api/alerts/summary`

**Controller:** `src/controllers/alerts.ts → getAlertsSummary()`
**Tabel:** `alert_ews`
**FE:** `/peringatan-dini` → AiBanner teks situasi (F16) · `/logistik` → AiBanner (F16)

**Response 200:**
```json
{
  "teks": "Situasi kritis: terdapat 3 alert aktif di 4 kecamatan. Diare di Kec. Depok mencapai +247% di atas normal, stok Oralit diperkirakan habis dalam 48 jam. Segera lakukan relokasi dari Bantul.",
  "generated_at": "2026-06-30T08:00:00.000Z"
}
```

**Logic (MVP):** Template string berdasarkan agregasi `alert_ews` aktif. Bukan LLM — cukup template dinamis.

---

### 🆕 GET `/api/alerts/:id`

**Controller:** `src/controllers/alerts.ts → getAlertById()`
**Tabel:** `alert_ews`, `stok`, `obat`, `fasilitas_kesehatan`
**FE:** `/peringatan-dini` → modal detail alert (F14)

**Response 200:**
```json
{
  "id": "uuid",
  "kecamatan": "Depok",
  "jenis_penyakit": "Diare",
  "kode_icd10": "A09",
  "persen_lonjakan": 247,
  "laju_harian": 3,
  "jumlah_kasus": 143,
  "status": "aktif",
  "level": "kritis",
  "terdeteksi_pada": "2026-06-28T10:00:00.000Z",
  "estimasi_puncak": "2–3 hari",
  "wilayah_detail": ["Kel. Maguwoharjo", "Kel. Condongcatur", "Kel. Caturtunggal"],
  "obat_kritis": [
    {
      "obat_id": "uuid",
      "nama": "Oralit 500ml",
      "stok_tersedia": 12,
      "ketahanan_jam": 48
    }
  ]
}
```

---

### 🆕 PATCH `/api/alerts/:id`

**Controller:** `src/controllers/alerts.ts → updateAlertStatus()`
**Middleware:** `requireAuth`
**Tabel:** `alert_ews`
**FE:** `/peringatan-dini` → tombol "Tangani" / "Selesai" (F18)

**Request Body:**
```json
{
  "status": "ditangani | selesai"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ditangani",
  "ditangani_pada": "2026-06-30T10:00:00.000Z",
  "ditangani_oleh": "uuid-pengguna"
}
```

---

## 📈 Domain Forecasting — `/api/forecasting`

> [!note] Sumber Data
> Tabel `prediksi_kebutuhan` di-seed dengan 6 prediksi untuk periode `2026-07`.
> Algoritma double exponential smoothing (F20) mengisi tabel ini — untuk MVP, pakai data seed.

### 🆕 GET `/api/forecasting/projection`

**Controller:** `src/controllers/forecasting.ts → getProjection()`
**Tabel:** `prediksi_kebutuhan`, `RekamMedis`
**FE:** `/proyeksi-tren` → area chart gabungan historis + proyeksi (F21)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `diseases` | string | `J06.9,A90` | Kode ICD-10 dipisah koma |
| `months_back` | number | 6 | Bulan historis sebelum proyeksi |
| `days_ahead` | number | 30 | Hari proyeksi ke depan |

**Response 200:**
```json
[
  {
    "tanggal": "2026-01-01",
    "nama_penyakit": "ISPA",
    "kode_icd10": "J06.9",
    "kasus_aktual": 80,
    "kasus_prediksi": null,
    "tipe": "historis"
  },
  {
    "tanggal": "2026-07-01",
    "nama_penyakit": "ISPA",
    "kode_icd10": "J06.9",
    "kasus_aktual": null,
    "kasus_prediksi": 160,
    "tipe": "proyeksi"
  }
]
```

---

### 🆕 GET `/api/forecasting/stats`

**Controller:** `src/controllers/forecasting.ts → getForecastingStats()`
**Tabel:** `prediksi_kebutuhan`, `RekamMedis`
**FE:** `/proyeksi-tren` → 3 stat cards (F22)

**Response 200:**
```json
{
  "peningkatan_tertinggi": {
    "nama_penyakit": "DBD",
    "kode_icd10": "A90",
    "persen_change": 18.2,
    "kasus_prediksi": 142,
    "label": "Terbanyak di Sleman"
  },
  "penurunan_terbesar": {
    "nama_penyakit": "Diare",
    "kode_icd10": "A09",
    "persen_change": -12.5,
    "kasus_prediksi": 88,
    "label": "Kampanye Sanitasi Berhasil"
  },
  "total_kasus_proyeksi": 605
}
```

---

### 🆕 GET `/api/forecasting/alerts`

**Controller:** `src/controllers/forecasting.ts → getForecastingAlerts()`
**Tabel:** `prediksi_kebutuhan`, `alert_ews`, `obat`
**FE:** `/proyeksi-tren` → 3 alert cards rekomendasi obat (F23)

**Response 200:**
```json
[
  {
    "jenis_penyakit": "ISPA",
    "kode_icd10": "J06.9",
    "urgensi": "tinggi",
    "persen_change": 45,
    "deskripsi": "Tren ISPA menanjak signifikan bulan depan",
    "rekomendasi_obat": ["Ibu Profen", "Masker Medis"],
    "rekomendasi_tindakan": "Segera tambah stok"
  },
  {
    "jenis_penyakit": "DBD",
    "kode_icd10": "A90",
    "urgensi": "sedang",
    "persen_change": 32,
    "deskripsi": "Tren DBD meningkat pasca hujan",
    "rekomendasi_obat": ["Abate", "Fogging Kit"],
    "rekomendasi_tindakan": "Koordinasi dinkes"
  }
]
```

---

## 📦 Domain Stok — `/api/stok`

> [!note] Sumber Data
> Tabel `stok` (15 baris) + `pergerakan_stok` (15 baris).
> Item kritis: CTM < stok minimum, Antasida exp. Des 2026.

### 🆕 GET `/api/stok/stats`

**Controller:** `src/controllers/stok.ts → getStokStats()`
**Tabel:** `stok`, `obat`, `pergerakan_stok`, `fasilitas_kesehatan`
**FE:** `/logistik` → 4 InfoStatCards (F26)

**Query Params:** `faskes_id` (opsional — jika kosong, agregat semua faskes)

**Response 200:**
```json
{
  "nilai_deadstock": {
    "nominal": 42500000,
    "label": "Dead-stock",
    "badges": ["9 item", "17% nilai stok"]
  },
  "risiko_stockout": {
    "nominal": 88000000,
    "label": "Risiko stockout",
    "badges": ["7 item kritis"]
  },
  "ketahanan_hari": {
    "nilai": 2,
    "label": "Ketahanan terpendek",
    "badges": ["Oralit", "Cabang Sleman"]
  },
  "cabang_terdampak": {
    "jumlah": 3,
    "total": 13,
    "label": "Cabang berisiko",
    "badges": ["Sleman, Bantul, Kota"]
  }
}
```

**Logic:**
- `nilai_deadstock` = SUM(`jumlah_tersedia * harga_satuan`) WHERE `tanggal_kedaluwarsa < NOW() + 90 days` ATAU `hari_tidak_bergerak > 90`
- `risiko_stockout` = SUM nilai obat WHERE `jumlah_tersedia < stok_minimum`
- `ketahanan_hari` = MIN(`jumlah_tersedia / rata_harian_keluar`) per obat per faskes
- `cabang_terdampak` = COUNT DISTINCT faskes WHERE ada stok kritis

---

### 🆕 GET `/api/stok/summary`

**Controller:** `src/controllers/stok.ts → getStokSummary()`
**Tabel:** `stok`, `alert_ews`
**FE:** `/logistik` → AiBanner (F16)

**Response 200:**
```json
{
  "teks": "7 item stok kritis di 3 cabang. Oralit di Sleman habis dalam 2 hari. Dead-stock Rp 42,5jt perlu segera diretur atau direlokasi.",
  "generated_at": "2026-06-30T08:00:00.000Z"
}
```

---

### 🆕 GET `/api/stok/chart`

**Controller:** `src/controllers/stok.ts → getStokChart()`
**Tabel:** `stok`, `obat`, `prediksi_kebutuhan`
**FE:** `/logistik` → bar chart sisa vs kebutuhan (F24) · `/peringatan-dini` → line chart stok vs kebutuhan (F19)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `faskes_id` | uuid | — | Wajib untuk line chart EWS |
| `obat_id` | uuid | — | Untuk line chart per obat spesifik |
| `months` | number | 7 | Rentang bulan (line chart) |
| `limit` | number | 5 | Top N obat (bar chart) |
| `mode` | `bar\|line` | `bar` | Tipe output |

**Response 200 (mode=bar):**
```json
[
  {
    "nama_obat": "Amoksisilin 500mg",
    "obat_id": "uuid",
    "jumlah_tersedia": 80,
    "stok_minimum": 30,
    "kebutuhan_prediksi": 112
  }
]
```

**Response 200 (mode=line):**
```json
[
  {
    "bulan": "Jan",
    "jumlah_tersedia": 300,
    "kebutuhan_prediksi": 95
  },
  {
    "bulan": "Jul",
    "jumlah_tersedia": 50,
    "kebutuhan_prediksi": 310
  }
]
```

---

### 🆕 GET `/api/stok/defekta`

**Controller:** `src/controllers/stok.ts → getDefekta()`
**Tabel:** `stok`, `obat`, `pbf`, `fasilitas_kesehatan`
**FE:** `/logistik` tab Pengadaan → DefektaTable (F25)

**Query Params:** `faskes_id` (opsional)

**Response 200:**
```json
[
  {
    "pbf": {
      "id": "uuid",
      "nama": "Kimia Farma",
      "tipe_sp": "reguler"
    },
    "locked": false,
    "items": [
      {
        "obat_id": "uuid",
        "nama": "Amoksisilin 500mg",
        "satuan": "strip",
        "ketahanan_hari": 3,
        "tren_harian": 80,
        "jumlah_tersedia": 5,
        "stok_minimum": 30,
        "jumlah_kekurangan": 25,
        "usulan_pesanan": 140,
        "harga_satuan": 15000
      }
    ]
  }
]
```

**Logic:**
- Hanya obat dengan `jumlah_tersedia < stok_minimum`
- Group berdasar `obat.pbf_id`
- `locked = true` jika ada SP aktif (status `dikirim` atau `diterima`) untuk PBF tersebut
- `usulan_pesanan` = `kebutuhan_prediksi_30hari - jumlah_tersedia`

---

### 🆕 GET `/api/stok/near-expiry`

**Controller:** `src/controllers/stok.ts → getNearExpiry()`
**Tabel:** `stok`, `obat`
**FE:** `/logistik` tab Dead-stock → near-expiry list (F27)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `faskes_id` | uuid | — | opsional |
| `days` | number | 90 | Ambang batas hari menuju kedaluwarsa |

**Response 200:**
```json
[
  {
    "stok_id": "uuid",
    "obat": {
      "id": "uuid",
      "nama": "Cetirizine 10mg",
      "satuan": "strip"
    },
    "batch": "B2024-03",
    "jumlah_tersedia": 120,
    "tanggal_kedaluwarsa": "2026-08-31",
    "hari_tersisa": 62,
    "nilai_rp": 3200000,
    "faskes": {
      "id": "uuid",
      "nama": "Puskesmas Sleman"
    }
  }
]
```

---

### 🆕 GET `/api/stok/slow-moving`

**Controller:** `src/controllers/stok.ts → getSlowMoving()`
**Tabel:** `stok`, `pergerakan_stok`, `obat`, `fasilitas_kesehatan`
**FE:** `/logistik` tab Dead-stock → slow-moving list (F28)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `faskes_id` | uuid | — | opsional |
| `days` | number | 30 | Tidak bergerak lebih dari N hari |

**Response 200:**
```json
[
  {
    "stok_id": "uuid",
    "obat": {
      "id": "uuid",
      "nama": "Vitamin B Kompleks",
      "satuan": "tablet"
    },
    "jumlah_tersedia": 500,
    "hari_tidak_bergerak": 45,
    "nilai_modal_rp": 6200000,
    "nilai_tertahan_rp": 3200000,
    "saran": "Sarankan realokasi",
    "faskes_surplus": {
      "id": "uuid",
      "nama": "Apotek Bantul"
    }
  }
]
```

---

### 🆕 POST `/api/stok/realokasi`

**Controller:** `src/controllers/stok.ts → createRealokasi()`
**Middleware:** `requireAuth`
**Tabel:** `stok`, `pergerakan_stok`
**FE:** `/peringatan-dini` tombol "Pindahkan" (F17) · `/logistik` tab Dead-stock (F29)

**Request Body:**
```json
{
  "obat_id": "uuid",
  "faskes_asal_id": "uuid",
  "faskes_tujuan_id": "uuid",
  "jumlah": 90,
  "alert_id": "uuid | null",
  "catatan": "string | null"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "tipe": "realokasi",
  "obat_id": "uuid",
  "faskes_asal_id": "uuid",
  "faskes_tujuan_id": "uuid",
  "jumlah": 90,
  "tanggal": "2026-06-30T10:00:00.000Z"
}
```

**Side effect:**
- Kurangi `stok.jumlah_tersedia` di faskes asal
- Tambah `stok.jumlah_tersedia` di faskes tujuan (atau buat baris baru)
- Insert 2 baris `pergerakan_stok` (keluar + masuk)

---

### 🆕 POST `/api/stok/retur`

**Controller:** `src/controllers/stok.ts → createRetur()`
**Middleware:** `requireAuth`
**Tabel:** `stok`, `pergerakan_stok`
**FE:** `/peringatan-dini` tombol "Tanda Retur" (F17) · `/logistik` tab Dead-stock (F30)

**Request Body:**
```json
{
  "obat_id": "uuid",
  "faskes_id": "uuid",
  "jumlah": 120,
  "alasan": "near_expiry | slow_moving | rusak",
  "catatan": "string | null"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "tipe": "penyesuaian",
  "jumlah": -120,
  "tanggal": "2026-06-30T10:00:00.000Z"
}
```

---

## 🧾 Domain Surat Pesanan — `/api/surat-pesanan`

### 🆕 GET `/api/surat-pesanan`

**Controller:** `src/controllers/suratPesanan.ts → listSuratPesanan()`
**Middleware:** `requireAuth`
**Tabel:** `surat_pesanan`, `sp_item`, `pbf`, `fasilitas_kesehatan`
**FE:** `/logistik` → status SP di DefektaTable (F31)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `faskes_id` | uuid | dari JWT | — |
| `status` | string | semua | `draf\|disetujui\|dikirim\|diterima` |

**Response 200:**
```json
[
  {
    "id": "uuid",
    "pbf": {
      "id": "uuid",
      "nama": "Kimia Farma"
    },
    "status": "draf",
    "tipe": "reguler",
    "dibuat_pada": "2026-06-30T08:00:00.000Z",
    "total_item": 2,
    "total_nilai_rp": 3500000
  }
]
```

---

### 🆕 POST `/api/surat-pesanan`

**Controller:** `src/controllers/suratPesanan.ts → createSuratPesanan()`
**Middleware:** `requireAuth`
**Tabel:** `surat_pesanan`, `sp_item`
**FE:** `/logistik` tombol "Buat Pesanan" di DefektaTable (F32)

**Request Body:**
```json
{
  "faskes_id": "uuid",
  "pbf_id": "uuid",
  "tipe": "reguler | npp",
  "items": [
    {
      "obat_id": "uuid",
      "jumlah_usulan": 140,
      "harga_satuan": 15000
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "draf",
  "pbf_id": "uuid",
  "tipe": "reguler",
  "dibuat_pada": "2026-06-30T10:00:00.000Z",
  "items": [
    {
      "id": "uuid",
      "obat_id": "uuid",
      "jumlah_usulan": 140,
      "harga_satuan": 15000,
      "subtotal": 2100000
    }
  ]
}
```

**Validasi:**
- Jika `tipe = npp` → cek `pengguna.nomor_sipa` tidak null (hanya apoteker)
- Jika `tipe = npp` dan ada obat non-NPP di `items` → return 400

---

## 📊 Ringkasan Semua Endpoint

| # | Method | Endpoint | Domain | FE Page | Status |
|---|--------|----------|--------|---------|--------|
| 1 | POST | `/api/auth/login` | Auth | `/login` | ✅ |
| 2 | POST | `/api/auth/logout` | Auth | Sidebar | ✅ |
| 3 | GET | `/api/auth/me` | Auth | Semua | ✅ |
| 4 | PUT | `/api/pengguna/profile` | Auth | `/settings` | 🆕 |
| 5 | GET | `/api/cases/spatial` | Cases | `/` | ✅ |
| 6 | GET | `/api/cases/region/:name` | Cases | `/` | ✅ |
| 7 | GET | `/api/cases/temporal` | Cases | `/proyeksi-tren` | ✅ 🟡 |
| 8 | GET | `/api/cases/summary` | Cases | `/` | 🆕 |
| 9 | GET | `/api/alerts` | Alerts | `/`, `/peringatan-dini`, `/proyeksi-tren` | 🆕 |
| 10 | GET | `/api/alerts/stats` | Alerts | `/peringatan-dini` | 🆕 |
| 11 | GET | `/api/alerts/summary` | Alerts | `/peringatan-dini`, `/logistik` | 🆕 |
| 12 | GET | `/api/alerts/:id` | Alerts | `/peringatan-dini` | 🆕 |
| 13 | PATCH | `/api/alerts/:id` | Alerts | `/peringatan-dini` | 🆕 |
| 14 | GET | `/api/forecasting/projection` | Forecasting | `/proyeksi-tren` | 🆕 |
| 15 | GET | `/api/forecasting/stats` | Forecasting | `/proyeksi-tren` | 🆕 |
| 16 | GET | `/api/forecasting/alerts` | Forecasting | `/proyeksi-tren` | 🆕 |
| 17 | GET | `/api/stok/stats` | Stok | `/logistik` | 🆕 |
| 18 | GET | `/api/stok/summary` | Stok | `/logistik` | 🆕 |
| 19 | GET | `/api/stok/chart` | Stok | `/logistik`, `/peringatan-dini` | 🆕 |
| 20 | GET | `/api/stok/defekta` | Stok | `/logistik` | 🆕 |
| 21 | GET | `/api/stok/near-expiry` | Stok | `/logistik` | 🆕 |
| 22 | GET | `/api/stok/slow-moving` | Stok | `/logistik` | 🆕 |
| 23 | POST | `/api/stok/realokasi` | Stok | `/peringatan-dini`, `/logistik` | 🆕 |
| 24 | POST | `/api/stok/retur` | Stok | `/peringatan-dini`, `/logistik` | 🆕 |
| 25 | GET | `/api/surat-pesanan` | SP | `/logistik` | 🆕 |
| 26 | POST | `/api/surat-pesanan` | SP | `/logistik` | 🆕 |

**Total: 3 ada · 1 ada (FE belum terhubung) · 22 perlu dibuat**

---

## 🛣️ Urutan Implementasi

### Tahap 1 — Quick Connect (FE sudah ada, tinggal sambungkan)
```
F02  Sidebar logout → POST /api/auth/logout
F03  AuthContext → GET /api/auth/me saat app mount
F08  /proyeksi-tren → GET /api/cases/temporal (ganti hardcoded array)
F35  /settings → GET /api/auth/me (ganti hardcoded form values)
```

### Tahap 2 — Dashboard Utama (halaman / hidup dari API)
```
F09–F11  GET /api/cases/summary   → stat cards + donut chart + disease table
F13      GET /api/alerts          → notification bell badge
```

### Tahap 3 — Early Warning System
```
F15  GET /api/alerts/stats        → 3 stat cards EWS
F16  GET /api/alerts/summary      → AiBanner teks
F13  GET /api/alerts              → list alert cards
F14  GET /api/alerts/:id          → modal detail
F18  PATCH /api/alerts/:id        → tombol tangani/selesai
F19  GET /api/stok/chart          → line chart stok vs kebutuhan
F17  POST /api/stok/realokasi     → tindakan relokasi
     POST /api/stok/retur         → tindakan retur
```

### Tahap 4 — Proyeksi & Forecasting
```
F22  GET /api/forecasting/stats      → 3 stat cards proyeksi
F23  GET /api/forecasting/alerts     → alert cards rekomendasi
F21  GET /api/forecasting/projection → area chart proyeksi
```

### Tahap 5 — Logistik & Pengadaan
```
F26  GET /api/stok/stats          → 4 stat cards logistik
F16  GET /api/stok/summary        → AiBanner logistik
F24  GET /api/stok/chart          → bar chart sisa vs kebutuhan
F25  GET /api/stok/defekta        → DefektaTable
F27  GET /api/stok/near-expiry    → near-expiry list
F28  GET /api/stok/slow-moving    → slow-moving list
F31  GET /api/surat-pesanan       → status SP
F32  POST /api/surat-pesanan      → buat SP dari defekta
F29  POST /api/stok/realokasi     → realokasi dari logistik
F30  POST /api/stok/retur         → retur dari logistik
```

### Tahap 6 — Profile & Settings
```
F36  PUT /api/pengguna/profile    → simpan perubahan profil
```

---

## ⚙️ Ketentuan Wajib Setiap Endpoint Baru

> [!warning] Aturan Develop
> Setiap endpoint baru WAJIB disertai:
> 1. **Swagger JSDoc** — ditulis di route file (`src/routes/*.ts`) sebagai `@openapi` comment
> 2. **Data seeder** — tambahkan ke `src/seedAll.ts` agar endpoint bisa ditest tanpa input manual
> 3. **requireAuth middleware** — untuk semua endpoint yang bersifat mutasi (POST, PUT, PATCH, DELETE)
> 4. **Update FEATURES-MAP.md** — ubah status fitur terkait
> 5. **Update CHANGELOG.md** — tambah entri session baru

---

## 🔗 Navigasi Dokumen

| Dokumen | Isi |
|---------|-----|
| [[FEATURES-MAP]] | Status per fitur (37 fitur) |
| [[CHANGELOG]] | Progress per sesi |
| [[DECISIONS]] | Keputusan arsitektur (ADR) |
| [[research/SCHEMA]] | SQL schema lengkap |

---

*Dibuat 2026-06-30 · Diperbarui otomatis oleh Claude Code setiap endpoint baru selesai*
