# Phase 3: Core Surveillance & GIS Visualizations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md – this log preserves the alternatives considered.

**Date:** 2026-06-24
**Phase:** 3-Core Surveillance & GIS Visualizations
**Areas discussed:** Kamus Populasi Kecamatan, Struktur Endpoint API, Pemuatan Data Region Detail Panel, Interval Agregasi Tren, Pewarnaan Choropleth, Filter Antarmuka Penyakit, Tile Layer Leaflet, Tooltip Grafik Recharts

---

## Kamus Populasi Kecamatan

| Option | Description | Selected |
|--------|-------------|----------|
| Kamus Statis di Frontend | Simpan data populasi di konfigurasi client Next.js. Cepat dan tidak perlu modifikasi skema DB. | |
| Tabel/Konfigurasi di Backend | Simpan di database backend Express/PostgreSQL dan dikirim lewat API. Fleksibel jika populasi berubah. | ✓ |

**User's choice:** Tabel/Konfigurasi di Backend
**Notes:** User memilih menyimpan data di backend agar data populasi bersifat fleksibel dan dapat dikirimkan ke frontend secara dinamis melalui API.

---

## Struktur Endpoint API Backend

| Option | Description | Selected |
|--------|-------------|----------|
| Endpoint Terpisah | `/api/cases/spatial` untuk data peta (per kecamatan) dan `/api/cases/temporal` untuk data tren (per tanggal). Lebih modular dan payload ringan. | ✓ |
| Endpoint Agregasi Tunggal | `/api/cases/aggregate` dengan query parameter `groupBy` (kecamatan/date). Satu endpoint yang fleksibel tetapi controller lebih kompleks. | |

**User's choice:** Endpoint Terpisah
**Notes:** Menjaga kebersihan dan performa payload dengan pemisahan endpoint spasial dan temporal secara modular.

---

## Pemuatan Data Region Detail Panel

| Option | Description | Selected |
|--------|-------------|----------|
| Filter Lokal dari Data Peta | Data dari `/api/cases/spatial` sudah mencakup kasus & populasi semua wilayah. Klik tinggal memfilter array di sisi frontend (instan). | |
| Request API Baru per Klik | Pemicu fetch baru ke `/api/cases/region/:name` saat kecamatan diklik. Menghemat muatan awal, tetapi ada delay loading per klik. | ✓ |

**User's choice:** Request API Baru per Klik
**Notes:** Dipilih untuk mengambil data secara dinamis per kecamatan ketika diklik demi efisiensi muatan awal.

---

## Interval Agregasi Tren

| Option | Description | Selected |
|--------|-------------|----------|
| Agregasi Dinamis Berdasarkan Rentang | Interval otomatis (misal: rentang < 30 hari = harian, 31-180 hari = mingguan, > 180 hari = bulanan). Menjaga grafik tetap rapi. | ✓ |
| Dropdown Pilihan User | Berikan dropdown bagi user untuk memilih secara manual (Harian, Mingguan, Bulanan) pada grafik. | |

**User's choice:** Agregasi Dinamis Berdasarkan Rentang
**Notes:** Sistem otomatis menyesuaikan tingkat pengelompokan waktu (harian/mingguan/bulanan) agar grafik Recharts tidak menumpuk dan tetap bersih.

---

## Pewarnaan Choropleth

| Option | Description | Selected |
|--------|-------------|----------|
| Ambang Batas Tetap (Fixed Thresholds) | Kategorisasi kasus berdasarkan nilai statis (misal: <50 = Rendah, 50-150 = Sedang, >150 = Tinggi). Sangat dapat diprediksi dan stabil. | ✓ |
| Kuantil Dinamis (Dynamic Quantiles) | Kelompokkan dinamis berdasarkan persentil data terbaru (misal: 33% terbawah = Rendah, 33% tengah = Sedang, 33% teratas = Tinggi). | |

**User's choice:** Ambang Batas Tetap (Fixed Thresholds)
**Notes:** Menggunakan ambang batas statis (misalnya <50, 50-150, >150) untuk visualisasi density yang konsisten dari waktu ke waktu.

---

## Filter Antarmuka Penyakit

| Option | Description | Selected |
|--------|-------------|----------|
| Daftar Checkbox / Seleksi Badge | Dropdown multi-select yang menampilkan pil/badge untuk menambah/menghapus penyakit terpilih. Memungkinkan perbandingan penyakit tertentu berdampingan. | ✓ |
| Dropdown Single-select | Pilih satu penyakit atau gabungan seluruh penyakit saja. Antarmuka lebih sederhana tetapi tidak bisa membandingkan sub-kombinasi. | |

**User's choice:** Implementasi sesuai desain Figma (badge/pill multi-select interaktif).
**Notes:** Menghubungkan visualisasi filter dengan node Figma `250:294` di mana terdapat tombol pill interaktif di pojok kanan atas grafik tren perbandingan.

---

## Tile Layer Leaflet

| Option | Description | Selected |
|--------|-------------|----------|
| CartoDB Positron atau CartoDB Dark Matter | Gaya ubin peta sangat minimalis/abu-abu, sehingga warna choropleth Sleman (Rose/Amber/Emerald) menonjol indah dan sesuai dengan tema glassmorphism. | ✓ |
| Standard OpenStreetMap (OSM) | Ubin peta bawaan yang penuh warna (hijau, biru, jalan raya). Lebih detail secara geografis tetapi dapat bersaing secara visual dengan warna choropleth. | |

**User's choice:** CartoDB Positron / Dark Matter
**Notes:** Peta minimalis dipilih agar tidak bertabrakan dengan warna visual choropleth Sleman dan menjaga keindahan ambient glassmorphism.

---

## Tooltip Grafik Recharts

| Option | Description | Selected |
|--------|-------------|----------|
| Tooltip Gabungan (Combined Tooltip) | Menampilkan kasus semua penyakit yang sedang aktif/dipilih pada tanggal tersebut saat hover. Sangat bagus untuk membandingkan jumlah kasus antar penyakit secara langsung. | ✓ |
| Tooltip Tunggal (Single Tooltip) | Hanya menampilkan info penyakit dari garis spesifik yang sedang disentuh kursor. Lebih bersih tetapi membatasi kemudahan perbandingan. | |

**User's choice:** Tooltip Gabungan (Combined Tooltip)
**Notes:** Memungkinkan pengguna untuk melihat jumlah kasus dari semua penyakit terpilih secara bersamaan di satu tooltip saat melakukan hovering.

---

## the agent's Discretion

- Penentuan layout styling tombol filter di Next.js.
- Zoom level default peta Leaflet Sleman (center Sleman, zoom level 11).

## Deferred Ideas

- Modul anomali Z-score (Fase 4).
- Otentikasi admin / login screen (Fase 5).
