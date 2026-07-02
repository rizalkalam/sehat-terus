import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  RekamMedis,
  Wilayah,
  Resep,
  ResepItem,
  Obat,
  FormulaRacikan,
} from '../../models';

/**
 * POST /api/tps/kunjungan
 * Creates a new visit
 */
export const createKunjungan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tanggal_kunjungan, kode_icd10, nama_penyakit, kecamatan_domisili } = req.body;
    const faskes_id = req.user?.faskes_id;
    const dicatat_oleh = req.user?.id;

    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    if (!kode_icd10 || !nama_penyakit || !kecamatan_domisili) {
      res.status(400).json({ error: 'Field kode_icd10, nama_penyakit, dan kecamatan_domisili wajib diisi.' });
      return;
    }

    // Validate kecamatan
    const wilayah = await Wilayah.findOne({ where: { nama_kecamatan: kecamatan_domisili } });
    if (!wilayah) {
      res.status(400).json({
        error: `Kecamatan '${kecamatan_domisili}' tidak ditemukan. Pastikan nama kecamatan sesuai wilayah terdaftar.`,
      });
      return;
    }

    // Validate date (not in future)
    const visitDate = tanggal_kunjungan ? new Date(tanggal_kunjungan) : new Date();
    if (visitDate > new Date()) {
      res.status(400).json({ error: 'Tanggal kunjungan tidak boleh di masa depan.' });
      return;
    }

    const rekamMedis = await RekamMedis.create({
      tanggal_kunjungan: visitDate,
      kode_icd10,
      nama_penyakit,
      kecamatan_domisili,
      faskes_id,
      dicatat_oleh,
    });

    res.status(201).json(rekamMedis);
  } catch (error: any) {
    console.error('Error in createKunjungan:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/tps/kunjungan
 * Lists visits in user's faskes, default for today
 */
export const listKunjungan = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const { tanggal, kode_icd10, kecamatan, page = 1, limit = 20 } = req.query;

    const targetDate = tanggal ? new Date(tanggal as string) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const where: any = {
      faskes_id,
      tanggal_kunjungan: {
        [Op.between]: [start, end],
      },
    };

    if (kode_icd10) {
      where.kode_icd10 = kode_icd10;
    }
    if (kecamatan) {
      where.kecamatan_domisili = kecamatan;
    }

    const offset = (Number(page) - 1) * Number(limit);
    const maxLimit = Math.min(Number(limit), 100);

    const { rows, count } = await RekamMedis.findAndCountAll({
      where,
      limit: maxLimit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Resep,
          as: 'resep',
          attributes: ['id'],
        },
      ],
    });

    const data = rows.map((r: any) => ({
      id: r.id,
      tanggal_kunjungan: r.tanggal_kunjungan,
      kode_icd10: r.kode_icd10,
      nama_penyakit: r.nama_penyakit,
      kecamatan_domisili: r.kecamatan_domisili,
      ada_resep: r.resep && r.resep.length > 0,
      created_at: r.createdAt,
    }));

    const totalPages = Math.ceil(count / maxLimit);

    res.status(200).json({
      data,
      meta: {
        total: count,
        page: Number(page),
        limit: maxLimit,
        total_pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error in listKunjungan:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/tps/kunjungan/:id
 * Retrieve a specific visit with resep details
 */
export const getKunjunganById = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const visit = (await RekamMedis.findOne({
      where: { id: req.params.id, faskes_id },
      include: [
        {
          model: Resep,
          as: 'resep',
          include: [
            {
              model: ResepItem,
              as: 'items',
              include: [
                { model: Obat, as: 'obat' },
                { model: FormulaRacikan, as: 'formula' },
              ],
            },
          ],
        },
      ],
    })) as any;

    if (!visit) {
      res.status(404).json({ error: 'Kunjungan tidak ditemukan.' });
      return;
    }

    const resepHeader = visit.resep?.[0];
    const formattedItems = resepHeader?.items?.map((item: any) => {
      const isObat = !!item.obat_id;
      return {
        id: item.id,
        tipe: isObat ? 'obat' : 'racikan',
        obat_id: item.obat_id || null,
        formula_id: item.formula_id || null,
        nama: isObat ? item.obat?.nama : item.formula?.nama_racikan,
        satuan: isObat ? item.obat?.satuan : 'racikan',
        jumlah: item.jumlah,
      };
    }) || [];

    const resep = resepHeader
      ? {
          id: resepHeader.id,
          tanggal: resepHeader.tanggal,
          dibuat_oleh: resepHeader.dibuat_oleh,
          items: formattedItems,
        }
      : null;

    res.status(200).json({
      id: visit.id,
      tanggal_kunjungan: visit.tanggal_kunjungan,
      kode_icd10: visit.kode_icd10,
      nama_penyakit: visit.nama_penyakit,
      kecamatan_domisili: visit.kecamatan_domisili,
      faskes_id: visit.faskes_id,
      created_at: visit.createdAt,
      resep,
    });
  } catch (error: any) {
    console.error('Error in getKunjunganById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * PUT /api/tps/kunjungan/:id
 * Updates visit fields if no resep is attached
 */
export const updateKunjungan = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const visit = await RekamMedis.findOne({
      where: { id: req.params.id, faskes_id },
    });

    if (!visit) {
      res.status(404).json({ error: 'Kunjungan tidak ditemukan.' });
      return;
    }

    // Check if resep exists
    const hasResep = await Resep.findOne({ where: { rekam_medis_id: visit.id } });
    if (hasResep) {
      res.status(409).json({
        error: 'Kunjungan tidak dapat diubah karena resep sudah dibuat dan stok sudah dipotong.',
      });
      return;
    }

    const { kode_icd10, nama_penyakit, kecamatan_domisili, tanggal_kunjungan } = req.body;

    if (kecamatan_domisili) {
      const wilayah = await Wilayah.findOne({ where: { nama_kecamatan: kecamatan_domisili } });
      if (!wilayah) {
        res.status(400).json({
          error: `Kecamatan '${kecamatan_domisili}' tidak ditemukan. Pastikan nama kecamatan sesuai wilayah terdaftar.`,
        });
        return;
      }
      visit.kecamatan_domisili = kecamatan_domisili;
    }

    if (tanggal_kunjungan) {
      const visitDate = new Date(tanggal_kunjungan);
      if (visitDate > new Date()) {
        res.status(400).json({ error: 'Tanggal kunjungan tidak boleh di masa depan.' });
        return;
      }
      visit.tanggal_kunjungan = visitDate;
    }

    if (kode_icd10) visit.kode_icd10 = kode_icd10;
    if (nama_penyakit) visit.nama_penyakit = nama_penyakit;

    await visit.save();

    res.status(200).json(visit);
  } catch (error: any) {
    console.error('Error in updateKunjungan:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * DELETE /api/tps/kunjungan/:id
 * Deletes visit if no resep is attached
 */
export const deleteKunjungan = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const visit = await RekamMedis.findOne({
      where: { id: req.params.id, faskes_id },
    });

    if (!visit) {
      res.status(404).json({ error: 'Kunjungan tidak ditemukan.' });
      return;
    }

    // Check if resep exists
    const hasResep = await Resep.findOne({ where: { rekam_medis_id: visit.id } });
    if (hasResep) {
      res.status(409).json({
        error: 'Kunjungan tidak dapat dihapus karena resep sudah dibuat.',
      });
      return;
    }

    await visit.destroy();

    res.status(200).json({ message: 'Kunjungan berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error in deleteKunjungan:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
