import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pengguna } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'st-jwt-secret-2026';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    return;
  }

  try {
    const user = await Pengguna.findOne({ where: { email, aktif: true } });
    if (!user) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }

    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }

    const payload = { id: user.id, email: user.email, peran: user.peran, faskes_id: user.faskes_id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // HttpOnly — dibaca middleware Next.js dan backend; tidak bisa diakses JS browser
    res.cookie('st_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    // Readable — dibaca getUserFromCookie() di frontend untuk tampilkan nama/avatar.
    // Tidak perlu pre-encode: Express sudah memanggil encodeURIComponent secara default.
    const userInfo = { email: user.email, name: user.nama, displayName: user.nama };
    res.cookie('st_user', JSON.stringify(userInfo), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        peran: user.peran,
        faskes_id: user.faskes_id,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('st_auth', { path: '/' });
  res.clearCookie('st_user', { path: '/' });
  res.json({ message: 'Berhasil keluar.' });
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await Pengguna.findByPk(req.user!.id, {
      attributes: ['id', 'nama', 'email', 'peran', 'faskes_id', 'aktif'],
    });
    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
