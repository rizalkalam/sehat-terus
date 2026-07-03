# Phase 3: Core Surveillance & GIS Visualizations - Research

**Researched:** 2026-06-24
**Domain:** Next.js (App Router), Express.js, Sequelize ORM, PostgreSQL, react-leaflet (Leaflet.js), Recharts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Penyimpanan Populasi):** Data populasi untuk 17 kecamatan Sleman disimpan di database backend Express/PostgreSQL atau file konfigurasi backend, dan disajikan melalui API.
- **D-02 (Struktur API):** Menggunakan endpoint terpisah: `/api/cases/spatial` (peta), `/api/cases/temporal` (grafik tren), dan `/api/cases/region/:name` (detail per kecamatan).
- **D-03 (Pemuatan Detail Wilayah):** Panel detail wilayah memicu fetch API baru ke `/api/cases/region/:name` secara dinamis ketika kecamatan diklik di peta.
- **D-04 (Interval Agregasi Tren):** Interval agregasi waktu grafik tren Recharts dinamis secara otomatis berdasarkan filter tanggal (<30 hari = harian, 31-180 hari = mingguan, >180 hari = bulanan).
- **D-05 (Ambang Batas Peta):** Klasifikasi warna choropleth menggunakan Ambang Batas Tetap (Fixed Thresholds): <50 = Rendah (Emerald), 50-150 = Sedang (Amber), >150 = Tinggi (Rose).
- **D-06 (Filter Penyakit):** Antarmuka filter penyakit menggunakan tombol pill/badge interaktif (toggle) untuk membandingkan sub-kombinasi penyakit berdampingan sesuai desain Figma.
- **D-07 (Tile Layer Peta):** Menggunakan gaya ubin peta minimalis CartoDB Positron atau CartoDB Dark Matter.
- **D-08 (Tooltip Grafik):** Tooltip grafik tren menampilkan data gabungan (Combined Tooltip) seluruh penyakit yang aktif pada tanggal kursor melayang (hover).

### the agent's Discretion
- Penentuan stroke color, grid opacity, dan legend positioning di Recharts.
- Konfigurasi zoom default peta Leaflet Sleman (center Sleman, zoom level 11).

### Deferred Ideas
- Modul forecasting projections Z-score (ditangguhkan ke Phase 4).
- Autentikasi JWT/login screen (ditangguhkan ke Phase 5).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spatial Aggregation Endpoint | Express.js API | Sequelize ORM | Menghitung total kasus per kecamatan dari database `RekamMedis`. |
| Temporal Aggregation Endpoint | Express.js API | Sequelize ORM | Mengelompokkan kasus berdasarkan waktu dan kode ICD-10. |
| Choropleth Map Component | Next.js Client | react-leaflet | Merender peta SVG batas Sleman secara dinamis di browser. |
| Historical Trends Chart | Next.js Client | Recharts | Mengilustrasikan garis pergerakan kasus per penyakit terpilih. |
| Detail Panel | Next.js Client | - | Menampilkan jumlah kasus dan angka insidensi per 10.000 penduduk wilayah. |
</architectural_responsibility_map>

<research_summary>
## Summary

Fase ini mengimplementasikan visualisasi data kesehatan masyarakat di sisi frontend dan integrasi endpoint agregasi database di sisi backend. 
- Di backend, kita akan membuat API pengelompokan spasial dan temporal menggunakan query grouping Sequelize (`COUNT` dan `GROUP BY`) dengan filter tanggal dan kode ICD-10. Data populasi kecamatan akan disimpan sebagai data statis/tabel untuk menghitung angka insidensi kasus per 10.000 penduduk.
- Di frontend, peta choropleth Sleman akan dirender menggunakan `react-leaflet` dan file GeoJSON statis, mengunduh data kasus per kecamatan, mewarnainya sesuai ambang batas fixed threshold, serta merender grafik tren Recharts dengan filter penyakit berbentuk pil interaktif.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **leaflet** | `1.9.4` | Mapping Library | Underpinning GIS technology, mature and lightweight. |
| **react-leaflet** | `5.0.0` | React wrapper for Leaflet | Direct React 19 compatibility. |
| **recharts** | `3.8.1` | Charting Library | Native support for React 19 charts. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | `4.1.0` | Date manipulation | Formatting date filters and grouping intervals. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet | Mapbox GL JS | Mapbox GL JS requires active API keys and introduces commercial costs, whereas Leaflet is completely open-source, runs offline, and easily handles administrative GeoJSON shapes. |

**Installation:**
```bash
# Di frontend/
npm install leaflet@1.9.4 react-leaflet@5.0.0 recharts@3.8.1
npm install -D @types/leaflet@1.9.0
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### 1. Leaflet SSR Bypass Pattern
Leaflet berinteraksi langsung dengan DOM/window. Jika dirender di sisi server Next.js (SSR), aplikasi akan crash dengan error `window is not defined`.
*Solusi:* Impor komponen peta secara dinamis dengan opsi `{ ssr: false }`:
```tsx
import dynamic from 'next/dynamic';
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });
```

### 2. Impor Global CSS Leaflet
Agar ikon penanda, zoom bar, dan popup Leaflet ter-styling dengan benar:
*Solusi:* Impor CSS Leaflet di bagian atas `frontend/src/app/layout.tsx` atau `globals.css`:
```css
@import "leaflet/dist/leaflet.css";
```

### 3. Query Agregasi Sequelize
- Agregasi Spasial:
  ```typescript
  RekamMedis.findAll({
    attributes: [
      'kecamatan_domisili',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_cases']
    ],
    where: { ...dateFilter, ...diseaseFilter },
    group: ['kecamatan_domisili']
  });
  ```
- Agregasi Temporal:
  ```typescript
  // Berdasarkan D-04, lakukan truncating tanggal sesuai interval (day, week, month)
  const dateField = sequelize.fn('DATE_TRUNC', interval, sequelize.col('tanggal_kunjungan'));
  RekamMedis.findAll({
    attributes: [
      [dateField, 'visit_date'],
      'kode_icd10',
      'nama_penyakit',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_cases']
    ],
    where: { ...dateFilter, ...diseaseFilter },
    group: [dateField, 'kode_icd10', 'nama_penyakit'],
    order: [[dateField, 'ASC']]
  });
  ```
</architecture_patterns>

<avoid_pitfalls>
## Pitfalls to Avoid

### 1. Leaflet Stack Loading Lag
Ubin peta dirender bertumpuk secara vertikal (broken tiles) pada pemuatan pertama karena stylesheet Leaflet terlambat dimuat.
*Mitigasi:* Masukkan `@import "leaflet/dist/leaflet.css"` langsung di file global `globals.css` atau layout root.

### 2. N-Plus-One Queries pada Detail Kecamatan
Melakukan query database terpisah untuk setiap detail kecamatan yang diklik jika tidak dioptimalkan.
*Mitigasi:* Gunakan parameter query tunggal `/api/cases/region/:name` yang melakukan agregasi database cepat menggunakan index `idx_rekam_medis_kecamatan_domisili`.

### 3. Z-Index Conflict (Leaflet vs. Next.js Sidebar)
Peta Leaflet secara default memiliki z-index tinggi (`z-index: 400` untuk pane), yang dapat menutupi sidebar Next.js atau navbar overlay.
*Mitigasi:* Atur z-index sidebar Next.js ke `z-index-[9999]` di css/Tailwind agar tetap berada di atas peta.
</avoid_pitfalls>

<validation_architecture>
## Validation Architecture

### Test commands
```bash
# Jalankan validasi tipe TypeScript sisi backend
cd backend && npx tsc --noEmit

# Jalankan validasi tipe TypeScript sisi frontend
cd frontend && npx tsc --noEmit
```

### Verification Steps
1. Panggil `/api/cases/spatial` dan verifikasi response mengembalikan array kecamatan dengan jumlah kasusnya.
2. Panggil `/api/cases/temporal?interval=month` dan verifikasi data terkelompok bulanan secara berurutan.
3. Buka halaman utama (`/`) di browser dan pastikan peta Sleman ter-render dengan ubin minimalis CartoDB Positron tanpa error SSR.
4. Klik kecamatan Sleman (misal: Depok) dan verifikasi Region Detail Panel menampilkan populasi dan incidence rate yang benar.
5. Filter penyakit di grafik tren dan pastikan Recharts memvisualisasikan garis tren gabungan dengan benar.
</validation_architecture>

## Validation Architecture - Validation Strategy

## Validation Strategy for Phase 3

### Dimension 8 Nyquist Verification
- **V-01 (Spatial Aggregation Verification):** Unit test atau API test yang mengirimkan request ke `/api/cases/spatial` dengan filter rentang waktu tertentu, memastikan response mengembalikan format objek JSON berisi nama kecamatan, koordinat centroid (opsional), dan jumlah kasus.
- **V-02 (Temporal Aggregation & Dynamic Grouping Verification):** Uji coba API `/api/cases/temporal` dengan parameter rentang tanggal berbeda untuk memastikan logika pengelompokan dinamis (harian, mingguan, bulanan) di sisi backend berjalan dan mengembalikan timestamps terurut.
- **V-03 (Incidence Rate Calculation Verification):** Uji unit yang memverifikasi perhitungan rumus angka insidensi per 10.000 penduduk `(total_kasus / populasi_kecamatan) * 10000` di `/api/cases/region/:name` sesuai dengan angka populasi kecamatan Sleman yang tersimpan.
- **V-04 (Leaflet SSR & Render Verification):** Menjalankan build Next.js (`npm run build`) untuk memastikan dynamic import `react-leaflet` berhasil membypass SSR dan tidak menimbulkan error `window is not defined` saat kompilasi.
- **V-05 (Recharts Combined Tooltip and Interaction Verification):** Verifikasi manual/lokal bahwa interaksi klik tombol filter penyakit (pill badges) memperbarui set data Recharts dan tooltip menampilkan data gabungan penyakit aktif secara akurat.
