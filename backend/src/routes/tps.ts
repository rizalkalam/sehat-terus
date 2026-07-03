import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listPenyakit,
  listWilayah,
  listObat,
  listFormula,
} from '../controllers/tps/referensi';
import {
  createKunjungan,
  listKunjungan,
  getKunjunganById,
  updateKunjungan,
  deleteKunjungan,
} from '../controllers/tps/kunjungan';
import { createResep } from '../controllers/tps/resep';

const router = Router();

// All TPS routes are protected by default
router.use(requireAuth);

/**
 * @openapi
 * tags:
 *   - name: TPS - Kunjungan
 *     description: Endpoint CRUD kunjungan pasien untuk faskes
 *   - name: TPS - Resep
 *     description: Endpoint resep obat dan pemotongan stok
 *   - name: TPS - Referensi
 *     description: Endpoint lookup data referensi untuk form input TPS
 */

/**
 * @openapi
 * /api/tps/referensi/penyakit:
 *   get:
 *     tags: [TPS - Referensi]
 *     summary: Daftar penyakit (kode ICD-10) untuk dropdown
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar penyakit
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   kode_icd10:
 *                     type: string
 *                     example: J06.9
 *                   nama_penyakit:
 *                     type: string
 *                     example: ISPA
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/referensi/penyakit', listPenyakit);

/**
 * @openapi
 * /api/tps/referensi/wilayah:
 *   get:
 *     tags: [TPS - Referensi]
 *     summary: Daftar wilayah kecamatan Sleman untuk dropdown domisili
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar wilayah
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   nama_kecamatan:
 *                     type: string
 *                     example: Depok
 *                   kabupaten:
 *                     type: string
 *                     example: Sleman
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/referensi/wilayah', listWilayah);

/**
 * @openapi
 * /api/tps/referensi/obat:
 *   get:
 *     tags: [TPS - Referensi]
 *     summary: Daftar obat aktif dengan stok > 0 di faskes pengguna
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Filter pencarian nama obat (partial match)
 *       - in: query
 *         name: golongan
 *         schema:
 *           type: string
 *           enum: [reguler, npp]
 *         description: Filter berdasarkan golongan obat
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar obat
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   nama:
 *                     type: string
 *                     example: Amoksisilin 500mg
 *                   satuan:
 *                     type: string
 *                     example: strip
 *                   golongan:
 *                     type: string
 *                     example: reguler
 *                   stok_tersedia:
 *                     type: integer
 *                     example: 80
 *       401:
 *         description: Tidak terautentikasi
 *       400:
 *         description: Pengguna tidak terasosiasi faskes
 */
router.get('/referensi/obat', listObat);

/**
 * @openapi
 * /api/tps/referensi/formula:
 *   get:
 *     tags: [TPS - Referensi]
 *     summary: Daftar formula racikan obat yang stok seluruh komponennya mencukupi
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar formula racikan
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   nama_racikan:
 *                     type: string
 *                     example: Puyer Demam Anak
 *                   deskripsi:
 *                     type: string
 *                     example: Kombinasi paracetamol dan CTM
 *                   komponen_count:
 *                     type: integer
 *                     example: 2
 *                   stok_cukup:
 *                     type: boolean
 *                     example: true
 *       401:
 *         description: Tidak terautentikasi
 *       400:
 *         description: Pengguna tidak terasosiasi faskes
 */
router.get('/referensi/formula', listFormula);

/**
 * @openapi
 * /api/tps/kunjungan:
 *   post:
 *     tags: [TPS - Kunjungan]
 *     summary: Catat satu kunjungan pasien baru
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kode_icd10, nama_penyakit, kecamatan_domisili]
 *             properties:
 *               tanggal_kunjungan:
 *                 type: string
 *                 format: date
 *                 example: 2026-07-02
 *               kode_icd10:
 *                 type: string
 *                 example: J06.9
 *               nama_penyakit:
 *                 type: string
 *                 example: ISPA
 *               kecamatan_domisili:
 *                 type: string
 *                 example: Depok
 *     responses:
 *       201:
 *         description: Kunjungan berhasil dicatat
 *       400:
 *         description: Request body tidak valid atau kecamatan tidak ditemukan
 *       401:
 *         description: Tidak terautentikasi
 */
router.post('/kunjungan', createKunjungan);

/**
 * @openapi
 * /api/tps/kunjungan:
 *   get:
 *     tags: [TPS - Kunjungan]
 *     summary: Daftar kunjungan pasien di faskes pengguna
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal kunjungan (default hari ini, format YYYY-MM-DD)
 *       - in: query
 *         name: kode_icd10
 *         schema:
 *           type: string
 *         description: Filter kode penyakit tertentu
 *       - in: query
 *         name: kecamatan
 *         schema:
 *           type: string
 *         description: Filter kecamatan domisili pasien
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar kunjungan
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/kunjungan', listKunjungan);

/**
 * @openapi
 * /api/tps/kunjungan/{id}:
 *   get:
 *     tags: [TPS - Kunjungan]
 *     summary: Detail satu kunjungan beserta resepnya
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
 *         description: Berhasil mengambil detail kunjungan
 *       404:
 *         description: Kunjungan tidak ditemukan
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/kunjungan/:id', getKunjunganById);

/**
 * @openapi
 * /api/tps/kunjungan/{id}:
 *   put:
 *     tags: [TPS - Kunjungan]
 *     summary: Koreksi data kunjungan pasien (sebelum resep dibuat)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tanggal_kunjungan:
 *                 type: string
 *                 format: date
 *               kode_icd10:
 *                 type: string
 *               nama_penyakit:
 *                 type: string
 *               kecamatan_domisili:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kunjungan berhasil diperbarui
 *       409:
 *         description: Kunjungan tidak dapat diubah karena resep sudah dibuat
 *       404:
 *         description: Kunjungan tidak ditemukan
 *       401:
 *         description: Tidak terautentikasi
 */
router.put('/kunjungan/:id', updateKunjungan);

/**
 * @openapi
 * /api/tps/kunjungan/{id}:
 *   delete:
 *     tags: [TPS - Kunjungan]
 *     summary: Hapus data kunjungan pasien (sebelum resep dibuat)
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
 *         description: Kunjungan berhasil dihapus
 *       409:
 *         description: Kunjungan tidak dapat dihapus karena resep sudah dibuat
 *       404:
 *         description: Kunjungan tidak ditemukan
 *       401:
 *         description: Tidak terautentikasi
 */
router.delete('/kunjungan/:id', deleteKunjungan);

/**
 * @openapi
 * /api/tps/kunjungan/{id}/resep:
 *   post:
 *     tags: [TPS - Resep]
 *     summary: Buat resep untuk kunjungan pasien dan potong stok faskes
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID rekam medis kunjungan pasien
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     obat_id:
 *                       type: string
 *                       format: uuid
 *                       example: 551d8a79-126f-4295-af89-ad7884bd2a6c
 *                     formula_id:
 *                       type: string
 *                       format: uuid
 *                       example: b9b81b44-af7c-4353-ab74-29b84ad6b2f8
 *                     jumlah:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Resep berhasil dibuat dan stok terpotong
 *       400:
 *         description: Stok tidak cukup atau request tidak valid
 *       403:
 *         description: Akses ditolak (bukan apoteker atau admin)
 *       409:
 *         description: Kunjungan sudah memiliki resep
 *       401:
 *         description: Tidak terautentikasi
 */
router.post('/kunjungan/:id/resep', createResep);

export default router;
