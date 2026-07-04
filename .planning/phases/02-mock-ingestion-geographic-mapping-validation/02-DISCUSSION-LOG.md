# Phase 2: Mock Ingestion & Geographic Mapping Validation - Log Diskusi

> **Hanya untuk jejak audit (Audit Trail).** Jangan gunakan sebagai masukan langsung untuk agen perencana atau eksekutor berikutnya.
> Keputusan resmi dicatat di CONTEXT.md.

**Tanggal:** 2026-06-23 (Diskusi Ulang)
**Fase:** 2-Mock Ingestion & Geographic Mapping Validation
**Topik Diskusi:** Desain Kolom RekamMedis, Rentang Waktu Data Seeder, dan Bobot Penyakit.

---

## 1. Pembaruan Kolom RekamMedis

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| Kolom Lengkap | Menambahkan id_pasien, gejala, usia, jenis_kelamin ke tabel database. | |
| Kolom Minimal | Mempertahankan struktur kolom saat ini (id, tanggal_kunjungan, kode_icd10, nama_penyakit, kecamatan_domisili). | ✅ |

**Keputusan:** Mempertahankan kolom minimal saat ini untuk mengoptimalkan performa agregasi database. Data penyakit spasial dan temporal dapat dianalisis secara cepat tanpa beban relasi kolom tambahan yang tidak dibutuhkan untuk visualisasi peta choropleth publik.

---

## 2. Rentang Waktu Data Seeder

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| 12 Bulan Terakhir | Membuat data tiruan untuk 1 tahun ke belakang. | |
| 24 Bulan Terakhir | Membuat data tiruan untuk 2 tahun ke belakang. | ✅ |

**Keputusan:** Mengubah rentang waktu menjadi **24 Bulan Terakhir**. Keputusan ini diambil agar grafik tren spasial-temporal di halaman utama dan proyeksi tren di halaman `/proyeksi-tren` memiliki data historis multi-tahun yang memadai untuk melihat anomali musiman yang realistis.

---

## 3. Distribusi Kasus Penyakit

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| Distribusi Bobot Default | Penyakit umum mendominasi (ISPA 40%, Flu 25%, dll) dan penyakit langka 0.3%. | ✅ |
| Kustomisasi Bobot | Mengatur ulang proporsi masing-masing penyakit secara manual. | |

**Keputusan:** Mempertahankan distribusi default. Struktur ini sudah sangat baik untuk pengujian deteksi anomali di Fase 4 karena penyakit umum memberikan pola baseline yang konsisten, sementara kemunculan mendadak penyakit langka (seperti Leptospirosis atau Campak) akan dengan mudah memicu alarm Z-score.
