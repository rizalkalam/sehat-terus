import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Pengguna, FasilitasKesehatan, Obat, Stok } from '../models';

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

// ── OBAT MANAGEMENT ───────────────────────────────────────────────────────────

export async function getObat(req: Request, res: Response) {
  try {
    const obat = await Obat.findAll({ order: [['nama', 'ASC']] });
    res.json({ success: true, data: obat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createObat(req: Request, res: Response) {
  try {
    const { nama, jenis, golongan, satuan, harga_beli, stok_minimum, kode_atc } = req.body;
    if (!nama || !jenis || !golongan || !satuan) {
      return res.status(400).json({ error: 'Nama, jenis, golongan, dan satuan wajib diisi.' });
    }
    const obat = await Obat.create({ nama, jenis, golongan, satuan, harga_beli, stok_minimum, kode_atc });
    res.status(201).json({ success: true, data: obat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateObat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const obat = await Obat.findByPk(id);
    if (!obat) return res.status(404).json({ error: 'Obat tidak ditemukan.' });
    await obat.update(req.body);
    res.json({ success: true, data: obat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteObat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const obat = await Obat.findByPk(id);
    if (!obat) return res.status(404).json({ error: 'Obat tidak ditemukan.' });
    await obat.destroy();
    res.json({ success: true, message: 'Obat dihapus.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── STOK MANAGEMENT ───────────────────────────────────────────────────────────

export async function getStokAdmin(req: Request, res: Response) {
  try {
    const stok = await Stok.findAll({
      include: [
        { model: Obat, as: 'obat', attributes: ['nama', 'satuan'] },
        { model: FasilitasKesehatan, as: 'faskes', attributes: ['nama'] },
      ],
      order: [['tanggal_kedaluwarsa', 'ASC']],
    });
    res.json({ success: true, data: stok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStok(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { jumlah_tersedia, tanggal_kedaluwarsa } = req.body;
    const stok = await Stok.findByPk(id);
    if (!stok) return res.status(404).json({ error: 'Stok tidak ditemukan.' });
    await stok.update({ jumlah_tersedia, tanggal_kedaluwarsa });
    res.json({ success: true, data: stok });
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