import { Router } from 'express';
import { getStok, getStokChart, getStats, getNearExpiry, getDefekta, getSlowMoving, getSuratPesanan, createSuratPesanan } from '../controllers/logistic';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Logistik
 *     description: Ringkasan stok, dead-stock/stockout stats, near-expiry, dan surat pesanan lintas faskes
 */

/**
 * @openapi
 * /api/logistic/stok:
 *   get:
 *     tags: [Logistik]
 *     summary: Daftar semua stok (diurutkan dari jumlah tersedia paling sedikit)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar stok per obat & faskes
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/stok', requireAuth, getStok);

/**
 * @openapi
 * /api/logistic/stok/chart:
 *   get:
 *     tags: [Logistik]
 *     summary: Data chart sisa stok vs kebutuhan — mode bar (top obat) atau line (tren bulanan per obat+faskes)
 *     description: >
 *       `kebutuhan` (mode=bar) dan `kebutuhan_prediksi` (mode=line) dihitung dari rata-rata
 *       pemakaian nyata (pergerakan_stok tipe 'keluar' 30 hari terakhir) dikali 30 — bukan dari
 *       prediksi_kebutuhan (tabel itu untuk kebutuhan per faskes hasil forecasting obat, beda
 *       konsep, lihat DECISIONS.md ADR-012).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [bar, line]
 *           default: bar
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wajib untuk mode=line
 *       - in: query
 *         name: obat_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wajib untuk mode=line
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Top N obat untuk mode=bar
 *     responses:
 *       200:
 *         description: Data chart
 *       400:
 *         description: faskes_id/obat_id tidak diisi untuk mode=line
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/stok/chart', requireAuth, getStokChart);

/**
 * @openapi
 * /api/logistic/stats:
 *   get:
 *     tags: [Logistik]
 *     summary: Stat cards logistik — dead-stock, stockout risk, ketahanan, cabang berisiko
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ringkasan statistik logistik
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/stats', requireAuth, getStats);

/**
 * @openapi
 * /api/logistic/near-expiry:
 *   get:
 *     tags: [Logistik]
 *     summary: Daftar obat mendekati kedaluwarsa (≤ 3 bulan)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar stok near-expiry
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/near-expiry', requireAuth, getNearExpiry);

/**
 * @openapi
 * /api/logistic/surat-pesanan:
 *   get:
 *     tags: [Logistik]
 *     summary: Daftar surat pesanan (SP) beserta item & PBF tujuan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar surat pesanan
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/surat-pesanan', requireAuth, getSuratPesanan);

/**
 * @openapi
 * /api/logistic/defekta:
 *   get:
 *     tags: [Logistik]
 *     summary: Obat di bawah stok minimum, dikelompokkan per PBF (untuk Buat Pesanan)
 *     description: >
 *       Dikelompokkan lewat obat.pbf_id — kolom ini ditambahkan khusus untuk fitur ini (skema
 *       aslinya tidak punya pemasok tetap per obat), lihat DECISIONS.md ADR-012.
 *       tren_harian dari pergerakan_stok nyata 30 hari terakhir, bukan asumsi.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Daftar grup defekta per PBF
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/defekta', requireAuth, getDefekta);

/**
 * @openapi
 * /api/logistic/slow-moving:
 *   get:
 *     tags: [Logistik]
 *     summary: Obat yang tidak bergerak dalam N hari terakhir (kandidat retur/realokasi)
 *     description: >
 *       saran='realokasi' kalau ada faskes lain yang benar-benar kekurangan obat yang sama
 *       (perbandingan lintas-faskes nyata, bukan tebakan), else 'retur'.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daftar obat slow-moving
 *       401:
 *         description: Tidak terautentikasi
 */
router.get('/slow-moving', requireAuth, getSlowMoving);

/**
 * @openapi
 * /api/logistic/surat-pesanan:
 *   post:
 *     tags: [Logistik]
 *     summary: Buat Surat Pesanan baru (draf) ke satu PBF
 *     description: >
 *       tipe='npp' hanya boleh dibuat oleh pengguna dengan nomor_sipa (apoteker), dan semua item
 *       harus obat golongan npp (400 kalau campur). harga_satuan di response dihitung dari
 *       obat.harga_beli saat ini — sp_item tidak menyimpan harga sendiri (skema tidak punya
 *       kolom itu), jadi nilai di input diabaikan.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faskes_id, pbf_id, tipe, items]
 *             properties:
 *               faskes_id:
 *                 type: string
 *                 format: uuid
 *               pbf_id:
 *                 type: string
 *                 format: uuid
 *               tipe:
 *                 type: string
 *                 enum: [reguler, npp]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [obat_id, jumlah_usulan]
 *                   properties:
 *                     obat_id:
 *                       type: string
 *                       format: uuid
 *                     jumlah_usulan:
 *                       type: integer
 *     responses:
 *       201:
 *         description: SP berhasil dibuat (status draf)
 *       400:
 *         description: Request tidak valid, obat tidak ditemukan, atau golongan obat tidak cocok dengan tipe SP
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Bukan apoteker, tidak boleh membuat SP npp
 *       500:
 *         description: Internal Server Error
 */
router.post('/surat-pesanan', requireAuth, createSuratPesanan);

export default router;
