import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Pengguna, FasilitasKesehatan, Obat, Pbf, Stok, PergerakanStok, ResepItem, SpItem, PrediksiKebutuhan, FormulaKomponen } from '../models';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function validatePbfId(pbf_id: string): Promise<string | null> {
  if (!UUID_RE.test(pbf_id)) return `pbf_id '${pbf_id}' bukan UUID yang valid.`;
  const pbf = await Pbf.findByPk(pbf_id);
  if (!pbf) return `PBF dengan ID '${pbf_id}' tidak ditemukan.`;
  return null;
}

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

    const updates: Record<string, unknown> = {
      nama, email, peran, aktif,
      faskes_id: faskes_id || null,
      nomor_sipa: nomor_sipa || null,
    };
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
    const obat = await Obat.findAll({
      include: [{ association: 'pbf', attributes: ['nama'] }],
      order: [['nama', 'ASC']],
    });
    res.json({ success: true, data: obat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createObat(req: Request, res: Response) {
  try {
    const { nama, jenis, golongan, satuan, harga_beli, stok_minimum, kode_atc, pbf_id } = req.body;
    if (!nama || !jenis || !golongan || !satuan) {
      return res.status(400).json({ error: 'Nama, jenis, golongan, dan satuan wajib diisi.' });
    }
    if (pbf_id) {
      const err = await validatePbfId(pbf_id);
      if (err) return res.status(400).json({ error: err });
    }
    const obat = await Obat.create({
      nama, jenis, golongan, satuan,
      harga_beli: harga_beli ?? 0,
      stok_minimum: stok_minimum ?? 0,
      kode_atc: kode_atc || null,
      pbf_id: pbf_id || null,
    });
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
    const { nama, jenis, golongan, satuan, harga_beli, stok_minimum, kode_atc, pbf_id } = req.body;
    if (pbf_id) {
      const err = await validatePbfId(pbf_id);
      if (err) return res.status(400).json({ error: err });
    }
    await obat.update({ nama, jenis, golongan, satuan, harga_beli, stok_minimum, kode_atc, pbf_id });
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

    // Obat cuma master data referensi — FK ke tabel transaksi di bawah ini default
    // ON DELETE CASCADE (Sequelize, karena kolomnya NOT NULL), jadi destroy() akan
    // diam-diam menghapus riwayat stok/resep/pengadaan kalau tidak dicegah di sini.
    const [stokCount, pergerakanCount, resepItemCount, spItemCount, prediksiCount, formulaKomponenCount] = await Promise.all([
      Stok.count({ where: { obat_id: id } }),
      PergerakanStok.count({ where: { obat_id: id } }),
      ResepItem.count({ where: { obat_id: id } }),
      SpItem.count({ where: { obat_id: id } }),
      PrediksiKebutuhan.count({ where: { obat_id: id } }),
      FormulaKomponen.count({ where: { obat_id: id } }),
    ]);
    if (stokCount + pergerakanCount + resepItemCount + spItemCount + prediksiCount + formulaKomponenCount > 0) {
      return res.status(409).json({ error: 'Obat tidak bisa dihapus karena masih punya data terkait (stok, resep, pengadaan, atau riwayat transaksi).' });
    }

    await obat.destroy();
    res.json({ success: true, message: 'Obat dihapus.' });
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

// ── PBF ───────────────────────────────────────────────────────────────────────

export async function getPbf(req: Request, res: Response) {
  try {
    const pbf = await Pbf.findAll({ order: [['nama', 'ASC']] });
    res.json({ success: true, data: pbf });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
