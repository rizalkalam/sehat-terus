# Phase 1: Environment & Database Bedrock - Konteks

**Diperbarui:** 2026-06-23 (Diskusi Ulang - Fokus Frontend)
**Status:** Siap untuk Perencanaan

<domain>
## Batasan Fase

Membangun fondasi lingkungan pengembangan Next.js frontend, mengonfigurasi routing dasar, mengintegrasikan desain visual ambient (glassmorphism), dan mengonfigurasi hot-reloading melalui Docker Compose.

</domain>

<decisions>
## Keputusan Implementasi

### Manajer Paket & Node.js
- **D-01:** Menggunakan **npm** sebagai manajer paket untuk direktori `frontend/` dan `backend/`.
- **D-02:** Menggunakan Node.js v20 (Alpine LTS) sebagai base image di Dockerfile pengembangan.

### Kerangka Kerja & Dependensi Utama (Frontend)
- **D-03:** Menggunakan **Next.js 15.2.9 (App Router)** dan **React 19** untuk mempercepat rendering dan mendukung arsitektur Server Components.
- **D-04:** Menggunakan **Tailwind CSS v4** dengan konfigurasi `@theme inline` di global CSS untuk manajemen token desain secara modular.
- **D-05:** Menggunakan **react-leaflet** untuk visualisasi peta choropleth wilayah DIY/Sleman pada halaman utama.

### Desain Visual & Tipografi
- **D-06:** Mengadopsi visual bertema premium glassmorphism dengan latar belakang blur transparan, ambient gradient, dan custom scrollbar.
- **D-07:** Menggunakan font utama **Josefin Sans** (untuk heading dan antarmuka umum) dan font sekunder **Montserrat** (khusus untuk data tabular/ICD-10).

### Struktur Halaman & Routing
- **D-08:** Mendefinisikan rute antarmuka publik sebagai berikut:
  - `/` -> Dashboard Utama (GIS Map & Region Detail Panel)
  - `/proyeksi-tren` -> Halaman Prediksi & Line Chart (Recharts)
  - `/peringatan-dini` -> Halaman Deteksi Anomali & Mitigasi Tugas

### Pengembangan Lokal dengan Docker
- **D-09:** Menggunakan volume mounting lokal pada container `frontend` agar perubahan kode secara langsung ter-reflect (hot-reload) di dalam kontainer pengembangan.

</decisions>

<canonical_refs>
## Referensi Kanonik

### Dokumen Definisi Proyek
- `.planning/PROJECT.md` — Lingkup proyek, kendala teknologi, dan keputusan kunci.
- `.planning/REQUIREMENTS.md` — Pemetaan persyaratan fungsional (UI dan API).
- `.planning/ROADMAP.md` — Detail rencana per fase dan kriteria keberhasilan.
- `.planning/INDEX.md` — Peta dokumen dan kesehatan referensi pengetahuan.

</canonical_refs>

<code_context>
## Wawasan Kode yang Ada

- Direktori `frontend/` telah dibuat dengan konfigurasi Dockerfile multi-stage, `package.json`, dan file halaman awal.
- Struktur tata letak (`layout.tsx`) dan sidebar (`Sidebar.tsx`) telah terpasang dengan visual gradien ambient teal.
- Halaman dashboard (`page.tsx`) telah di-mock dengan representasi visual SVG dari peta Sleman/DIY untuk interaktivitas awal.

</code_context>

<specifics>
## Ide Spesifik

- Visualisasi peta Leaflet akan menggunakan GeoJSON lokal Sleman (DIY) yang dimuat secara dinamis.
- Komponen `ActivePatientsCard` telah diekstrak agar dapat digunakan kembali (reusable).

</specifics>

<deferred>
## Ide yang Ditangguhkan

- Migrasi database / integrasi API backend riil (ditangguhkan ke Fase 3).
- Implementasi sistem forecasting Z-score sisi klien (ditangguhkan ke Fase 4).

</deferred>

---
*Fase: 1-Environment & Database Bedrock*
*Konteks diperbarui: 2026-06-23 (Diskusi Ulang)*
