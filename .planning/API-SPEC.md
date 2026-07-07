---
title: API Specification — SehatTerus Backend (MIS)
updated: 2026-07-02
project: SehatTerus
tags:
  - api
  - backend
  - specification
---

# 📡 API Specification — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Spesifikasi endpoint **MIS (Management Information System)** — untuk halaman dashboard manajer.
> Untuk endpoint **TPS (pencatatan kunjungan pasien oleh staf klinik)**, lihat [[TPS-API-SPEC]].
>
> **Konvensi:** Semua endpoint butuh Swagger JSDoc di route file + data seeder idempotent.

> [!success] Phase 5, 6, 7 & 8 Selesai
> **Phase 5 (TPS)** sudah selesai 2026-07-02 — staf klinik input data via `POST /api/tps/kunjungan`,
> jadi `rekam_medis` bisa dipertanggungjawabkan per faskes/staf (lihat [[TPS-API-SPEC]]).
> **Phase 6** menyambungkan dashboard ke data itu: `/api/cases/summary` (F09–F11) dan
> `/api/cases/temporal` (F08) sudah terhubung ke FE, begitu juga logout/profil (F02, F03).
> **Phase 7 (EWS)** selesai penuh (2026-07-02): `/peringatan-dini` sekarang hidup dari
> `GET /api/alerts*` (F13–F16), `PATCH /api/alerts/:id` (F18), dan Z-score detection engine
> `POST /api/alerts/detect` (F12). Yang masih hardcoded di halaman itu: kartu "Tindakan Darurat"
> (F17, butuh `GET /api/stok/*` Phase 9 untuk saran realokasi) dan chart stok-vs-kebutuhan (F19).
> **Phase 8 (Forecasting)** selesai penuh (2026-07-07): `/proyeksi-tren` sekarang hidup dari
> `GET /api/forecasting/{projection,stats,alerts}` (F20–F23) — chart historis+proyeksi mingguan
> (garis putus-putus untuk bagian proyeksi), 3 stat card, dan maks. 3 alert card rekomendasi.
> Sisa yang masih hardcoded di sistem: `/settings` (F35, F36 — Phase 10) dan
> logistik/pengadaan (F24–F34 — Phase 9).

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
**FE:** Sidebar tombol logout → `logoutFromApi()` *(terhubung sejak Phase 6 Plan 06-03 — F02 ✅)*

**Response 200:**
```json
{ "message": "Logout berhasil." }
```

---

### ✅ GET `/api/auth/me`

**Controller:** `src/controllers/auth.ts → me()`
**Middleware:** `requireAuth`
**Tabel:** `pengguna`, `fasilitas_kesehatan`
**FE:** `AuthContext` on mount (terhubung sejak Phase 6 Plan 06-03 — F03 ✅), `/settings` load profil (F35 🟡 — belum, menunggu Phase 10)

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
**FE:** `/proyeksi-tren` → area chart historis (F08 ✅ — terhubung sejak Phase 6 Plan 06-02; stat cards & alert cards di halaman yang sama masih hardcoded, itu F22/F23 menunggu Phase 8)

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

### ✅ GET `/api/cases/summary`

**Controller:** `src/controllers/cases.ts → getCasesSummary()`
**Tabel:** `RekamMedis`
**FE:** `/` → stat cards total kasus (F09 ✅), donut chart (F10 ✅), disease table (F11 ✅) — semua terhubung sejak Phase 6 Plan 06-01

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
- `total_kasus` = COUNT semua `rekam_medis` dalam rentang
- `active_kecamatan` = COUNT DISTINCT `kecamatan_domisili` dengan > 0 kasus
- `active_patients` = COUNT `rekam_medis` dalam rentang (proxy pasien unik — `nik_pasien` tidak ada di model, satu baris = satu kunjungan)
- `top_diseases` = GROUP BY `kode_icd10` ORDER BY COUNT DESC LIMIT 5

> [!note] Catatan `active_patients`
> Model `rekam_medis` tidak menyimpan `nik_pasien`. Nilai ini adalah jumlah kunjungan (bukan pasien unik).
> Jika ke depan dibutuhkan pasien unik, perlu tambah kolom `nik_pasien` ke tabel.

---

## 🚨 Domain Alerts — `/api/alerts`

> [!note] Sumber Data
> Tabel `alert_ews` di-seed dengan 5 contoh alert.
> Z-score detection engine (F12) akan mengisi tabel ini secara otomatis — untuk MVP, data alert berasal dari seeder.

### ✅ GET `/api/alerts`

**Controller:** `src/controllers/alerts.ts → getAlerts()`
**Tabel:** `alert_ews`, `wilayah`
**FE:** `/peringatan-dini` → list alert cards (F13 ✅ — tersambung Plan 07-03) · `/` notification bell (masih hardcoded) · `/proyeksi-tren` alert cards (F13, masih hardcoded — beda dari list di `/peringatan-dini`)

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

### ✅ GET `/api/alerts/stats`

**Controller:** `src/controllers/alerts.ts → getAlertsStats()`
**Tabel:** `alert_ews`, `stok`
**FE:** `/peringatan-dini` → 3 InfoStatCards (F15 ✅ — tersambung Plan 07-03)

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

### ✅ GET `/api/alerts/summary`

**Controller:** `src/controllers/alerts.ts → getAlertsSummary()`
**Tabel:** `alert_ews`
**FE:** `/peringatan-dini` → AiBanner teks situasi (F16 ✅ — tersambung Plan 07-03) · `/logistik` → AiBanner (F16, masih hardcoded)

**Response 200:**
```json
{
  "teks": "Situasi kritis: terdapat 3 alert aktif di 4 kecamatan. Diare di Kec. Depok mencapai +247% di atas normal, stok Oralit diperkirakan habis dalam 48 jam. Segera lakukan relokasi dari Bantul.",
  "generated_at": "2026-06-30T08:00:00.000Z"
}
```

**Logic (MVP):** Template string berdasarkan agregasi `alert_ews` aktif. Bukan LLM — cukup template dinamis.

---

### ✅ GET `/api/alerts/:id`

**Controller:** `src/controllers/alerts.ts → getAlertById()`
**Tabel:** `alert_ews`, `stok`, `obat`
**FE:** `/peringatan-dini` → modal detail alert (F14 ✅ — tersambung Plan 07-03)

> [!warning] Deviasi dari spec: `wilayah_detail` tidak diimplementasikan
> Response asli di bawah punya `wilayah_detail` (daftar kelurahan). Field ini **sengaja tidak
> disertakan** di implementasi — tabel `wilayah` cuma menyimpan granularitas kecamatan, tidak ada
> data kelurahan untuk dikembalikan tanpa fabrikasi. `level` dihitung dari `persen_lonjakan >= 150%`
> ATAU `ketahanan_stok_jam <= 48` jam; `estimasi_puncak` adalah heuristik dari `laju_harian`
> (bukan model prediksi — itu Phase 8). `obat_kritis` maksimal 1 item karena `alert_ews` cuma
> punya satu `obat_terdampak_id` (bukan array multi-obat seperti contoh di bawah).

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

### ✅ PATCH `/api/alerts/:id`

**Controller:** `src/controllers/alerts.ts → updateAlertStatus()`
**Middleware:** `requireAuth`
**Tabel:** `alert_ews`
**FE:** `/peringatan-dini` → tombol "Tangani" / "Selesai" (F18 ✅ — tersambung Plan 07-03)

> [!note] Kolom `ditangani_oleh` ditambahkan ke `alert_ews`
> Model semula tidak punya kolom ini (lihat [[research/SCHEMA]]). Ditambahkan di Plan 07-02
> lewat `sequelize.sync({ alter: true })` (ADR-002) — sama seperti `dicatat_oleh` ditambahkan ke
> `RekamMedis` di Phase 5, demi akuntabilitas siapa yang menangani/menyelesaikan sebuah alert.

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

### ✅ POST `/api/alerts/detect`

**Controller:** `src/controllers/alerts.ts → detectAnomalies()`
**Middleware:** `requireAuth`
**Tabel:** `RekamMedis`, `alert_ews`
**FE:** — (dipicu manual/cron, tidak ada tombol UI khusus; hasilnya langsung muncul di `GET /api/alerts` yang sudah tersambung ke `/peringatan-dini`)

> [!note] Ditambahkan di Plan 07-03 — tidak ada di draft spec awal
> Endpoint ini (F12, Z-score detection engine) tidak punya kontrak request/response yang
> di-draft sebelumnya di dokumen ini — hanya disebut sebagai item roadmap. Shape di bawah
> didesain saat implementasi.

**Logic:** Bandingkan jumlah kasus 7 hari terakhir vs baseline 28 hari sebelumnya, per kombinasi
`(kecamatan, kode_icd10)`. Anomali kalau **z-score ≥ 2 DAN** total kasus 7 hari terakhir ≥ 5
(batas absolut mencegah kasus kecil seperti 1→3 terdeteksi sebagai "lonjakan 300%" — sesuai
REQUIREMENTS.md ANL-02). Alert `status='aktif'` yang cocok akan diperbarui statistiknya; kalau
belum ada, dibuat baru. **Tidak** mengisi `obat_terdampak_id`/`ketahanan_stok_jam` (tidak ada
pemetaan penyakit→obat di skema) dan **tidak** otomatis menyelesaikan alert yang sudah tidak
anomali lagi — keduanya scope masa depan. Threshold Z-score (2) dan batas absolut (5 kasus)
adalah konstanta di kode, **belum configurable dari UI** (REQUIREMENTS.md ADM-02 di luar scope MVP).

**Response 200:**
```json
{
  "checked_at": "2026-07-02T13:00:41.539Z",
  "kombinasi_dianalisis": 72,
  "anomali_terdeteksi": 1,
  "alerts": [
    {
      "id": "uuid",
      "kecamatan": "Turi",
      "jenis_penyakit": "Infeksi Saluran Pernafasan Akut (ISPA)",
      "kode_icd10": "J06.9",
      "persen_lonjakan": 2000,
      "z_score": 8.16,
      "jumlah_kasus": 21,
      "aksi": "baru"
    }
  ]
}
```

> `aksi` = `"baru"` kalau alert baru dibuat, `"diperbarui"` kalau alert aktif yang sudah ada di-refresh.

---

## 📈 Domain Forecasting — `/api/forecasting`

> [!note] Sumber Data — dihitung on-the-fly, bukan dari `prediksi_kebutuhan`
> Draft awal dokumen ini mengira `prediksi_kebutuhan` bisa dipakai untuk proyeksi kasus per
> penyakit. Ternyata schema tabel itu adalah `obat_id` + `faskes_id` + `jumlah_prediksi` —
> kebutuhan obat per faskes untuk Phase 9 (logistik), bukan proyeksi kasus penyakit. Tidak ada
> tabel `penyakit` atau proyeksi-kasus di schema sama sekali. Jadi proyeksi kasus (F20-F21)
> dihitung langsung dari `RekamMedis` tiap request, bukan dibaca dari tabel tersimpan — lihat
> [[DECISIONS#ADR-011]].
>
> **Granularitas mingguan, bukan bulanan.** `REQUIREMENTS.md` ANL-01 minta proyeksi 14-30 hari
> ke depan dengan garis tren putus-putus — granularitas bulanan (contoh awal di draft ini) terlalu
> kasar untuk itu. Semua endpoint di bawah pakai bucket mingguan (`DATE_TRUNC('week', ...)`),
> dan minggu yang sedang berjalan (belum penuh 7 hari) selalu dikeluarkan dari data historis
> supaya tidak mencemari fit/perbandingan sebagai penurunan palsu.
>
> **Algoritma:** Holt's linear trend method (= double exponential smoothing, F20). Konstanta
> `alpha`/`beta` di-fit per penyakit lewat grid search (0.1–0.9, minimasi SSE one-step-ahead),
> bukan konstanta tetap.

### ✅ GET `/api/forecasting/projection`

**Controller:** `src/controllers/forecasting.ts → getProjection()`
**Tabel:** `RekamMedis`
**FE:** `/proyeksi-tren` → area chart gabungan historis (solid) + proyeksi (dashed) (F21)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `diseases` | string | `J06.9,A90` | Kode ICD-10 dipisah koma |
| `months_back` | number | 6 | Bulan historis sebelum proyeksi (dikonversi ke minggu) |
| `days_ahead` | number | 30 | Hari proyeksi ke depan (dikonversi ke minggu) |

**Response 200 (melt format, satu baris per minggu per penyakit):**
```json
[
  {
    "tanggal": "2026-06-01",
    "nama_penyakit": "ISPA",
    "kode_icd10": "J06.9",
    "kasus_aktual": 29,
    "kasus_prediksi": null,
    "tipe": "historis"
  },
  {
    "tanggal": "2026-07-13",
    "nama_penyakit": "ISPA",
    "kode_icd10": "J06.9",
    "kasus_aktual": null,
    "kasus_prediksi": 24,
    "tipe": "proyeksi"
  }
]
```

---

### ✅ GET `/api/forecasting/stats`

**Controller:** `src/controllers/forecasting.ts → getForecastingStats()`
**Tabel:** `RekamMedis`
**FE:** `/proyeksi-tren` → 3 stat cards (F22)

**Response 200:**
```json
{
  "peningkatan_tertinggi": {
    "nama_penyakit": "Diare & Gastroenteritis",
    "kode_icd10": "A09",
    "persen_change": 150,
    "kasus_prediksi": 5,
    "label": "Proyeksi minggu depan"
  },
  "penurunan_terbesar": {
    "nama_penyakit": "Demam Berdarah Dengue (DBD)",
    "kode_icd10": "A90",
    "persen_change": -60,
    "kasus_prediksi": 10,
    "label": "Proyeksi minggu depan"
  },
  "total_kasus_proyeksi": 176
}
```
> `penurunan_terbesar` bisa `null` kalau tidak ada penyakit dengan tren menurun saat itu — tidak
> dipaksakan. `label` sengaja generik ("Proyeksi minggu depan"), bukan klaim spesifik seperti
> "Terbanyak di Sleman" yang tidak bisa diturunkan dari data manapun (lihat draft lama di atas).

---

### ✅ GET `/api/forecasting/alerts`

**Controller:** `src/controllers/forecasting.ts → getForecastingAlerts()`
**Tabel:** `RekamMedis`, `resep`, `resep_item`, `obat`, `formula_racikan`, `alert_ews`
**FE:** `/proyeksi-tren` → maks. 3 alert cards rekomendasi (F23)

**Response 200:**
```json
[
  {
    "jenis_penyakit": "Diare & Gastroenteritis",
    "kode_icd10": "A09",
    "urgensi": "tinggi",
    "persen_change": 150,
    "deskripsi": "Tren Diare & Gastroenteritis diproyeksikan naik 150% minggu depan berdasarkan data historis.",
    "rekomendasi_obat": ["Oralit Sachet"],
    "rekomendasi_tindakan": "Segera tambah stok obat terkait dan siapkan kapasitas layanan tambahan."
  }
]
```
> Hanya penyakit dengan `persen_change` positif yang muncul, maks. 3, diurutkan tertinggi dulu —
> bisa kurang dari 3 (atau kosong) kalau tidak ada tren naik saat itu. `rekomendasi_obat` diambil
> dari riwayat `resep_item` nyata untuk penyakit itu (join lewat `RekamMedis` → `resep` →
> `resep_item`), fallback ke `alert_ews.obat_terdampak_id` kalau riwayat resep kosong, atau array
> kosong kalau tidak ada sumber data nyata sama sekali — **tidak ada pemetaan penyakit→obat yang
> difabrikasi**, konsisten dengan keputusan yang sama di `POST /api/alerts/detect` (Phase 7).

---

## 📦 Domain Stok & Logistik — `/api/logistic` + `/api/stok`

> [!note] Dua prefix, bukan satu — dan draft awal domain ini banyak salah
> Draft awal dokumen ini menaruh semua endpoint stok di bawah `GET /api/stok/*`. Yang sebenarnya
> terjadi: 5 endpoint GET (`stok`, `stok/chart`, `stats`, `near-expiry`, `surat-pesanan` list) masuk
> lebih dulu lewat merge parsial dari branch teman (2026-07-03) di bawah prefix
> **`/api/logistic/*`** (lihat [[DECISIONS#ADR-010]]), dan Phase 9 (2026-07-07) menambah
> `defekta`, `slow-moving`, `POST surat-pesanan` di prefix yang sama supaya tidak terpecah dua.
> Hanya `POST /api/stok/{realokasi,retur}` (Phase 7) yang tetap di prefix `/api/stok/*` — controller
> `src/controllers/stok.ts` yang sebenarnya, bukan `src/controllers/logistic.ts` seperti disebut di
> draft awal untuk endpoint lain.
>
> **Perbaikan lain dari draft awal:**
> - `obat.pbf_id` **tidak ada di skema asli** — kolom ini ditambahkan khusus di Phase 9 (nullable
>   FK, di-seed round-robin ke 3 PBF) supaya defekta bisa benar-benar dikelompokkan per PBF.
>   Lihat [[DECISIONS#ADR-011]].
> - `tren_harian`/`kebutuhan_prediksi`/`ketahanan_hari` dihitung dari rata-rata nyata
>   `pergerakan_stok` tipe `'keluar'` 30 hari terakhir — bukan dari `prediksi_kebutuhan` (draft
>   awal salah menyebut tabel ini; isinya untuk kebutuhan per faskes hasil forecasting AI, konsep
>   berbeda) dan bukan asumsi tetap seperti "stok / 10" yang sempat dipakai `getStats` sebelum
>   diperbaiki di Phase 9.
> - `sp_item` **tidak punya kolom harga** di skema manapun — `harga_satuan`/`subtotal` di response
>   `POST /api/surat-pesanan` dihitung dari `obat.harga_beli` saat itu, bukan disimpan.
>
> **Belum dikerjakan di Phase 9:** `GET /api/logistic/summary` (AiBanner ringkasan AI di
> `/logistik`, draft awal menyebutnya F16) — di luar scope Phase 9 yang disepakati. `AiBanner` di
> `/logistik` masih pakai teks default hardcoded komponennya, bukan endpoint nyata.

### ✅ GET `/api/logistic/stats`

**Controller:** `src/controllers/logistic.ts → getStats()`
**Tabel:** `stok`, `obat`, `pergerakan_stok`, `fasilitas_kesehatan`
**FE:** `/logistik` → 4 InfoStatCards (F26)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "deadStock": { "modal": 5100000, "count": 5 },
    "stockout": { "risiko": 401000, "count": 4 },
    "ketahanan": { "hari": 3, "item": "Amoxicillin 500mg", "faskes": "Apotek Sehat Terus Depok" },
    "cabangBerisiko": { "count": 2, "total": 2 }
  }
}
```

**Logic:**
- `deadStock` = obat dengan `jumlah_tersedia > stok_minimum * 3`
- `stockout` = obat dengan `jumlah_tersedia < stok_minimum`
- `ketahanan.hari` = MIN(`jumlah_tersedia / tren_harian`) di seluruh obat+faskes yang punya `tren_harian > 0` (obat tanpa riwayat `keluar` tidak ikut dibandingkan, bukan dianggap "tak terbatas")
- `cabangBerisiko` = COUNT DISTINCT faskes yang punya minimal 1 obat stockout

---

### ✅ GET `/api/logistic/stok/chart`

**Controller:** `src/controllers/logistic.ts → getStokChart()`
**Tabel:** `stok`, `obat`, `pergerakan_stok`
**FE:** `/logistik` → bar chart sisa vs kebutuhan (F24) · `/peringatan-dini` → line chart stok vs kebutuhan (F19)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `mode` | `bar\|line` | `bar` | — |
| `faskes_id` | uuid | — | Wajib untuk `mode=line` |
| `obat_id` | uuid | — | Wajib untuk `mode=line` |
| `months` | number | 7 | Rentang bulan (`mode=line`) |
| `limit` | number | 6 | Top N obat (`mode=bar`) |

**Response 200 (mode=bar):**
```json
{ "success": true, "data": [{ "drug": "Oralit", "sisaStock": 300, "kebutuhan": 60 }] }
```

**Response 200 (mode=line)** — direkonstruksi mundur dari stok saat ini + riwayat `keluar` nyata; bulan di luar jangkauan riwayat (>45 hari, sesuai seed) tampil datar karena memang belum ada sinyal pergerakan sejauh itu, bukan dipaksakan turun:
```json
{ "success": true, "data": [{ "bulan": "Mar", "jumlah_tersedia": 280, "kebutuhan_prediksi": 0 }, { "bulan": "Jul", "jumlah_tersedia": 192, "kebutuhan_prediksi": 16 }] }
```

---

### ✅ GET `/api/logistic/defekta`

**Controller:** `src/controllers/logistic.ts → getDefekta()`
**Tabel:** `stok`, `obat`, `pbf`, `surat_pesanan`
**FE:** `/logistik` tab Pengadaan → DefektaTable (F25)

**Query Params:** `faskes_id` (opsional)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "pbf": { "id": "uuid", "nama": "PT Enseval Putera Megatrading" },
      "tipe": "npp",
      "locked": false,
      "items": [
        { "obat_id": "uuid", "nama": "Codein 10mg", "jenis": "obat_jadi", "satuan": "strip", "ketahanan_hari": null, "tren_harian": 0, "jumlah_tersedia": 8, "stok_minimum": 10, "jumlah_kekurangan": 2, "usulan_pesanan": 2, "harga_satuan": 25000 }
      ]
    }
  ]
}
```

**Logic:**
- Hanya obat dengan total `jumlah_tersedia` (lintas faskes, atau di faskes tertentu kalau `faskes_id` diisi) `< stok_minimum`
- Group berdasar **`(obat.pbf_id, tipe)`** — bukan cuma `pbf_id`, karena satu PBF bisa memasok obat reguler & npp sekaligus dan item npp wajib SP terpisah (lihat catatan skema `sp_item`). Setiap grup selalu valid dikirim langsung sebagai satu `POST /api/surat-pesanan`.
- `locked = true` kalau ada SP berstatus `disetujui|dikirim|diterima` untuk `(pbf_id, tipe)` yang sama — SP `draf` tidak mengunci
- `usulan_pesanan` = `max(jumlah_kekurangan, kebutuhan_30hari - jumlah_tersedia)`, dengan `kebutuhan_30hari` dari `tren_harian` nyata

---

### ✅ GET `/api/logistic/near-expiry`

**Controller:** `src/controllers/logistic.ts → getNearExpiry()`
**Tabel:** `stok`, `obat`, `fasilitas_kesehatan`
**FE:** `/logistik` tab Dead-stock → near-expiry list (F27)

**Response 200:**
```json
{ "success": true, "data": [{ "nama": "Chlorpheniramine (CTM) 4mg", "qty": "6 strip", "nilai": "Rp 0.0 jt tertahan", "expired": "Expired 1 bln lagi" }] }
```

---

### ✅ GET `/api/logistic/slow-moving`

**Controller:** `src/controllers/logistic.ts → getSlowMoving()`
**Tabel:** `stok`, `pergerakan_stok`, `obat`, `fasilitas_kesehatan`
**FE:** `/logistik` tab Dead-stock → slow-moving list (F28) · `/peringatan-dini` → Tindakan Darurat (F17)

**Query Params:**
| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `faskes_id` | uuid | — | opsional |
| `days` | number | 30 | Tidak bergerak lebih dari N hari |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "stok_id": "uuid",
      "obat": { "id": "uuid", "nama": "Vitamin C 250mg" },
      "faskes": { "id": "uuid", "nama": "Klinik Sehat Terus Sleman" },
      "jumlah_tersedia": 250,
      "hari_tidak_bergerak": null,
      "nilai_modal_rp": 1000000,
      "saran": "retur",
      "faskes_tujuan_realokasi": null
    }
  ]
}
```

**Logic:**
- Obat dengan `jumlah_tersedia > 0` DAN tidak ada `pergerakan_stok` tipe `keluar` dalam `days` hari terakhir
- `hari_tidak_bergerak` = `null` kalau obat itu memang belum pernah tercatat bergerak sama sekali (bukan 0 atau angka fiktif)
- `saran = "realokasi"` **hanya** kalau ada faskes lain yang secara nyata kekurangan obat yang sama (`jumlah_tersedia < stok_minimum` di faskes itu) — perbandingan lintas-faskes nyata, bukan tebakan. Kalau tidak ada, `saran = "retur"`.

---

### ✅ POST `/api/stok/realokasi`

**Controller:** `src/controllers/stok.ts → createRealokasi()`
**Middleware:** `requireAuth`
**Tabel:** `stok`, `pergerakan_stok`
**FE:** `/peringatan-dini` tombol "Pindahkan" (F17 — disambungkan penuh Phase 9, saran dari `GET /api/logistic/slow-moving`) · `/logistik` tab Dead-stock (F29)

> [!warning] Deviasi dari spec: 1 baris `pergerakan_stok`, bukan 2
> Side effect di bawah ("Insert 2 baris keluar+masuk") **tidak diikuti persis**. Implementasi
> mencatat **satu** baris `tipe='realokasi'` dengan `faskes_asal` + `faskes_tujuan` di baris yang
> sama — memanfaatkan kolom & enum yang memang sudah didesain untuk itu di skema. Lihat [[DECISIONS#ADR-008]].

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

**Side effect (implementasi aktual):**
- FEFO-deduct `stok.jumlah_tersedia` di faskes asal, bisa lintas beberapa batch
- Setiap batch yang dipotong di-carry-over ke faskes tujuan (batch + tanggal_kedaluwarsa sama, `findOrCreate`)
- Insert **satu** baris `pergerakan_stok` (`tipe='realokasi'`, `faskes_asal` + `faskes_tujuan` terisi) — lihat ADR-008
- Validasi: `faskes_asal_id != faskes_tujuan_id`, `jumlah > 0`, stok cukup (400 dengan detail kalau tidak)

---

### ✅ POST `/api/stok/retur`

**Controller:** `src/controllers/stok.ts → createRetur()`
**Middleware:** `requireAuth`
**Tabel:** `stok`, `pergerakan_stok`
**FE:** `/peringatan-dini` tombol "Tanda Retur" (F17 — disambungkan penuh Phase 9) · `/logistik` tab Dead-stock (F30)

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

## 🧾 Domain Surat Pesanan — `/api/logistic/surat-pesanan`

> Prefix `/api/logistic/*`, bukan `/api/surat-pesanan` seperti draft awal — konsisten dengan
> ADR-010 (endpoint GET sudah lebih dulu ada di prefix itu lewat merge 2026-07-03).

### ✅ GET `/api/logistic/surat-pesanan`

**Controller:** `src/controllers/logistic.ts → getSuratPesanan()`
**Middleware:** `requireAuth`
**Tabel:** `surat_pesanan`, `sp_item`, `pbf`, `fasilitas_kesehatan`, `obat`
**FE:** `/logistik` → status SP (F31)

**Query Params:** `faskes_id`, `status` (`draf|disetujui|dikirim|diterima|batal`), keduanya opsional

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "pbf": { "id": "uuid", "nama": "PT Rajawali Nusindo" }, "status": "draf", "tipe": "reguler", "dibuat_pada": "2026-07-07T09:47:16.749Z", "total_item": 2, "total_nilai_rp": 279000 }
  ]
}
```
`total_nilai_rp` dihitung dari `jumlah_usulan * obat.harga_beli` saat ini — `sp_item` tidak menyimpan harga sendiri.

---

### ✅ POST `/api/logistic/surat-pesanan`

**Controller:** `src/controllers/logistic.ts → createSuratPesanan()`
**Middleware:** `requireAuth`
**Tabel:** `surat_pesanan`, `sp_item`, `obat`, `pengguna`
**FE:** `/logistik` tombol "Buat Pesanan" di DefektaTable (F32)

**Request Body:**
```json
{
  "faskes_id": "uuid",
  "pbf_id": "uuid",
  "tipe": "reguler | npp",
  "items": [{ "obat_id": "uuid", "jumlah_usulan": 140 }]
}
```
`harga_satuan` di body request (kalau dikirim) diabaikan — dihitung ulang dari `obat.harga_beli` di response.

**Response 201:**
```json
{
  "id": "uuid",
  "status": "draf",
  "pbf_id": "uuid",
  "tipe": "reguler",
  "dibuat_pada": "2026-07-07T09:47:16.749Z",
  "items": [{ "obat_id": "uuid", "jumlah_usulan": 140, "harga_satuan": 15000, "subtotal": 2100000 }]
}
```

**Validasi:**
- `tipe = npp` → `req.user` harus punya `pengguna.nomor_sipa` (hanya apoteker), else 403
- `tipe = npp` dengan item non-npp, atau `tipe = reguler` dengan item npp → 400 (satu SP tidak boleh campur golongan)
- `obat_id` yang tidak ditemukan → 400

**Diverifikasi:** dibuat sebagai `reguler` oleh manajer (berhasil), dicoba `npp` oleh manajer (403 — benar, bukan apoteker), dicoba `npp` oleh apoteker (berhasil), dicoba item npp di SP reguler (400).

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
| 7 | GET | `/api/cases/temporal` | Cases | `/proyeksi-tren` | ✅ |
| 8 | GET | `/api/cases/summary` | Cases | `/` | ✅ |
| 9 | GET | `/api/alerts` | Alerts | `/`, `/peringatan-dini`, `/proyeksi-tren` | ✅ |
| 10 | GET | `/api/alerts/stats` | Alerts | `/peringatan-dini` | ✅ |
| 11 | GET | `/api/alerts/summary` | Alerts | `/peringatan-dini`, `/logistik` | ✅ |
| 12 | GET | `/api/alerts/:id` | Alerts | `/peringatan-dini` | ✅ |
| 13 | PATCH | `/api/alerts/:id` | Alerts | `/peringatan-dini` | ✅ |
| 14 | POST | `/api/alerts/detect` | Alerts | — (cron/trigger) | ✅ |
| 15 | GET | `/api/forecasting/projection` | Forecasting | `/proyeksi-tren` | ✅ |
| 16 | GET | `/api/forecasting/stats` | Forecasting | `/proyeksi-tren` | ✅ |
| 17 | GET | `/api/forecasting/alerts` | Forecasting | `/proyeksi-tren` | ✅ |
| 18 | GET | `/api/logistic/stats` | Stok | `/logistik` | ✅ |
| 19 | GET | `/api/logistic/stok` | Stok | `/logistik` | ✅ |
| 20 | GET | `/api/logistic/stok/chart` | Stok | `/logistik`, `/peringatan-dini` | ✅ |
| 21 | GET | `/api/logistic/defekta` | Stok | `/logistik` | ✅ |
| 22 | GET | `/api/logistic/near-expiry` | Stok | `/logistik` | ✅ |
| 23 | GET | `/api/logistic/slow-moving` | Stok | `/logistik`, `/peringatan-dini` | ✅ |
| 24 | POST | `/api/stok/realokasi` | Stok | `/peringatan-dini`, `/logistik` | ✅ |
| 25 | POST | `/api/stok/retur` | Stok | `/peringatan-dini`, `/logistik` | ✅ |
| 26 | GET | `/api/logistic/surat-pesanan` | SP | `/logistik` | ✅ |
| 27 | POST | `/api/logistic/surat-pesanan` | SP | `/logistik` | ✅ |

**Total MIS: 26/27 selesai (backend + FE, atau backend-only by design) · 1 belum dibuat (`PUT /api/pengguna/profile` — Phase 10)**
**Total TPS: 10/10 endpoint selesai (lihat [[TPS-API-SPEC]])**
**Grand total seluruh sistem: 37 endpoint — 36 selesai (BE+FE atau backend-only) · 1 belum dibuat (Phase 10)**

---

## 🛣️ Urutan Implementasi

> [!success] Tahap 0–2 Selesai (Phase 5 & 6, 2026-07-02)
> **Phase 5 (TPS)** dan **Phase 6 (MIS Dashboard Integration)** sudah selesai penuh.
> Data `rekam_medis` sekarang akuntabel via `POST /api/tps/kunjungan` (lihat [[TPS-API-SPEC]]),
> dan dashboard utama (`/`) + `/proyeksi-tren` (chart) + logout/profil sudah hidup dari API real.
> Tahap 3 dan seterusnya (EWS, Forecasting, Logistik, Settings) masih pending.

### ✅ Tahap 0 — TPS Selesai Dulu (Phase 5 — lihat TPS-API-SPEC.md)
```
Task #1  Tambah kolom dicatat_oleh ke RekamMedis           ✅
Task #2  Update seeder (faskes_id + dicatat_oleh terisi)   ✅
Task #3  Endpoint referensi TPS                            ✅
Task #4  Endpoint CRUD kunjungan                           ✅
Task #5  Endpoint resep + potong stok                      ✅
Task #6  GET /api/cases/summary                            ✅
```

### ✅ Tahap 1 — Quick Connect (Phase 6 Plan 06-03)
```
F02  Sidebar logout → POST /api/auth/logout                       ✅
F03  AuthContext → GET /api/auth/me saat app mount                ✅
F08  /proyeksi-tren → GET /api/cases/temporal (chart)              ✅
F35  /settings → GET /api/auth/me (ganti hardcoded form values)   🔜 Phase 10
```

### ✅ Tahap 2 — Dashboard Utama (Phase 6 Plan 06-01)
```
F09–F11  GET /api/cases/summary   → stat cards + donut chart + disease table   ✅
F13      GET /api/alerts          → notification bell badge                    ✅ BE (FE pending)
```

### ✅ Tahap 3 — Early Warning System (Phase 7 — selesai)
```
F15  GET /api/alerts/stats        → 3 stat cards EWS              ✅ BE+FE (Plan 07-01 / 07-03)
F16  GET /api/alerts/summary      → AiBanner teks                 ✅ BE+FE (Plan 07-01 / 07-03)
F13  GET /api/alerts              → list alert cards               ✅ BE+FE (Plan 07-01 / 07-03)
F14  GET /api/alerts/:id          → modal detail                   ✅ BE+FE (Plan 07-01 / 07-03)
F18  PATCH /api/alerts/:id        → tombol tangani/selesai          ✅ BE+FE (Plan 07-02 / 07-03)
F12  POST /api/alerts/detect      → Z-score detection engine        ✅ BE (Plan 07-03, tanpa UI by design)
F17  POST /api/stok/realokasi     → tindakan relokasi               ✅ BE (Plan 07-02) — 🔜 FE, butuh Phase 9
     POST /api/stok/retur         → tindakan retur                  ✅ BE (Plan 07-02) — 🔜 FE, butuh Phase 9
F19  GET /api/stok/chart          → line chart stok vs kebutuhan   🔜 Phase 9
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

> [!warning] Deviasi 2026-07-03 — Endpoint di atas untuk F24/F26/F27/F31 sudah **ada di backend**
> tapi pakai prefix `/api/logistic/*`, BUKAN `/api/stok/*` seperti direncanakan di atas — diambil
> dari merge parsial branch teman (`feat/disease-api-integration`), lihat [[DECISIONS#ADR-010]].
> Detail aktual:
> - `GET /api/logistic/stok` — daftar stok mentah (semua faskes, urut jumlah tersedia ASC)
> - `GET /api/logistic/stok/chart` (F24) — `{ drug, sisaStock, kebutuhan }[]`, 6 obat teratas
> - `GET /api/logistic/stats` (F26) — `{ deadStock, stockout, ketahanan, cabangBerisiko }`
> - `GET /api/logistic/near-expiry` (F27) — stok exp. ≤ 3 bulan, sudah diformat siap tampil
> - `GET /api/logistic/surat-pesanan` (F31) — daftar SP + items + PBF + faskes
>
> F25 (defekta), F28 (slow-moving), F29/F30 (realokasi/retur dari halaman logistik), F32 (buat SP)
> masih belum ada — FE `/logistik` juga belum disambungkan ke endpoint `/api/logistic/*` ini.
>
> Fitur tambahan di luar 37 fitur map: `POST /api/ai/analyze` (ringkasan LLM via Groq, butuh
> `GROQ_API_KEY`) dan `POST /api/auth/register` (backend-only, FE sengaja tidak disambungkan).

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
| [[TPS-API-SPEC]] | Spesifikasi 10 endpoint TPS (pencatatan kunjungan staf klinik) |
| [[FEATURES-MAP]] | Status per fitur (37 fitur MIS) |
| [[CHANGELOG]] | Progress per sesi |
| [[DECISIONS]] | Keputusan arsitektur (ADR) |
| [[research/SCHEMA]] | SQL schema lengkap |
| [[ROADMAP]] | Phase plan (10 phase, posisi sekarang: Phase 5) |

---

*Dibuat 2026-06-30 · Diperbarui 2026-07-02 — tandai `/api/cases/summary`, `/api/cases/temporal`, `/api/auth/logout`, `/api/auth/me` selesai terhubung ke FE (Phase 6 06-01/06-02/06-03); tandai 4 endpoint `GET /api/alerts*` selesai di backend (Phase 7 Plan 07-01); tandai `PATCH /api/alerts/:id`, `POST /api/stok/realokasi`, `POST /api/stok/retur` selesai di backend (Phase 7 Plan 07-02); tambah spec `POST /api/alerts/detect` dan tandai seluruh alerts (kecuali realokasi/retur) selesai BE+FE (Phase 7 Plan 07-03 — Phase 7 selesai penuh)*
