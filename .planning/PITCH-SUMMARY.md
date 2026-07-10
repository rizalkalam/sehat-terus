# Resume Proyek — Bahan Pitching SehatTerus

> Dokumen ini adalah **rangkuman siap pakai** untuk dijadikan konteks prompt saat meminta naskah
> pitching (dosen) atau pitch deck (investor). Bukan dokumen resmi planning — lihat
> `.planning/PROJECT.md`, `STATE.md`, `FEATURES-MAP.md` untuk detail teknis lengkap.

---

## 1. Identitas Proyek

- **Nama:** SehatTerus (internal: *Public Health Radar*)
- **Kategori:** Management Information System (MIS) untuk surveilans kesehatan masyarakat
- **Cakupan wilayah:** Sleman, D.I. Yogyakarta (17 kecamatan, siap diperluas ke kabupaten lain)
- **Bentuk:** Web dashboard internal (bukan aplikasi publik/pasien)
- **Status saat ini:** Milestone v1.0 selesai 100% — 10/10 phase, 31/31 plan, 35/37 fitur inti selesai (95%)

---

## 2. Masalah yang Diselesaikan

Dinas kesehatan dan fasilitas kesehatan (faskes) di Indonesia umumnya:
- Mendeteksi lonjakan kasus penyakit **secara manual/reaktif** — sudah telat saat wabah membesar
- Tidak punya visibilitas **spasial** (kecamatan mana yang jadi hotspot) dan **temporal** (tren naik/turun) dalam satu tempat
- Manajemen stok obat esensial di faskes sering **kehabisan (stockout)** atau **mubazir (dead-stock/kedaluwarsa)** karena tidak ada proyeksi kebutuhan
- Proses pengadaan obat ke PBF (distributor) manual, rawan salah kelompok golongan obat (narkotika-psikotropika vs reguler)
- Tidak ada jejak akuntabilitas yang jelas: data kasus siapa yang input, siapa yang tangani alert, siapa yang setujui pemindahan stok

## 3. Solusi & Proposisi Nilai

**Core value:** Menyediakan *early warning* spasial dan temporal untuk wabah penyakit, berbasis data yang dapat dipertanggungjawabkan per faskes — **tanpa beban administratif tambahan**.

Value proposition dalam satu kalimat:
> Dashboard tunggal yang mengubah data rekam medis mentah menjadi peta hotspot, proyeksi tren, peringatan dini otomatis, dan rekomendasi logistik obat — semua real-time dan dapat ditelusuri.

---

## 4. Target Pengguna (4 peran, sudah live)

| Peran | Kebutuhan Utama | Landing Page |
|-------|------------------|--------------|
| **Manajer Kesehatan** | Peta wabah, tren, laporan makro | `/` (dashboard MIS) |
| **Apoteker** | Kelola stok, buat surat pesanan (SP), tanda tangan SP golongan NPP | via Swagger (FE pending) |
| **Staf Logistik** | Pantau defekta, slow-moving, realokasi stok antar cabang | via Swagger (FE pending) |
| **Admin Sistem** | Kelola akun, master data obat/stok, jalankan prediksi AI | `/admin` |

---

## 5. Fitur Utama yang Sudah Berjalan (Demo-able)

### A. Surveilans Penyakit (GIS) — `/`
- Peta choropleth interaktif kasus per kecamatan (Leaflet + GeoJSON 17 kecamatan)
- Detail kecamatan on-click: jumlah kasus, insidence rate
- Filter rentang waktu & jenis penyakit
- Stat card real-time (total pasien aktif, kecamatan aktif) + donut chart komposisi penyakit + tabel top 5 penyakit

### B. Early Warning System (EWS) — `/peringatan-dini`
- **Deteksi anomali otomatis berbasis Z-score** (bukan threshold manual): membandingkan 7 hari terakhir vs baseline 28 hari per kecamatan+penyakit
- Kartu alert Kritis/Waspada dengan detail lonjakan %, laju harian, estimasi puncak
- Ringkasan situasi otomatis (AI banner)
- Tindakan langsung dari alert: realokasi stok antar faskes atau retur, tandai "ditangani/selesai"
- Chart stok vs kebutuhan untuk obat kritis

### C. Proyeksi & Forecasting — `/proyeksi-tren`
- **Algoritma Holt's Linear Trend (double exponential smoothing)** untuk proyeksi 14–30 hari ke depan, dihitung on-the-fly dari data historis (bukan model statis)
- Chart tren dengan garis solid (historis) menyambung ke garis putus-putus (proyeksi)
- Stat card peningkatan/penurunan tertinggi
- Rekomendasi obat otomatis berdasarkan riwayat resep nyata per penyakit yang diproyeksikan naik

### D. Manajemen Stok & Logistik — `/logistik`
- Defekta (obat di bawah stok minimum), dikelompokkan otomatis per distributor (PBF) & golongan obat
- Slow-moving/dead-stock detection dengan saran realokasi vs retur berbasis data pemakaian nyata
- Near-expiry tracking
- Buat Surat Pesanan (SP) langsung dari daftar defekta — validasi otomatis menolak pencampuran golongan Narkotika-Psikotropika (NPP) dengan obat reguler, dan hanya apoteker berlisensi (nomor SIPA) yang bisa tanda tangan SP NPP

### E. Admin Panel — `/admin`
- CRUD pengguna, master obat, master stok
- **Prediksi kebutuhan obat via AI (Groq LLM)**: sistem menghitung angka pasti (usulan pesanan, ketahanan stok, nilai modal) lalu AI hanya menulis ringkasan naratif & rekomendasi — didesain agar AI tidak mengarang angka (anti-halusinasi by design)

### F. Autentikasi & Profil
- Login berbasis JWT + cookie httpOnly, role-based redirect otomatis
- Edit profil (nama, telepon, alamat) per pengguna

---

## 6. Keunggulan Teknis (Diferensiator untuk Dosen — aspek akademik)

- **Bukan CRUD generik** — ada 2 algoritma analitik non-trivial yang diimplementasi sendiri: Z-score anomaly detection dan Holt's linear trend forecasting
- **Desain AI yang bertanggung jawab**: LLM (Groq) tidak pernah diminta menghasilkan angka kritis — hanya narasi dari angka yang sudah dihitung sistem, mengurangi risiko halusinasi pada data kesehatan
- **Integritas data & keamanan**: role-based access control (guard di level FE middleware **dan** BE middleware, bukan cuma UI), constraint referential integrity dilindungi di level database (FK `ON DELETE RESTRICT`), validasi transaksi (stok dikurangi dalam DB transaction, FEFO-aware)
- **Diverifikasi end-to-end secara nyata** — bukan cuma type-check: setiap fitur diverifikasi lewat curl + query database langsung + Playwright browser testing, termasuk penemuan & perbaikan bug nyata selama proses (dicatat sebagai bukti proses rekayasa perangkat lunak yang matang, bukan asal jalan)
- **Dokumentasi arsitektur lengkap**: setiap keputusan desain (kenapa memilih pendekatan tertentu, deviasi dari spec awal) dicatat sebagai ADR (Architecture Decision Record) — praktik rekayasa perangkat lunak profesional

## 7. Keunggulan Bisnis (Diferensiator untuk Investor — aspek pasar)

- **Problem nyata & terukur**: keterlambatan deteksi wabah dan inefisiensi stok obat adalah masalah operasional harian di ribuan faskes Indonesia
- **Bukan sekadar dashboard visualisasi** — sistem memberi *rekomendasi aksi* (realokasi, retur, buat SP) langsung dari data, bukan cuma laporan pasif
- **Skalabel secara geografis**: arsitektur berbasis kecamatan/wilayah generik (GeoJSON-driven) — memperluas dari 17 kecamatan Sleman ke kabupaten/provinsi lain adalah penambahan data, bukan penulisan ulang sistem
- **Multi-tenant siap secara struktural**: model data sudah per-faskes (`faskes_id`) — fondasi untuk melayani banyak faskes/dinas kesehatan sekaligus
- **Stack modern & maintainable**: Next.js 15, Express, PostgreSQL, Docker — mudah di-deploy, mudah direkrut talent-nya
- **Rekam jejak eksekusi cepat**: 10 fase pengembangan diselesaikan dalam ~2,5 minggu (2026-06-21 s.d. 2026-07-08), menunjukkan kecepatan iterasi tim

---

## 8. Angka & Metrik Konkret (Bukti, Bukan Klaim)

| Metrik | Nilai |
|--------|-------|
| Fitur inti selesai | 35/37 (95%) |
| Fase pengembangan selesai | 10/10 (100%) |
| Endpoint API | 30+ endpoint REST terdokumentasi (Swagger) |
| Data rekam medis (seed/simulasi) | 5.532 baris |
| Kecamatan tercakup | 17 (Sleman, DIY) |
| Peran pengguna | 4 (manajer, apoteker, staf logistik, admin) |
| Model database (tabel) | 16+ tabel relasional |
| Durasi pengembangan milestone v1.0 | ~2,5 minggu |

---

## 9. Yang Belum Selesai (Transparansi — penting untuk Q&A)

- **F33** — Update status Surat Pesanan (draf → disetujui → dikirim → diterima) — belum ada endpoint/halaman
- **F37** — Ganti cabang untuk admin multi-faskes — belum diimplementasi
- Halaman dashboard FE untuk peran **apoteker** dan **staf logistik** belum ada (saat ini diarahkan ke Swagger API docs)
- Integrasi Groq AI (`GROQ_API_KEY`) sudah selesai secara kode tapi belum diverifikasi dengan key produksi asli
- Belum ada milestone v1.1/v2.0 yang direncanakan — roadmap ke depan masih terbuka

---

## 10. Cara Pakai Dokumen Ini

Gunakan resume ini sebagai konteks saat meminta Claude menyusun:
1. **Naskah pitching dosen** — tekankan Bagian 6 (keunggulan teknis/akademik), Bagian 8 (metrik), dan Bagian 9 (transparansi keterbatasan sebagai bukti kejujuran ilmiah)
2. **Pitch deck investor** — tekankan Bagian 2–3 (masalah & solusi), Bagian 7 (keunggulan bisnis & skalabilitas), Bagian 8 (traksi/progress sebagai bukti eksekusi)
3. **Demo flow** — ikuti urutan Bagian 5 (A→F) sebagai alur demo langsung di browser

---

*Disusun otomatis oleh Claude Code — 2026-07-08, berdasarkan `.planning/PROJECT.md`, `STATE.md`, `FEATURES-MAP.md`.*
