# Phase 2: Mock Ingestion & Geographic Mapping Validation - Konteks

**Diperbarui:** 2026-06-23 (Diskusi Ulang)
**Status:** Siap untuk Perencanaan

<domain>
## Batasan Fase

Mengintegrasikan file GeoJSON batas kecamatan Kabupaten Sleman (DIY) di sisi frontend dan membuat script seeder di backend Express.js untuk mengisi database dengan 5.500 rekam medis tiruan yang tersebar secara spasial (kecamatan) dan temporal (24 bulan terakhir).

</domain>

<decisions>
## Keputusan Implementasi

### Model Geografis & GeoJSON
- **D-2.1:** Menggunakan peta **Kabupaten Sleman (Daerah Istimewa Yogyakarta)** sebagai model wilayah. File GeoJSON diletakkan di **`frontend/public/geojson/sleman-kecamatan.geojson`** untuk disajikan secara statis ke pustaka `react-leaflet`.

### Desain Kolom RekamMedis
- **D-2.2:** Mempertahankan struktur kolom minimalis (id, tanggal_kunjungan, kode_icd10, nama_penyakit, kecamatan_domisili) demi efisiensi performa dan kecepatan query agregasi temporal-spasial, tanpa menambahkan kolom id_pasien, gejala, usia, dan jenis_kelamin.

### Konfigurasi & Rentang Waktu Seeder
- **D-2.3:** Script seeder dibuat di **`backend/src/seed.ts`** dan dipicu melalui script `npm run seed` pada direktori backend.
- **D-2.4:** Nama kecamatan pada data tiruan diambil secara acak dari daftar resmi 17 kecamatan di Sleman agar cocok secara tepat (case-sensitive) dengan properti nama wilayah pada file GeoJSON.
- **D-2.5:** Rentang waktu pembuatan data acak diatur selama **24 bulan (2 tahun) ke belakang** dari waktu saat ini. Keputusan ini diambil agar grafik pergerakan penyakit musiman (seperti DBD pada musim hujan) dapat divisualisasikan secara lebih akurat dan realistis.
- **D-2.6:** Distribusi kasus diatur agar didominasi oleh penyakit umum (ISPA 40%, Influenza 25%, Diare 15%, DBD 13%, Hipertensi 7%), sedangkan penyakit langka untuk deteksi alarm anomali diatur dengan bobot kecil (0.3% secara kumulatif).

</decisions>

<specifics>
## Ide Spesifik

- Distribusi penyakit langka mencakup Leptospirosis, Campak, Difteri, Polio, dan Flu Burung untuk menguji alarm deteksi anomali pada Fase 4.
- Skrip validasi kecamatan dijalankan secara berkala untuk mendeteksi deviasi nama wilayah antara data seeder dan properti GeoJSON.

</specifics>

<deferred>
## Ide yang Ditangguhkan

- Penambahan form input rekam medis (di luar lingkup proyek MIS read-only publik).
- Sinkronisasi dinamis database dengan API eksternal (out of scope).

</deferred>

---
*Fase: 2-Mock Ingestion & Geographic Mapping Validation*
*Konteks diperbarui: 2026-06-23 (Diskusi Ulang)*
