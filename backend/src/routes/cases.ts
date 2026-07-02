import { Router } from 'express';
import { getSpatialCases, getTemporalCases, getRegionDetail, getCasesSummary } from '../controllers/cases';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Cases
 *     description: Analisis kasus penyakit (MIS Dashboard)
 */

/**
 * @openapi
 * /api/cases/summary:
 *   get:
 *     tags: [Cases]
 *     summary: Ringkasan statistik kasus penyakit
 *     description: Mengembalikan jumlah total kasus, jumlah kecamatan aktif, perkiraan pasien aktif, serta 5 penyakit teratas dalam rentang waktu tertentu.
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas awal tanggal kunjungan (default 30 hari yang lalu, format YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas akhir tanggal kunjungan (default hari ini, format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Statistik kasus penyakit berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_kasus:
 *                   type: integer
 *                   example: 1250
 *                 active_kecamatan:
 *                   type: integer
 *                   example: 14
 *                 active_patients:
 *                   type: integer
 *                   example: 1250
 *                 periode_label:
 *                   type: string
 *                   example: 30 hari terakhir
 *                 top_diseases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kode_icd10:
 *                         type: string
 *                         example: J06.9
 *                       nama_penyakit:
 *                         type: string
 *                         example: Infeksi Saluran Pernafasan Akut (ISPA)
 *                       jumlah:
 *                         type: integer
 *                         example: 480
 *                       persen:
 *                         type: number
 *                         format: float
 *                         example: 38.4
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/summary', getCasesSummary);

router.get('/spatial', getSpatialCases);
router.get('/temporal', getTemporalCases);
router.get('/region/:name', getRegionDetail);

export default router;
