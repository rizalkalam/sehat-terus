import { Request, Response } from 'express';
import { Pengguna } from '../models';

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { nama, telepon, alamat } = req.body ?? {};

  if (!nama || !String(nama).trim()) {
    res.status(400).json({ error: 'Nama wajib diisi.' });
    return;
  }

  try {
    const user = await Pengguna.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    user.nama = String(nama).trim();
    user.telepon = telepon ?? null;
    user.alamat = alamat ?? null;
    user.updated_at = new Date();
    await user.save();

    res.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      telepon: user.telepon,
      alamat: user.alamat,
      updated_at: user.updated_at,
    });
  } catch (err) {
    console.error('[pengguna/updateProfile]', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
