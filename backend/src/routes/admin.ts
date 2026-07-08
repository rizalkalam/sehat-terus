import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  getUsers, createUser, updateUser, deleteUser,
  getObat, createObat, updateObat, deleteObat,
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
