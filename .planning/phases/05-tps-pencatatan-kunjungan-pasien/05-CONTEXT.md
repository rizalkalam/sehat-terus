# Phase 5: TPS — Pencatatan Kunjungan Pasien - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase ini berfokus pada pembangunan lapisan backend Transaction Processing System (TPS) untuk pencatatan kunjungan pasien oleh staf fasilitas kesehatan (faskes). Sistem ini merupakan sumber data primer untuk tabel `RekamMedis`, `Resep`, `ResepItem`, `Stok`, dan `PergerakanStok`. 

Pekerjaan meliputi:
- Pembaruan skema `RekamMedis` dengan menambahkan kolom `dicatat_oleh`.
- Integrasi relasi `RekamMedis` dengan model `Pengguna`.
- Pembaruan seeder `seedAll.ts` untuk mengisi kolom `faskes_id` dan `dicatat_oleh` secara konsisten.
- Implementasi API endpoint referensi dropdown (wilayah kecamatan, ICD-10, obat aktif, formula racikan).
- Implementasi API endpoint CRUD Kunjungan (`/api/tps/kunjungan`) dengan validasi wilayah & otorisasi faskes pengguna.
- Implementasi API endpoint pembuatan Resep (`/api/tps/kunjungan/:id/resep`) dengan sistem transaksi basis data (rollback jika stok tidak cukup, pengurangan stok otomatis, dan pencatatan pergerakan stok).
- Implementasi API endpoint ringkasan kasus MIS (`/api/cases/summary`).
- Dokumentasi Swagger/OpenAPI untuk seluruh 10 endpoint TPS baru.

</domain>

<decisions>
## Implementation Decisions

### Schema & Models
- **D-01:** Kolom `dicatat_oleh` bertipe `UUID` ditambahkan ke model `RekamMedis` dengan `allowNull: true` agar seeder lama atau data legacy tidak terganggu, namun divalidasi `required` ketika di-insert via API TPS.
- **D-02:** `sequelize.sync({ alter: true })` digunakan untuk mensinkronisasi perubahan skema database ini ke PostgreSQL secara otomatis saat server berjalan atau saat seeder dieksekusi (sesuai ADR-002).

### Autentikasi & Otorisasi
- **D-03:** Semua endpoint TPS dilindungi oleh middleware `requireAuth`. Atribut `faskes_id` dan `dicatat_oleh` didapatkan secara dinamis dari `req.user.faskes_id` dan `req.user.id` yang diinjeksi oleh middleware.
- **D-04:** Pembuatan resep (`POST /api/tps/kunjungan/:id/resep`) dibatasi hanya untuk pengguna dengan peran (`peran`) `apoteker` atau `admin`.

### Transaksi & Inventori Obat
- **D-05:** Pengurangan stok obat wajib dibungkus dalam transaksi Sequelize (`sequelize.transaction()`). Jika salah satu stok obat (baik obat tunggal maupun komponen racikan) tidak mencukupi, seluruh proses pembuatan resep dibatalkan (rollback) dan mengembalikan respons error status 400.
- **D-06:** Setiap pengurangan stok obat dicatat di tabel `PergerakanStok` dengan tipe `keluar` dan referensi ID resep yang bersangkutan untuk kebutuhan audit trail.
- **D-07:** Racikan obat diurai ke komponen-komponen dasarnya via tabel `FormulaKomponen` untuk memotong stok masing-masing obat penyusunnya sebesar `takaran * jumlah_racikan`.

### Validasi Wilayah
- **D-08:** `kecamatan_domisili` pada kunjungan divalidasi ke tabel `Wilayah`. Nilai input harus cocok persis dengan `Wilayah.nama_kecamatan` untuk menjaga konsistensi data heatmap (ADR-003).

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` — Deskripsi ruang lingkup dan batasan proyek.
- `.planning/ROADMAP.md` — Roadmap fase dan daftar tugas Phase 5.
- `.planning/STATE.md` — Status pengerjaan saat ini.
- `.planning/TPS-API-SPEC.md` — Kontrak API lengkap untuk 10 endpoint TPS.
- `backend/src/models/RekamMedis.ts` — Model tabel rekam medis.
- `backend/src/models/index.ts` — Relasi antar model Sequelize.
- `backend/src/routes/auth.ts` — Contoh JSDoc Swagger yang diterapkan di routing Express.

</canonical_refs>

<code_context>
## Existing Code Insights

### Middleware Auth
- Middleware `requireAuth` di `backend/src/middleware/auth.ts` mengamankan endpoint, memeriksa JWT dari cookie `st_auth`, dan menyimpan data user di `req.user`.

### Database & Models
- Sequelize terhubung melalui `backend/src/config/database.ts`.
- Tabel rekam medis menggunakan nama tabel PascalCase `"RekamMedis"` di database PostgreSQL.

</code_context>
