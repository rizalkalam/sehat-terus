import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  getUsers, createUser, updateUser, deleteUser,
  getObat, createObat, updateObat, deleteObat,
  getStokAdmin, createStok, updateStok, deleteStok,
  getFaskes, getPbf,
} from '../controllers/admin';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Panel admin — CRUD pengguna, master obat, dan lihat faskes. Semua endpoint butuh peran admin.
 */

// Semua route admin butuh auth + peran admin
router.use(requireAuth, requireAdmin);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

/**
 * @openapi
 * /api/admin/obat:
 *   get:
 *     tags: [Admin]
 *     summary: List semua master obat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar obat
 *       403:
 *         description: Bukan admin
 *   post:
 *     tags: [Admin]
 *     summary: Tambah obat baru ke master data
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, jenis, golongan, satuan]
 *             properties:
 *               nama:
 *                 type: string
 *                 example: Paracetamol 500mg
 *               jenis:
 *                 type: string
 *                 enum: [obat_jadi, bahan_baku]
 *               golongan:
 *                 type: string
 *                 enum: [reguler, npp]
 *               satuan:
 *                 type: string
 *                 example: strip
 *               harga_beli:
 *                 type: number
 *               stok_minimum:
 *                 type: integer
 *               kode_atc:
 *                 type: string
 *                 nullable: true
 *               pbf_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID PBF pemasok (lihat GET /api/logistic/surat-pesanan atau tabel pbf). Kosongkan/hapus field ini kalau belum ada pemasok tetap — JANGAN isi placeholder seperti "string".
 *     responses:
 *       201:
 *         description: Obat berhasil dibuat
 *       400:
 *         description: Field wajib belum lengkap, atau pbf_id tidak valid/tidak ditemukan
 */
router.get('/obat', getObat);
router.post('/obat', createObat);

/**
 * @openapi
 * /api/admin/obat/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update data obat
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Obat berhasil diupdate
 *       404:
 *         description: Obat tidak ditemukan
 *   delete:
 *     tags: [Admin]
 *     summary: Hapus obat dari master data
 *     description: Ditolak (409) kalau obat masih punya data terkait (stok, resep, riwayat transaksi).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Obat berhasil dihapus
 *       404:
 *         description: Obat tidak ditemukan
 *       409:
 *         description: Obat masih dipakai, tidak bisa dihapus
 */
router.put('/obat/:id', updateObat);
router.delete('/obat/:id', deleteObat);

/**
 * @openapi
 * /api/admin/stok:
 *   get:
 *     tags: [Admin]
 *     summary: List semua baris stok (semua faskes)
 *     description: Override admin langsung ke tabel stok. Beda dari POST /api/stok/realokasi & /retur — endpoint ini TIDAK mencatat pergerakan_stok.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar stok
 *       403:
 *         description: Bukan admin
 *   post:
 *     tags: [Admin]
 *     summary: Tambah baris stok baru (koreksi inventaris manual)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faskes_id, obat_id]
 *             properties:
 *               faskes_id:
 *                 type: string
 *                 format: uuid
 *               obat_id:
 *                 type: string
 *                 format: uuid
 *               jumlah_tersedia:
 *                 type: integer
 *                 default: 0
 *               tanggal_kedaluwarsa:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               batch:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Stok berhasil dibuat
 *       400:
 *         description: Field wajib belum lengkap, atau faskes_id/obat_id tidak valid
 *       409:
 *         description: Kombinasi faskes+obat+batch+tanggal kedaluwarsa sudah ada
 */
router.get('/stok', getStokAdmin);
router.post('/stok', createStok);

/**
 * @openapi
 * /api/admin/stok/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update baris stok
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Stok berhasil diupdate
 *       404:
 *         description: Stok tidak ditemukan
 *       409:
 *         description: Kombinasi faskes+obat+batch+tanggal kedaluwarsa sudah ada
 *   delete:
 *     tags: [Admin]
 *     summary: Hapus baris stok
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Stok berhasil dihapus
 *       404:
 *         description: Stok tidak ditemukan
 */
router.put('/stok/:id', updateStok);
router.delete('/stok/:id', deleteStok);

// Faskes
router.get('/faskes', getFaskes);

/**
 * @openapi
 * /api/admin/pbf:
 *   get:
 *     tags: [Admin]
 *     summary: List semua PBF (pemasok) — untuk dropdown pbf_id di form obat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar PBF
 *       403:
 *         description: Bukan admin
 */
router.get('/pbf', getPbf);

export default router;
