---
title: Feature Map — SehatTerus
updated: 2026-06-30
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
| ✅ Selesai | 4 | 11% |
| 🟡 Integrasi Pending | 4 | 11% |
| 🟠 BE Pending | 26 | 70% |
| ❌ Belum Ada | 3 | 8% |
| **Total** | **37** | |

```
Progress keseluruhan:
Selesai          ████░░░░░░░░░░░░░░░░  11%
Integrasi        ████░░░░░░░░░░░░░░░░  11%
BE Pending       ████████████████████  70%
Belum Ada        ██░░░░░░░░░░░░░░░░░░   8%
```

---

## 🔐 Domain 1 — Autentikasi

> [!info] Konteks
> Login berbasis JWT cookie. Backend set `st_auth` (HttpOnly) dan `st_user` (readable).
> Model: `pengguna`, `fasilitas_kesehatan`

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F01 | Login email & password → set JWT cookie | ✅ | `pengguna` | `/login` |
| F02 | Logout → hapus cookie sesi | 🟡 | — | Sidebar |
| F03 | Load profil otomatis saat app dibuka | 🟡 | `pengguna` | Semua (AuthContext) |
| F04 | Edit profil (nama, telepon, alamat) | 🟠 | `pengguna` | `/settings` |

> [!warning] Catatan F02–F03
> `POST /api/auth/logout` dan `GET /api/auth/me` sudah ada di backend.
> Tapi `AuthContext.logout()` masih hapus cookie lokal saja — belum panggil API backend.

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
| F08 | Tren temporal time-series chart (multi-penyakit) | 🟡 | `RekamMedis` | `/proyeksi-tren` |
| F09 | Dashboard stat cards (total kasus, kecamatan aktif) | 🟠 | `RekamMedis`, `wilayah` | `/` |
| F10 | Komposisi penyakit — donut chart | 🟠 | `RekamMedis` | `/` |
| F11 | Tabel penyakit aktif (top 5 + jumlah kasus) | 🟠 | `RekamMedis` | `/` |

> [!success] F05–F07 Selesai
> Endpoint `GET /api/cases/spatial`, `/api/cases/temporal`, `/api/cases/region/:name` sudah jalan
> dan dashboard sudah memanggil API ini.

> [!warning] F08 Integrasi Pending
> `GET /api/cases/temporal` sudah ada. Halaman `/proyeksi-tren` masih pakai array hardcoded.
> Tinggal ganti data source FE → panggil API.

---

## 🚨 Domain 3 — Early Warning System (EWS)

> [!info] Konteks
> Deteksi lonjakan kasus berbasis Z-score. Output disimpan di `alert_ews`.
> FE sudah ada UI card + modal + confirm action, semua masih hardcoded.

| ID | Fitur | Status | Tabel DB | Halaman FE |
|----|-------|--------|----------|------------|
| F12 | Kalkulasi anomali Z-score otomatis | 🟠 | `RekamMedis`, `alert_ews` | — (cron/trigger) |
| F13 | Daftar alert aktif (Kritis / Waspada) | 🟠 | `alert_ews`, `wilayah` | `/peringatan-dini`, `/proyeksi-tren` |
| F14 | Detail alert (lonjakan %, laju harian, sisa stok jam) | 🟠 | `alert_ews`, `stok`, `obat` | `/peringatan-dini` (modal) |
| F15 | Stat cards EWS (stok kritis, lonjakan, wilayah) | 🟠 | `alert_ews`, `stok` | `/peringatan-dini` |
| F16 | AI ringkasan situasi (teks otomatis dari data alert) | 🟠 | `alert_ews` | `/peringatan-dini`, `/logistik` |
| F17 | Tindakan: Relokasi stok dari alert | 🟠 | `alert_ews`, `stok`, `pergerakan_stok` | `/peringatan-dini` |
| F18 | Tindakan: Tandai alert "ditangani / selesai" | 🟠 | `alert_ews` | `/peringatan-dini` |
| F19 | Chart stok vs kebutuhan per penyakit | 🟠 | `stok`, `alert_ews`, `obat` | `/peringatan-dini` |

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
| F24 | Stock chart per obat (sisa vs kebutuhan) | 🟠 | `stok`, `obat`, `fasilitas_kesehatan` | `/logistik` |
| F25 | Defekta — obat di bawah stok minimum | 🟠 | `stok`, `obat`, `fasilitas_kesehatan` | `/logistik` |
| F26 | Stat cards logistik (nilai dead-stock, stockout risk, ketahanan) | 🟠 | `stok`, `obat`, `pergerakan_stok` | `/logistik` |
| F27 | Near-expiry — obat mendekati kedaluwarsa (≤ 3 bulan) | 🟠 | `stok`, `obat` | `/logistik` |
| F28 | Slow-moving — obat tidak bergerak dalam N hari | 🟠 | `stok`, `pergerakan_stok`, `obat` | `/logistik` |
| F29 | Realokasi stok antar cabang | 🟠 | `stok`, `pergerakan_stok`, `fasilitas_kesehatan` | `/logistik` |
| F30 | Retur / Penyesuaian stok | 🟠 | `stok`, `pergerakan_stok` | `/logistik` |

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
| F31 | List surat pesanan per faskes | 🟠 | `surat_pesanan`, `sp_item`, `pbf` | `/logistik` |
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
F02  Sambungkan logout FE → POST /api/auth/logout
F03  Sambungkan AuthContext → GET /api/auth/me
F08  Sambungkan /proyeksi-tren → GET /api/cases/temporal
F35  Sambungkan /settings → GET /api/auth/me
```

### Berikutnya — Backend Core (Domain EWS & Stats)

```
F09–F11  GET /api/dashboard/stats  (total kasus, donut, top diseases)
F13      GET /api/alerts           (list alert_ews)
F18      PATCH /api/alerts/:id     (update status alert)
F12      POST /api/alerts/detect   (Z-score engine)
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
