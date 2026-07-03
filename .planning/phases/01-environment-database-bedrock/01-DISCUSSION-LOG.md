# Phase 1: Environment & Database Bedrock - Log Diskusi

> **Hanya untuk jejak audit (Audit Trail).** Jangan gunakan sebagai masukan langsung untuk agen perencana atau eksekutor berikutnya.
> Semua keputusan resmi dicatat di CONTEXT.md — log ini menyimpan alternatif yang sempat dipertimbangkan.

**Tanggal:** 2026-06-23 (Diskusi Ulang - Fokus Frontend)
**Fase:** 1-Environment & Database Bedrock
**Topik Diskusi:** Pilihan ORM, Skema RekamMedis, Hot-Reloading Docker, dan Fokus Penyelarasan Frontend.

---

## 1. ORM Pilihan & Database

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| Sequelize ORM | ORM klasik yang sudah terpasang di modul backend Express.js saat ini. | ✅ |
| Prisma ORM | Rekomendasi di GEMINI.md, memerlukan migrasi ulang dari Sequelize ke Prisma. | |

**Keputusan:** Tetap menggunakan **Sequelize ORM** karena menyesuaikan dengan implementasi kode backend yang sudah berjalan di kontainer.

---

## 2. Skema Kolom Tabel RekamMedis

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| Kolom Lengkap | Menyimpan data granular: id, id_pasien, tanggal_kunjungan, kecamatan_domisili, nama_penyakit (diagnosa), gejala, usia, jenis_kelamin. | ✅ |
| Kolom Minimal | Hanya menyimpan kolom inti pelacakan wilayah: id, tanggal_kunjungan, kecamatan_domisili, nama_penyakit. | |

**Keputusan:** Menggunakan **Kolom Lengkap**. Hal ini penting agar visualisasi anomali dan segmentasi tren penyakit dapat dikelompokkan berdasarkan rentang usia atau jenis kelamin untuk analisis epidemiologi yang lebih kaya.

---

## 3. Hot-Reloading pada Docker Compose

| Opsi | Deskripsi | Dipilih |
|------|-----------|:-------:|
| Volume Mounting Lokal | Menggunakan Docker Volumes untuk memetakan direktori lokal ke dalam kontainer, mendukung hot-reload Next.js dev server secara langsung. | ✅ |
| Kontainer Statis | Build image sekali dan jalankan tanpa volume mounting. Harus rebuild image jika kode diubah. | |

**Keputusan:** Menggunakan **Volume Mounting Lokal** untuk mengoptimalkan efisiensi pengembangan lokal.

---

## 4. Penyelarasan Fokus Diskusi Ulang

**Catatan Diskusi:**
User menginstruksikan diskusi ulang Fase 1 difokuskan pada aspek **Frontend**. Kami mendokumentasikan keputusan antarmuka pengguna, tipografi (`Josefin Sans` dan `Montserrat`), skema warna utama (Teal Brand `#0c818a`), serta integrasi library visualisasi (`react-leaflet` dan `recharts`) untuk memastikan antarmuka terasa premium dan interaktif sesuai spesifikasi.
