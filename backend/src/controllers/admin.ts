import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Pengguna, FasilitasKesehatan } from '../models';

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await Pengguna.findAll({
      attributes: ['id', 'nama', 'email', 'peran', 'faskes_id', 'aktif', 'nomor_sipa'],
      include: [{ association: 'faskes', attributes: ['nama'] }],
      order: [['nama', 'ASC']],
    });
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { nama, email, password, peran, faskes_id, nomor_sipa } = req.body;
    if (!nama || !email || !password || !peran) {
      return res.status(400).json({ error: 'Nama, email, password, dan peran wajib diisi.' });
    }
    const existing = await Pengguna.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar.' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await Pengguna.create({
      nama, email, password_hash, peran,
      faskes_id: faskes_id || null,
      nomor_sipa: nomor_sipa || null,
      aktif: true,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nama, email, peran, faskes_id, nomor_sipa, aktif, password } = req.body;
    const user = await Pengguna.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

    const updates: Record<string, unknown> = { nama, email, peran, faskes_id, nomor_sipa, aktif };
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    await user.update(updates);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await Pengguna.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    await user.update({ aktif: false }); // soft delete
    res.json({ success: true, message: 'Pengguna dinonaktifkan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── FASKES ────────────────────────────────────────────────────────────────────

export async function getFaskes(req: Request, res: Response) {
  try {
    const faskes = await FasilitasKesehatan.findAll({ order: [['nama', 'ASC']] });
    res.json({ success: true, data: faskes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
