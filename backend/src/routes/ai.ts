import { Router } from 'express';
import { analyzeDiseaseData, predictDrugNeeds } from '../controllers/ai';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: AI
 *     description: Analisis situasi penyakit berbasis LLM (Groq)
 */

/**
 * @openapi
 * /api/ai/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Analisis ringkasan situasi penyakit via LLM
 *     description: Mengirim data kasus penyakit ke Groq (llama-3.1-8b-instant) dan mengembalikan ringkasan, status peringatan, serta rekomendasi dalam Bahasa Indonesia. Butuh env var `GROQ_API_KEY`.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: object
 *                 description: Data kasus penyakit (bebas bentuk — akan disertakan langsung ke prompt)
 *     responses:
 *       200:
 *         description: Analisis berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                     highestDisease:
 *                       type: string
 *                     alertStatus:
 *                       type: string
 *                       enum: [Normal, Waspada, Bahaya]
 *                     warningAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     details:
 *                       type: string
 *       400:
 *         description: Body `data` tidak dikirim
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Gagal menganalisis (Groq error atau respons tidak valid)
 */
router.post('/analyze', requireAuth, analyzeDiseaseData);

/**
 * @openapi
 * /api/ai/predict-drugs:
 *   get:
 *     tags: [AI]
 *     summary: Prediksi kebutuhan obat via LLM (FA7, admin panel)
 *     description: >
 *       Angka (usulan_pesanan, ketahanan_hari, nilai_modal_rp, dst.) dihitung deterministik oleh
 *       logika F25 (defekta)/F28 (slow-moving) di logistic.ts — Groq (llama-3.1-8b-instant) HANYA
 *       menulis ringkasan naratif & rekomendasi berbahasa Indonesia dari angka itu, tidak diminta
 *       mengarang angka sendiri. Butuh env var `GROQ_API_KEY`. Khusus admin.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: faskes_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ke satu faskes. Kosongkan untuk semua faskes.
 *     responses:
 *       200:
 *         description: Prediksi berhasil (atau data kosong kalau tidak ada obat defekta/slow-moving)
 *       403:
 *         description: Bukan admin
 *       500:
 *         description: GROQ_API_KEY belum dikonfigurasi, atau gagal memanggil/parsing respons Groq
 */
router.get('/predict-drugs', requireAuth, requireAdmin, predictDrugNeeds);

export default router;
