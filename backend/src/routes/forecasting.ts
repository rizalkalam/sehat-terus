import { Router } from 'express';
import { getProjection, getForecastingStats, getForecastingAlerts } from '../controllers/forecasting';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Forecasting
 *     description: Proyeksi kasus penyakit (double exponential smoothing / Holt's linear trend)
 */

/**
 * @openapi
 * /api/forecasting/projection:
 *   get:
 *     tags: [Forecasting]
 *     summary: Historis + proyeksi kasus mingguan per penyakit (F21)
 *     description: >
 *       Dihitung on-the-fly dari RekamMedis (bukan dari tabel prediksi_kebutuhan — tabel itu
 *       untuk kebutuhan obat per faskes, bukan proyeksi kasus per penyakit; tidak ada tabel
 *       penyakit→proyeksi di skema). Granularitas mingguan (bukan bulanan) supaya cocok dengan
 *       horizon 14-30 hari di REQUIREMENTS.md ANL-01. Algoritma: Holt's linear trend method,
 *       alpha/beta di-fit per penyakit lewat grid search (minimasi SSE), bukan konstanta tetap.
 *     parameters:
 *       - in: query
 *         name: diseases
 *         schema:
 *           type: string
 *           default: J06.9,A90
 *         description: Kode ICD-10 dipisah koma
 *       - in: query
 *         name: months_back
 *         schema:
 *           type: integer
 *           default: 6
 *       - in: query
 *         name: days_ahead
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Array historis + proyeksi (melt format)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tanggal:
 *                     type: string
 *                     example: "2026-06-01"
 *                   nama_penyakit:
 *                     type: string
 *                   kode_icd10:
 *                     type: string
 *                   kasus_aktual:
 *                     type: integer
 *                     nullable: true
 *                   kasus_prediksi:
 *                     type: integer
 *                     nullable: true
 *                   tipe:
 *                     type: string
 *                     enum: [historis, proyeksi]
 *       500:
 *         description: Internal Server Error
 */
router.get('/projection', getProjection);

/**
 * @openapi
 * /api/forecasting/stats:
 *   get:
 *     tags: [Forecasting]
 *     summary: Statistik ringkas untuk 3 stat card di /proyeksi-tren (F22)
 *     description: >
 *       Dihitung dari proyeksi minggu depan (Holt's linear trend) untuk setiap penyakit yang
 *       punya riwayat kasus. penurunan_terbesar bernilai null kalau tidak ada penyakit dengan
 *       tren menurun pada saat itu — tidak dipaksakan.
 *     responses:
 *       200:
 *         description: Statistik proyeksi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 peningkatan_tertinggi:
 *                   type: object
 *                   nullable: true
 *                 penurunan_terbesar:
 *                   type: object
 *                   nullable: true
 *                 total_kasus_proyeksi:
 *                   type: integer
 *       500:
 *         description: Internal Server Error
 */
router.get('/stats', getForecastingStats);

/**
 * @openapi
 * /api/forecasting/alerts:
 *   get:
 *     tags: [Forecasting]
 *     summary: Kartu rekomendasi untuk penyakit dengan tren naik (F23)
 *     description: >
 *       Maksimal 3 penyakit dengan persen_change positif tertinggi. rekomendasi_obat diambil dari
 *       riwayat resep_item nyata untuk penyakit itu (fallback ke alert_ews.obat_terdampak_id kalau
 *       riwayat resep kosong); array kosong kalau tidak ada sumber data nyata sama sekali —
 *       tidak ada pemetaan penyakit→obat yang difabrikasi.
 *     responses:
 *       200:
 *         description: Daftar kartu rekomendasi (bisa kurang dari 3 kalau tidak ada penyakit bertren naik)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   jenis_penyakit:
 *                     type: string
 *                   kode_icd10:
 *                     type: string
 *                   urgensi:
 *                     type: string
 *                     enum: [tinggi, sedang, rendah]
 *                   persen_change:
 *                     type: number
 *                   deskripsi:
 *                     type: string
 *                   rekomendasi_obat:
 *                     type: array
 *                     items:
 *                       type: string
 *                   rekomendasi_tindakan:
 *                     type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/alerts', getForecastingAlerts);

export default router;
