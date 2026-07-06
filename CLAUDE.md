# SehatTerus — Claude Code Context

Public health epidemiology dashboard untuk D.I. Yogyakarta.
Stack: **Next.js 15** (frontend) + **Express.js + Sequelize** (backend) + **PostgreSQL** + **Docker Compose**.

---

## Struktur Monorepo

```
sehat-terus/
├── frontend/          # Next.js 15, App Router, Tailwind, Recharts, Leaflet
├── backend/           # Express.js, Sequelize ORM, swagger-jsdoc
├── .planning/         # Semua docs development (BACA INI DULU sebelum mulai)
│   ├── API-SPEC.md    ← spesifikasi semua endpoint + request/response shape
│   ├── FEATURES-MAP.md← status 37 fitur (mana yang done/pending)
│   ├── CHANGELOG.md   ← progress per sesi
│   ├── DECISIONS.md   ← keputusan arsitektur (ADR)
│   └── research/SCHEMA.md ← SQL schema lengkap semua tabel
├── docker-compose.yml
└── .env               # DB_URL, JWT_SECRET, FRONTEND_URL
```

---

## Commands

```bash
# Docker (selalu jalankan ini dulu)
docker compose up -d              # start db + backend container
docker compose up -d --build backend  # rebuild backend

# Backend dev (dari root atau backend/)
cd backend && npx tsx src/index.ts    # atau: npm run dev
npm run seed:auth                      # seed faskes + pengguna (4 akun)
npm run seed:all                       # seed semua tabel (idempotent)
npm run build                          # compile TS ke dist/

# Frontend dev
cd frontend && npm run dev
```

**Port:** Frontend `3000` · Backend `5000` · DB `5433` (host) / `5432` (container)

---

## Akun Test (setelah seed:auth)

| Email | Password | Peran |
|-------|----------|-------|
| carmen@sehatterus.id | sehat123 | manajer |
| apoteker@sehatterus.id | apoteker123 | apoteker |
| logistik@sehatterus.id | logistik123 | staf_logistik |
| admin@sehatterus.id | admin123 | admin |

> [!note] Landing per peran setelah login
> admin → `/admin`; manajer → `/` (dashboard MIS); apoteker & staf_logistik → Swagger UI backend
> (`/api/docs`), karena keduanya belum punya halaman dashboard FE sendiri (lihat `middleware.ts`).

---

## Aturan Wajib Update Dokumentasi (SELALU — Setiap Sesi)

Setiap kali ada **progress implementasi, keputusan arsitektur, atau perubahan scope**, update dokumen berikut **di akhir sesi atau segera setelah perubahan**:

| Dokumen | Update ketika |
|---------|---------------|
| `.planning/CHANGELOG.md` | Ada fitur selesai, endpoint dibuat, atau keputusan penting |
| `.planning/FEATURES-MAP.md` | Status fitur berubah (misalnya 🟠 → ✅) |
| `.planning/STATE.md` | Progress phase berubah, task selesai, atau posisi berubah |
| `.planning/ROADMAP.md` | Phase selesai, scope berubah, atau plan baru ditambahkan |
| `.planning/API-SPEC.md` | Endpoint baru ditambahkan atau spec berubah |
| `.planning/TPS-API-SPEC.md` | Spec TPS berubah atau endpoint TPS ditambahkan |

**Aturan:** Jangan tunggu diminta — langsung update setelah setiap perubahan bermakna.

---

## Aturan Wajib Setiap Endpoint Baru

1. **Swagger JSDoc** di route file (`src/routes/*.ts`) — lihat `src/routes/auth.ts` sebagai template
2. **requireAuth middleware** untuk semua POST/PUT/PATCH/DELETE
3. **Tambah data ke `seedAll.ts`** agar endpoint bisa ditest tanpa input manual
4. **Update `.planning/FEATURES-MAP.md`** — ubah status fitur terkait
5. **Update `.planning/CHANGELOG.md`** — tambah entri di paling atas

---

## Konvensi Backend

### Sequelize Model — WAJIB pakai `declare`
```typescript
// ✅ BENAR — tidak shadow getter Sequelize
export class Obat extends Model {
  declare id: string;
  declare nama: string;
}

// ❌ SALAH — menyebabkan warning "public class fields shadowing getters"
export class Obat extends Model {
  public id!: string;
  public nama!: string;
}
```

### Cookie Auth — JANGAN pre-encode
```typescript
// ✅ BENAR — Express res.cookie() sudah encode otomatis
res.cookie('st_user', JSON.stringify(userInfo), { ... });

// ❌ SALAH — double-encoded, client tidak bisa parse
res.cookie('st_user', encodeURIComponent(JSON.stringify(userInfo)), { ... });
```

### Tabel `RekamMedis` — nama PascalCase (legacy, jangan diubah)
```typescript
tableName: '"RekamMedis"'  // pakai quotes karena PostgreSQL case-sensitive
```

### requireAuth — cara pakai
```typescript
import { requireAuth } from '../middleware/auth';
// req.user tersedia setelah middleware: { id, email, peran, faskes_id }
router.post('/resource', requireAuth, controllerFn);
```

### Swagger security untuk endpoint protected
```typescript
/**
 * @openapi
 * /api/resource:
 *   get:
 *     security:
 *       - cookieAuth: []
 */
```

---

## Konvensi Frontend

- API calls via `fetch` dengan `credentials: 'include'` (untuk kirim cookie)
- Base URL dari `process.env.NEXT_PUBLIC_API_URL` (di `.env.local`: `http://localhost:5000`)
- Auth state dari `AuthContext` — baca cookie `st_user` untuk display name
- Route protection via Next.js middleware baca cookie `st_auth` (HttpOnly)

---

## Gotcha yang Pernah Terjadi

| Masalah | Solusi |
|---------|--------|
| `npm ci` gagal di Dockerfile | Pakai `npm install` — monorepo lockfile ada di root, bukan `backend/` |
| Swagger spec kosong di Docker prod | `tsconfig.json` harus punya `"removeComments": false` |
| Cookie `st_user` tidak bisa di-parse FE | Jangan `encodeURIComponent` sebelum `res.cookie()` |
| Sequelize warning "shadowing getters" | Pakai `declare` bukan `public field!` di model |
| Port 5000 conflict saat dev lokal | `docker stop sehat-terus-backend` dulu baru jalankan local dev |

---

## Auth Flow Singkat

```
POST /api/auth/login
  → bcrypt verify password
  → jwt.sign({ id, email, peran, faskes_id })
  → res.cookie('st_auth', token, { httpOnly: true, sameSite: 'lax' })
  → res.cookie('st_user', JSON.stringify({ nama, email, peran }), { httpOnly: false })

Middleware requireAuth:
  → baca req.cookies.st_auth
  → jwt.verify → req.user = AuthPayload
```

---

## Referensi Cepat

- **Spesifikasi semua endpoint:** `.planning/API-SPEC.md`
- **Status fitur (done/pending):** `.planning/FEATURES-MAP.md`
- **Schema DB lengkap:** `.planning/research/SCHEMA.md`
- **Swagger UI:** `http://localhost:5000/api/docs`
- **Keputusan arsitektur:** `.planning/DECISIONS.md`
