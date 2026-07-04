import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createRealokasi, createRetur } from '../controllers/stok';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Stok
 *     description: Manajemen stok — realokasi antar-cabang & retur/penyesuaian
 */

/**
 * @openapi
 * /api/stok/realokasi:
 *   post:
 *     tags: [Stok]
 *     summary: Pindahkan stok obat dari satu faskes ke faskes lain
 *     description: Memotong stok faskes asal (FEFO lintas batch) dan menambahkannya ke faskes tujuan dengan tanggal kedaluwarsa batch yang sama, lalu mencatat satu baris pergerakan_stok bertipe 'realokasi'.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [obat_id, faskes_asal_id, faskes_tujuan_id, jumlah]
 *             properties:
 *               obat_id:
 *                 type: string
 *                 format: uuid
 *               faskes_asal_id:
 *                 type: string
 *                 format: uuid
 *               faskes_tujuan_id:
 *                 type: string
 *                 format: uuid
 *               jumlah:
 *                 type: integer
 *                 example: 90
 *               alert_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Realokasi berhasil dicatat
 *       400:
 *         description: Request tidak valid atau stok tidak cukup
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Internal Server Error
 */
router.post('/realokasi', requireAuth, createRealokasi);

/**
 * @openapi
 * /api/stok/retur:
 *   post:
 *     tags: [Stok]
 *     summary: Tarik stok dari peredaran (near-expiry, slow-moving, atau rusak)
 *     description: Mengurangi stok faskes (FEFO lintas batch) dan mencatat pergerakan_stok bertipe 'penyesuaian' dengan jumlah negatif.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [obat_id, faskes_id, jumlah, alasan]
 *             properties:
 *               obat_id:
 *                 type: string
 *                 format: uuid
 *               faskes_id:
 *                 type: string
 *                 format: uuid
 *               jumlah:
 *                 type: integer
 *                 example: 120
 *               alasan:
 *                 type: string
 *                 enum: [near_expiry, slow_moving, rusak]
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Retur berhasil dicatat
 *       400:
 *         description: Request tidak valid atau stok tidak cukup
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Internal Server Error
 */
router.post('/retur', requireAuth, createRetur);

export default router;
