---
title: Changelog — SehatTerus
tags:
  - changelog
  - progress
---

# 📋 Changelog — SehatTerus

> [!abstract] Tentang Dokumen Ini
> Catatan progress pengerjaan per sesi. Entri terbaru selalu di **paling atas**.
> Setiap entri menyertakan ID fitur dari [[FEATURES-MAP]] yang berubah statusnya.

---

## 2026-06-30 — Session: Backend Auth + Full Database Setup

### ✅ Diselesaikan

#### Backend — Autentikasi (F01)
- Endpoint `POST /api/auth/login` — validasi bcrypt, return JWT via cookie `st_auth` (HttpOnly) + `st_user` (readable)
- Endpoint `POST /api/auth/logout` — clear kedua cookie
- Endpoint `GET /api/auth/me` — ambil data pengguna dari JWT (dilindungi `requireAuth` middleware)
- Swagger UI tersedia di `GET /api/docs` + spec JSON di `GET /api/docs.json`

#### Backend — Models Baru (semua tabel schema)
Dibuat 13 Sequelize model baru menggunakan `declare` (tidak shadow getter Sequelize):

| Model | Tabel | Keterangan |
|-------|-------|------------|
| `Wilayah` | `wilayah` | 17 kecamatan Sleman |
| `FasilitasKesehatan` *(update)* | `fasilitas_kesehatan` | Tambah `wilayah_id`, `lat`, `long` |
| `Pengguna` | `pengguna` | Akun internal + bcrypt hash |
| `Obat` | `obat` | 14 item (12 obat jadi + 2 bahan baku) |
| `Pbf` | `pbf` | 3 distributor farmasi |
| `FormulaRacikan` | `formula_racikan` | 2 formula |
| `FormulaKomponen` | `formula_komponen` | Junction formula ↔ obat |
| `RekamMedis` *(update)* | `RekamMedis` | Tambah `faskes_id` |
| `Resep` | `resep` | Header resep |
| `ResepItem` | `resep_item` | Item resep (obat atau racikan) |
| `Stok` | `stok` | 15 baris per faskes per batch |
| `PergerakanStok` | `pergerakan_stok` | 15 baris masuk awal |
| `AlertEws` | `alert_ews` | 5 sample alert |
| `PrediksiKebutuhan` | `prediksi_kebutuhan` | 6 prediksi Juli 2026 |
| `SuratPesanan` | `surat_pesanan` | 1 SP draf |
| `SpItem` | `sp_item` | 2 item SP |

#### Backend — Seeders
- `npm run seed:auth` — seed `fasilitas_kesehatan` (2) + `pengguna` (4) dengan bcrypt
- `npm run seed:all` — seed lengkap semua tabel (idempotent, aman dijalankan ulang)

#### Frontend — Auth Integration
- `auth.client.ts` — fungsi `loginWithApi()` dan `logoutFromApi()` yang panggil API backend
- `login/page.tsx` — ganti `validateCredentials()` lokal → `loginWithApi()`
- `.env.local` — tambah `NEXT_PUBLIC_API_URL=http://localhost:5000`

#### Infrastructure
- Install deps backend: `bcryptjs`, `jsonwebtoken`, `swagger-ui-express`, `swagger-jsdoc`, `cookie-parser`
- `tsconfig.json` tambah `removeComments: false` agar Swagger JSDoc survive TS compile
- `Dockerfile` backend: ganti `npm ci` → `npm install` (workspace monorepo tidak punya backend-level lockfile)
- Tambah `JWT_SECRET=st-jwt-secret-2026` ke `.env`

### 🔄 Status Fitur Berubah

| ID | Fitur | Sebelum | Sesudah |
|----|-------|---------|---------|
| F01 | Login email & password | ❌ | ✅ |
| F02 | Logout | ❌ | 🟡 |
| F03 | Load profil dari token | ❌ | 🟡 |

### 📁 File Baru / Diubah

```
backend/src/
├── models/
│   ├── index.ts              ← diupdate (semua model + asosiasi)
│   ├── RekamMedis.ts         ← diupdate (tambah faskes_id, fix declare)
│   ├── FasilitasKesehatan.ts ← diupdate (tambah wilayah_id, lat, long)
│   ├── Pengguna.ts           ← baru
│   ├── Wilayah.ts            ← baru
│   ├── Obat.ts               ← baru
│   ├── Pbf.ts                ← baru
│   ├── FormulaRacikan.ts     ← baru
│   ├── FormulaKomponen.ts    ← baru
│   ├── Resep.ts              ← baru
│   ├── ResepItem.ts          ← baru
│   ├── Stok.ts               ← baru
│   ├── PergerakanStok.ts     ← baru
│   ├── AlertEws.ts           ← baru
│   ├── PrediksiKebutuhan.ts  ← baru
│   ├── SuratPesanan.ts       ← baru
│   └── SpItem.ts             ← baru
├── middleware/
│   └── auth.ts               ← baru (requireAuth JWT middleware)
├── controllers/
│   └── auth.ts               ← baru (login, logout, me)
├── routes/
│   └── auth.ts               ← baru (+ Swagger JSDoc)
├── config/
│   └── swagger.ts            ← baru
├── seedAuth.ts               ← baru
└── seedAll.ts                ← baru

frontend/src/
├── lib/
│   └── auth.client.ts        ← diupdate (loginWithApi, logoutFromApi)
└── app/(auth)/login/page.tsx ← diupdate (pakai loginWithApi)

.env                          ← diupdate (tambah JWT_SECRET)
frontend/.env.local           ← baru
.planning/
├── FEATURES-MAP.md           ← baru
├── CHANGELOG.md              ← baru (file ini)
└── DECISIONS.md              ← baru
```

### 🐛 Masalah & Solusi

| Masalah | Solusi |
|---------|--------|
| `st_user` cookie double-encoded | Hapus `encodeURIComponent()` di backend — Express sudah encode otomatis |
| Sequelize warning "public class fields shadowing getters" | Ganti `public id!: string` → `declare id: string` di semua model |
| Docker build gagal (`npm ci` lock file mismatch) | Ganti ke `npm install` di Dockerfile (workspace monorepo tidak maintain backend lockfile terpisah) |
| Swagger paths kosong di Docker prod | Tambah `removeComments: false` di `tsconfig.json` agar JSDoc survive compile |
| Docker Hub 500 saat `docker compose build` | Tunggu beberapa menit, coba lagi |

---

## 2026-06-24 — Session: Phase 3 Selesai

- Implementasi GIS aggregation endpoints (`/api/cases/spatial`, `/temporal`, `/region/:name`)
- Choropleth map dengan Leaflet di dashboard
- Region detail panel + time-series Recharts chart
- **Status:** Phase 3 complete (3/5 phases)

---

## 2026-06-22 — Session: Phase 2 Selesai

- Seeder `RekamMedis` dengan Faker.js (5.500 records)
- Validasi GeoJSON kecamatan Sleman

---

## 2026-06-21 — Session: Phase 1 Selesai

- Scaffold Next.js 15 + Express.js + PostgreSQL
- Docker Compose setup
- Sequelize model `RekamMedis` + migration

---

*Diperbarui oleh Claude Code setiap sesi*
