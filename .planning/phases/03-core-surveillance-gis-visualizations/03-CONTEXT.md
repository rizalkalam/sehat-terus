# Phase 3: Core Surveillance & GIS Visualizations - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase ini berfokus pada implementasi endpoint API backend Express untuk melakukan agregasi data spasial-temporal tingkat database, integrasi peta choropleth Sleman (DIY) secara interaktif menggunakan react-leaflet di Next.js, pembuatan Panel Detail Wilayah (Region Detail Panel) yang memuat data secara dinamis, serta visualisasi grafik tren perbandingan penyakit menggunakan Recharts Line Chart lengkap dengan filter interaktif.

</domain>

<decisions>
## Implementation Decisions

### Model Data & Penyimpanan Populasi
- **D-01:** Menyimpan data populasi untuk 17 kecamatan Kabupaten Sleman di database backend Express/PostgreSQL (atau file konfigurasi di sisi backend) dan disajikan ke frontend melalui API, sehingga fleksibel jika terdapat perubahan populasi di masa depan.

### Struktur API Backend
- **D-02:** Menggunakan struktur endpoint terpisah di backend Express demi modularitas dan payload ringan:
  - `/api/cases/spatial` -> Agregasi data kasus per kecamatan (untuk mewarnai choropleth map).
  - `/api/cases/temporal` -> Agregasi data kasus per rentang waktu (untuk grafik tren historical).
  - `/api/cases/region/:name` -> Mengambil detail statistik (total kasus dan populasi) suatu kecamatan terpilih.

### Integrasi Peta Leaflet & Panel Detail Wilayah
- **D-03:** Panel Detail Wilayah di frontend memuat data statistik wilayah secara dinamis dengan memicu request API baru ke `/api/cases/region/:name` setiap kali suatu kecamatan di peta Leaflet diklik (meminimalkan payload data choropleth awal).
- **D-05:** Pewarnaan choropleth map untuk tingkat kerawanan wilayah (Rendah / Sedang / Tinggi) dikategorikan menggunakan Ambang Batas Tetap (Fixed Thresholds) secara statis (contoh: <50 kasus = Rendah, 50-150 = Sedang, >150 = Tinggi) untuk konsistensi visual.
- **D-07:** Leaflet Tile Layer menggunakan gaya ubin peta minimalis yang bersih (seperti CartoDB Positron / Light Minimal) agar visualisasi warna choropleth kecamatan Sleman menonjol secara kontras dan sesuai dengan desain premium glassmorphism.

### Grafik Tren & Filter Recharts
- **D-04:** Grafik tren Recharts menggunakan interval agregasi waktu dinamis secara otomatis berdasarkan panjang filter rentang waktu (contoh: rentang < 30 hari = harian, 31-180 hari = mingguan, > 180 hari = bulanan) agar grafik tetap rapi.
- **D-06:** Pilihan filter penyakit pada grafik tren diimplementasikan menggunakan tombol pill/badge interaktif (toggle active/inactive) yang memungkinkan pengguna memilih dan membandingkan beberapa penyakit tertentu secara berdampingan (seperti DBD dan ISPA sekaligus), mengikuti referensi desain Figma (`node-id=250:294`).
- **D-08:** Tooltip pada grafik tren Recharts menggunakan Tooltip Gabungan (Combined Tooltip) yang mencantumkan seluruh penyakit yang sedang aktif terpilih pada tanggal yang di-hover kursor, mempermudah perbandingan langsung.

### the agent's Discretion
- Penentuan model visual chart (style stroke Recharts, layout filter panel) didelegasikan sepenuhnya ke pembuat kode, selama memenuhi panduan warna Accent dan Font dari UI-SPEC.
- Penentuan zoom level peta Leaflet default dan batas panning wilayah Sleman (direkomendasikan center Yogyakarta Sleman di zoom level 11).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- `.planning/PROJECT.md` — Deskripsi monorepo, kendala teknologi, dan lingkup proyek.
- `.planning/REQUIREMENTS.md` — Pemetaan kebutuhan fungsional (MAP-01, MAP-02, MAP-03, API-03).
- `.planning/ROADMAP.md` — Roadmap milestone, dependensi fase, dan kriteria keberhasilan Phase 3.
- `.planning/phases/03-core-surveillance-gis-visualizations/03-UI-SPEC.md` — Kontrak desain UI Phase 3 (skala spacing, warna aksen, tipografi, dan copywriting).

### Code & Assets
- `frontend/public/geojson/sleman-kecamatan.geojson` — File batas administrasi kecamatan Sleman.
- `backend/src/models/RekamMedis.ts` — Skema tabel rekam medis database.
- `frontend/src/app/globals.css` — Token visual, font Josefin Sans & Montserrat, dan glassmorphism scrollbar.
- `frontend/src/app/page.tsx` — Layout utama dashboard Next.js (yang akan mengganti mock SVG ke react-leaflet).

### External References
- Figma Design Node 250:294: `https://www.figma.com/design/22V0C7tqGeX7pdPdOrsGtX/Sistem-Epidemiologi--SehatTerus-?node-id=250-294&m=dev`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/ActivePatientsCard.tsx` — Widget data pasien aktif yang diintegrasikan di sidebar/kanan layar.
- `backend/src/seed.ts` — Daftar 17 nama kecamatan Sleman resmi (`KECAMATAN_LIST`) dan daftar penyakit umum/langka yang sesuai dengan data GeoJSON.

### Established Patterns
- Menggunakan Tailwind CSS v4 `@theme inline` di `globals.css` dengan font utama `font-josefin` dan data tabular `font-montserrat`.
- Docker Compose dijalankan di root monorepo untuk hot-reload kode frontend/backend.

### Integration Points
- Backend Express controller baru untuk route spatial, temporal, dan detail wilayah.
- Next.js Dashboard (`page.tsx`) akan memuat komponen Map dinamis dengan `ssr: false` karena Leaflet membutuhkan lingkungan window/DOM.

</code_context>

<specifics>
## Specific Ideas

- Visualisasi peta choropleth Sleman akan menyembunyikan/menonaktifkan kontrol bawaan Leaflet yang mengganggu (seperti attribution control yang berlebihan atau zoom control) demi tampilan glassmorphism yang bersih, atau menempatkannya di posisi yang rapi.
- Menambahkan parameter loading spinner transparan saat Region Detail Panel memicu fetch dinamis untuk mencegah UI terasa beku.

</specifics>

<deferred>
## Deferred Ideas

- Penambahan modul peramalan/forecasting epidemiologi Z-score di backend (ditangguhkan ke Phase 4).
- Penambahan otentikasi admin/login page (ditangguhkan ke Phase 5).

</deferred>

---

*Phase: 3-Core Surveillance & GIS Visualizations*
*Context gathered: 2026-06-24*
