---
title: Architecture Decisions — SehatTerus
tags:
  - decisions
  - architecture
---

# 🏛️ Architecture Decisions — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Catatan keputusan arsitektur dan teknis penting beserta alasannya.
> Berguna ketika ada pertanyaan "kenapa dibuat begini?" di kemudian hari.

---

## ADR-001 — Cookie HttpOnly untuk JWT (bukan localStorage)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
JWT disimpan di cookie `st_auth` yang bersifat HttpOnly dan SameSite=Lax.
Cookie kedua `st_user` (non-HttpOnly) menyimpan data display user (nama, email).

**Alasan:**
- HttpOnly mencegah XSS mengakses token
- Next.js middleware server-side dapat membaca cookie HttpOnly untuk proteksi route
- `st_user` non-HttpOnly tetap dibutuhkan agar `getUserFromCookie()` di client bisa baca nama user tanpa harus panggil `/api/auth/me` setiap render

**Alternatif yang ditolak:**
- localStorage → rentan XSS, tidak bisa dibaca server-side middleware
- Bearer token manual → perlu tambah header di setiap fetch, lebih kompleks

---

## ADR-002 — Sequelize `sync({ alter: true })` bukan Migration Files

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Menggunakan `sequelize.sync({ alter: true })` di seeders untuk membuat/mengupdate tabel,
bukan Sequelize migration files (`sequelize-cli migrate`).

**Alasan:**
- Project ini adalah MVP university project, bukan production system
- `alter: true` lebih cepat untuk iterasi development
- Seeder sudah idempotent (`findOrCreate`) sehingga aman dijalankan berulang

**Risiko:**
- `alter: true` bisa kehilangan data jika tipe kolom berubah drastis
- Tidak ada rollback mechanism seperti migration

**Mitigasi:**
- Seeder selalu pakai `findOrCreate` (tidak truncate)
- Data RekamMedis (5.500 records) di-seed terpisah dan bisa di-regenerate

---

## ADR-003 — Tabel `RekamMedis` nama PascalCase (bukan snake_case)

**Tanggal:** 2026-06-30
**Status:** Aktif (legacy, tidak diubah)

**Keputusan:**
Tabel di PostgreSQL bernama `"RekamMedis"` (PascalCase dengan quotes), bukan `rekam_medis`.

**Alasan:**
Dibuat di Phase 1 sebelum konvensi snake_case ditetapkan di SCHEMA.md.
Mengubah nama tabel sekarang akan break existing 5.500 records dan semua query di `/api/cases/*`.

**Konsekuensi:**
Inkonsistensi dengan tabel lain yang semuanya snake_case.
Jika di-refactor di masa depan, perlu `ALTER TABLE "RekamMedis" RENAME TO rekam_medis` + update semua model dan controller.

---

## ADR-004 — Dockerfile Backend: `npm install` bukan `npm ci`

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Dockerfile backend menggunakan `npm install` (bukan `npm ci`) di kedua stage.

**Alasan:**
Project ini adalah npm workspace monorepo. `npm install` dari dalam folder `backend/`
menulis ke root `package-lock.json`, bukan ke `backend/package-lock.json`.
Sehingga `backend/package-lock.json` menjadi stale dan `npm ci` (yang membutuhkan lock file sync) selalu gagal.

**Konsekuensi:**
Build Docker sedikit lebih lambat dan tidak 100% reproducible.
Untuk production yang sebenarnya, solusi yang lebih baik adalah pindahkan backend ke monorepo dengan lock file terpusat atau pisahkan menjadi repo terpisah.

---

## ADR-005 — `removeComments: false` di tsconfig Backend

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Menambahkan `"removeComments": false` di `backend/tsconfig.json`.

**Alasan:**
`swagger-jsdoc` membaca komentar `@openapi` JSDoc dari file source untuk generate spec.
TypeScript by default strip semua comments saat compile ke JS.
Di Docker, hanya file `dist/*.js` yang ada — tanpa flag ini Swagger spec kosong di production.

**Efek samping:**
File `dist/` sedikit lebih besar karena semua comments ikut ter-compile.
Tidak ada dampak fungsional lain.

---

## ADR-006 — Dual Cookie Pattern (`st_auth` + `st_user`)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Backend set 2 cookie terpisah saat login:
- `st_auth` — JWT token, HttpOnly, SameSite=Lax, MaxAge 7 hari
- `st_user` — JSON `{email, name, displayName}`, non-HttpOnly, MaxAge 7 hari

**Alasan:**
Next.js middleware (server-side) membaca `st_auth` untuk proteksi route.
Frontend React components membaca `st_user` untuk tampilkan nama user di header/sidebar.
Karena `st_auth` HttpOnly tidak bisa dibaca JS browser, butuh cookie kedua untuk data display.

**Alternatif yang ditolak:**
- Panggil `GET /api/auth/me` di setiap komponen → terlalu banyak request
- Simpan user di localStorage → tidak aman + tidak sinkron dengan cookie auth

---

## ADR-007 — Swagger JSDoc di Route Files (bukan terpisah)

**Tanggal:** 2026-06-30
**Status:** Aktif

**Keputusan:**
Dokumentasi Swagger ditulis sebagai JSDoc comment langsung di file `src/routes/*.ts`,
bukan di file `.yaml` terpisah atau di controller.

**Alasan:**
- Dokumentasi dekat dengan definisi route → lebih mudah di-maintain
- `swagger-jsdoc` + `tsconfig removeComments: false` sudah handle parsing otomatis
- Tidak perlu tool eksternal atau step generate manual

---

*Diperbarui oleh Claude Code setiap ada keputusan arsitektur baru*
