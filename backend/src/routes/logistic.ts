import { Router } from 'express';
import { getStok, getStokChart, getStats, getNearExpiry, getSuratPesanan } from '../controllers/logistic';
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
 *     summary: Data chart sisa stok vs kebutuhan (6 obat teratas)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data chart per obat — sisaStock vs kebutuhan
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

export default router;
