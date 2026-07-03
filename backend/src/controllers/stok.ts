import { Request, Response } from 'express';
import { Obat, FasilitasKesehatan, AlertEws, Stok, PergerakanStok, sequelize } from '../models';

const RETUR_ALASAN = ['near_expiry', 'slow_moving', 'rusak'];

/**
 * POST /api/stok/realokasi
 * Moves stock from one faskes to another (FEFO across source batches),
 * logged as a single `pergerakan_stok` row (tipe='realokasi') — the model
 * carries both faskes_asal and faskes_tujuan on one row, so unlike the
 * resep flow this doesn't need a separate keluar/masuk pair.
 */
export const createRealokasi = async (req: Request, res: Response): Promise<void> => {
  try {
    const { obat_id, faskes_asal_id, faskes_tujuan_id, jumlah, alert_id, catatan } = req.body ?? {};
    const dicatat_oleh = req.user!.id;

    if (!obat_id || !faskes_asal_id || !faskes_tujuan_id || !jumlah) {
      res.status(400).json({ error: 'Field obat_id, faskes_asal_id, faskes_tujuan_id, dan jumlah wajib diisi.' });
      return;
    }
    if (jumlah <= 0) {
      res.status(400).json({ error: 'Jumlah harus lebih dari 0.' });
      return;
    }
    if (faskes_asal_id === faskes_tujuan_id) {
      res.status(400).json({ error: 'Faskes asal dan faskes tujuan tidak boleh sama.' });
      return;
    }

    const obat = await Obat.findByPk(obat_id);
    if (!obat) {
      res.status(400).json({ error: `Obat dengan ID '${obat_id}' tidak ditemukan.` });
      return;
    }

    const [faskesAsal, faskesTujuan] = await Promise.all([
      FasilitasKesehatan.findByPk(faskes_asal_id),
      FasilitasKesehatan.findByPk(faskes_tujuan_id),
    ]);
    if (!faskesAsal) {
      res.status(400).json({ error: `Faskes asal dengan ID '${faskes_asal_id}' tidak ditemukan.` });
      return;
    }
    if (!faskesTujuan) {
      res.status(400).json({ error: `Faskes tujuan dengan ID '${faskes_tujuan_id}' tidak ditemukan.` });
      return;
    }

    if (alert_id) {
      const alert = await AlertEws.findByPk(alert_id);
      if (!alert) {
        res.status(400).json({ error: `Alert dengan ID '${alert_id}' tidak ditemukan.` });
        return;
      }
    }

    const totalStokAsal = (await Stok.sum('jumlah_tersedia', {
      where: { faskes_id: faskes_asal_id, obat_id },
    })) || 0;

    if (totalStokAsal < jumlah) {
      res.status(400).json({
        error: 'Stok tidak cukup',
        detail: [{ obat: obat.nama, diminta: jumlah, tersedia: totalStokAsal }],
      });
      return;
    }

    const pergerakan = await sequelize.transaction(async (t) => {
      // FEFO deduct at source, carrying each batch's expiry over to the destination
      const stokAsalRows = await Stok.findAll({
        where: { faskes_id: faskes_asal_id, obat_id },
        order: [
          ['tanggal_kedaluwarsa', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
      });

      let remaining = jumlah;
      for (const row of stokAsalRows) {
        if (remaining <= 0) break;
        const available = row.jumlah_tersedia;
        if (available <= 0) continue;

        const move = Math.min(available, remaining);
        row.jumlah_tersedia -= move;
        await row.save({ transaction: t });

        const [tujuanRow, created] = await Stok.findOrCreate({
          where: { faskes_id: faskes_tujuan_id, obat_id, batch: row.batch, tanggal_kedaluwarsa: row.tanggal_kedaluwarsa },
          defaults: { faskes_id: faskes_tujuan_id, obat_id, batch: row.batch, tanggal_kedaluwarsa: row.tanggal_kedaluwarsa, jumlah_tersedia: 0 },
          transaction: t,
        });
        if (!created) {
          tujuanRow.jumlah_tersedia += move;
          await tujuanRow.save({ transaction: t });
        } else {
          tujuanRow.jumlah_tersedia = move;
          await tujuanRow.save({ transaction: t });
        }

        remaining -= move;
      }

      return PergerakanStok.create(
        {
          obat_id,
          faskes_asal: faskes_asal_id,
          faskes_tujuan: faskes_tujuan_id,
          tipe: 'realokasi',
          jumlah,
          referensi: alert_id || catatan || null,
          dicatat_oleh,
        },
        { transaction: t }
      );
    });

    res.status(201).json({
      id: pergerakan.id,
      tipe: 'realokasi',
      obat_id,
      faskes_asal_id,
      faskes_tujuan_id,
      jumlah,
      tanggal: pergerakan.tanggal,
    });
  } catch (error: any) {
    console.error('Error in createRealokasi:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * POST /api/stok/retur
 * Removes stock from circulation (near-expiry disposal, slow-moving, or
 * damaged goods) and logs it as a negative `penyesuaian` movement.
 */
export const createRetur = async (req: Request, res: Response): Promise<void> => {
  try {
    const { obat_id, faskes_id, jumlah, alasan, catatan } = req.body ?? {};
    const dicatat_oleh = req.user!.id;

    if (!obat_id || !faskes_id || !jumlah || !alasan) {
      res.status(400).json({ error: 'Field obat_id, faskes_id, jumlah, dan alasan wajib diisi.' });
      return;
    }
    if (jumlah <= 0) {
      res.status(400).json({ error: 'Jumlah harus lebih dari 0.' });
      return;
    }
    if (!RETUR_ALASAN.includes(alasan)) {
      res.status(400).json({ error: `Alasan harus salah satu dari: ${RETUR_ALASAN.join(', ')}.` });
      return;
    }

    const obat = await Obat.findByPk(obat_id);
    if (!obat) {
      res.status(400).json({ error: `Obat dengan ID '${obat_id}' tidak ditemukan.` });
      return;
    }

    const faskes = await FasilitasKesehatan.findByPk(faskes_id);
    if (!faskes) {
      res.status(400).json({ error: `Faskes dengan ID '${faskes_id}' tidak ditemukan.` });
      return;
    }

    const totalStok = (await Stok.sum('jumlah_tersedia', { where: { faskes_id, obat_id } })) || 0;
    if (totalStok < jumlah) {
      res.status(400).json({
        error: 'Stok tidak cukup',
        detail: [{ obat: obat.nama, diminta: jumlah, tersedia: totalStok }],
      });
      return;
    }

    const pergerakan = await sequelize.transaction(async (t) => {
      const stokRows = await Stok.findAll({
        where: { faskes_id, obat_id },
        order: [
          ['tanggal_kedaluwarsa', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
      });

      let remaining = jumlah;
      for (const row of stokRows) {
        if (remaining <= 0) break;
        const available = row.jumlah_tersedia;
        if (available <= 0) continue;

        const deduct = Math.min(available, remaining);
        row.jumlah_tersedia -= deduct;
        await row.save({ transaction: t });
        remaining -= deduct;
      }

      return PergerakanStok.create(
        {
          obat_id,
          faskes_asal: faskes_id,
          faskes_tujuan: null,
          tipe: 'penyesuaian',
          jumlah: -jumlah,
          referensi: catatan || alasan,
          dicatat_oleh,
        },
        { transaction: t }
      );
    });

    res.status(201).json({
      id: pergerakan.id,
      tipe: 'penyesuaian',
      jumlah: pergerakan.jumlah,
      tanggal: pergerakan.tanggal,
    });
  } catch (error: any) {
    console.error('Error in createRetur:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
