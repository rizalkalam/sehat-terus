import { Router } from 'express';
import { getAlerts, getAlertById, getAlertsStats, getAlertsSummary, updateAlertStatus, detectAnomalies } from '../controllers/alerts';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Alerts
 *     description: Early Warning System — deteksi lonjakan kasus & risiko stok kritis
 */

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Daftar alert EWS
 *     description: Mengembalikan daftar alert dari tabel alert_ews, default hanya yang berstatus aktif. `level` (kritis/waspada) dihitung dari persen_lonjakan dan ketahanan_stok_jam.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktif, ditangani, selesai]
 *           default: aktif
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Daftar alert berhasil diambil
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
 *                   kecamatan:
 *                     type: string
 *                     example: Depok
 *                   jenis_penyakit:
 *                     type: string
 *                     example: Diare & Gastroenteritis
 *                   kode_icd10:
 *                     type: string
 *                     example: A09
 *                   persen_lonjakan:
 *                     type: number
 *                     example: 187.5
 *                   laju_harian:
 *                     type: number
 *                     nullable: true
 *                   jumlah_kasus:
 *                     type: integer
 *                   status:
 *                     type: string
 *                     example: aktif
 *                   level:
 *                     type: string
 *                     enum: [kritis, waspada]
 *                   ketahanan_stok_jam:
 *                     type: integer
 *                     nullable: true
 *                   terdeteksi_pada:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal Server Error
 */
router.get('/', getAlerts);

/**
 * @openapi
 * /api/alerts/stats:
 *   get:
 *     tags: [Alerts]
 *     summary: Statistik ringkas untuk 3 stat card di /peringatan-dini
 *     parameters:
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Statistik alert berhasil diambil
 *       500:
 *         description: Internal Server Error
 */
router.get('/stats', getAlertsStats);

/**
 * @openapi
 * /api/alerts/summary:
 *   get:
 *     tags: [Alerts]
 *     summary: Ringkasan teks situasi (untuk AiBanner)
 *     description: Template string berdasarkan agregasi alert_ews aktif (bukan LLM).
 *     parameters:
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ringkasan situasi berhasil diambil
 *       500:
 *         description: Internal Server Error
 */
router.get('/summary', getAlertsSummary);

/**
 * @openapi
 * /api/alerts/detect:
 *   post:
 *     tags: [Alerts]
 *     summary: Jalankan Z-score anomaly detection (F12)
 *     description: >
 *       Membandingkan jumlah kasus 7 hari terakhir vs baseline 28 hari sebelumnya per
 *       (kecamatan, kode_icd10). Anomali = z-score >= 2 DAN total kasus 7 hari terakhir >= 5
 *       (batas absolut untuk cegah false alarm pada angka kecil, sesuai REQUIREMENTS.md ANL-02).
 *       Alert aktif yang cocok akan diperbarui, kalau belum ada akan dibuat baru berstatus 'aktif'.
 *       Tidak mengisi obat_terdampak_id/ketahanan_stok_jam (tidak ada pemetaan penyakit→obat di
 *       skema) dan tidak otomatis menyelesaikan alert yang sudah tidak anomali lagi.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Hasil scan anomali
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checked_at:
 *                   type: string
 *                   format: date-time
 *                 kombinasi_dianalisis:
 *                   type: integer
 *                   example: 45
 *                 anomali_terdeteksi:
 *                   type: integer
 *                   example: 3
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       kecamatan:
 *                         type: string
 *                       jenis_penyakit:
 *                         type: string
 *                       kode_icd10:
 *                         type: string
 *                       persen_lonjakan:
 *                         type: number
 *                       z_score:
 *                         type: number
 *                         nullable: true
 *                       jumlah_kasus:
 *                         type: integer
 *                       aksi:
 *                         type: string
 *                         enum: [baru, diperbarui]
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Internal Server Error
 */
router.post('/detect', requireAuth, detectAnomalies);

/**
 * @openapi
 * /api/alerts/{id}:
 *   get:
 *     tags: [Alerts]
 *     summary: Detail satu alert untuk modal /peringatan-dini
 *     description: Termasuk estimasi puncak (heuristik dari laju_harian) dan obat kritis terkait beserta sisa stoknya. Catatan " wilayah_detail" (daftar kelurahan) tidak tersedia — skema `wilayah` hanya menyimpan granularitas kecamatan.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detail alert berhasil diambil
 *       404:
 *         description: Alert tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', getAlertById);

/**
 * @openapi
 * /api/alerts/{id}:
 *   patch:
 *     tags: [Alerts]
 *     summary: Tandai alert sebagai "ditangani" atau "selesai"
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ditangani, selesai]
 *     responses:
 *       200:
 *         description: Status alert berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: ditangani
 *                 ditangani_pada:
 *                   type: string
 *                   format: date-time
 *                 ditangani_oleh:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Status tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Alert tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.patch('/:id', requireAuth, updateAlertStatus);

export default router;
