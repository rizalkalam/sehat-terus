import { Router } from 'express';
import { login, logout, me } from '../controllers/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autentikasi pengguna
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login pengguna
 *     description: Memvalidasi email & password, lalu menyetel cookie `st_auth` (HttpOnly JWT) dan `st_user` (JSON readable).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: carmen@sehatterus.id
 *               password:
 *                 type: string
 *                 example: sehat123
 *     responses:
 *       200:
 *         description: Login berhasil — cookie `st_auth` dan `st_user` disetel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserPublic'
 *       400:
 *         description: Email atau password tidak dikirim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Kredensial salah atau akun nonaktif
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — hapus cookie sesi
 *     responses:
 *       200:
 *         description: Berhasil logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Berhasil keluar.
 */
router.post('/logout', logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Ambil data pengguna yang sedang login
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Tidak terautentikasi atau token kedaluwarsa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', requireAuth, me);

export default router;
