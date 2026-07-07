import { Router } from 'express';
import { updateProfile } from '../controllers/pengguna';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Pengguna
 *     description: Profil pengguna yang sedang login
 */

/**
 * @openapi
 * /api/pengguna/profile:
 *   put:
 *     tags: [Pengguna]
 *     summary: Perbarui profil pengguna sendiri
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama]
 *             properties:
 *               nama:
 *                 type: string
 *               telepon:
 *                 type: string
 *                 nullable: true
 *               alamat:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nama:
 *                   type: string
 *                 email:
 *                   type: string
 *                 telepon:
 *                   type: string
 *                   nullable: true
 *                 alamat:
 *                   type: string
 *                   nullable: true
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Nama tidak diisi
 *       401:
 *         description: Tidak terautentikasi
 */
router.put('/profile', requireAuth, updateProfile);

export default router;
