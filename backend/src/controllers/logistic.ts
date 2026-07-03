import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Stok, Obat, FasilitasKesehatan, PrediksiKebutuhan, SuratPesanan, SpItem } from '../models';

// GET /api/logistic/stok
export async function getStok(req: Request, res: Response) {
  try {
    const stok = await Stok.findAll({
      include: [
        { model: Obat, as: 'obat', attributes: ['id', 'nama', 'satuan', 'stok_minimum', 'harga_beli'] },
        { model: FasilitasKesehatan, as: 'faskes', attributes: ['id', 'nama'] },
      ],
      order: [['jumlah_tersedia', 'ASC']],
    });
    res.json({ success: true, data: stok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/stok/chart
export async function getStokChart(req: Request, res: Response) {
  try {
    const stok = await Stok.findAll({
      include: [{ model: Obat, as: 'obat', attributes: ['nama', 'satuan'] }],
      attributes: ['jumlah_tersedia', 'obat_id'],
    });

    const prediksi = await PrediksiKebutuhan.findAll({
      include: [{ model: Obat, as: 'obat', attributes: ['nama'] }],
    });

    // Group stok by obat nama
    const stokMap: Record<string, number> = {};
    for (const s of stok) {
      const nama = (s as any).obat?.nama || '';
      stokMap[nama] = (stokMap[nama] || 0) + s.jumlah_tersedia;
    }

    // Map prediksi
    const prediksiMap: Record<string, number> = {};
    for (const p of prediksi) {
      const nama = (p as any).obat?.nama || '';
      prediksiMap[nama] = (prediksiMap[nama] || 0) + p.jumlah_prediksi;
    }

    // Combine
    const chartData = Object.keys(stokMap).slice(0, 6).map(nama => ({
      drug: nama.split(' ')[0], // ambil nama pendek
      sisaStock: stokMap[nama] || 0,
      kebutuhan: prediksiMap[nama] || 0,
    }));

    res.json({ success: true, data: chartData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stok = await Stok.findAll({
      include: [{ model: Obat, as: 'obat', attributes: ['nama', 'stok_minimum', 'harga_beli'] }],
    });

    let deadStockModal = 0;
    let deadStockCount = 0;
    let stockoutRisiko = 0;
    let stockoutCount = 0;
    let shortestDays = Infinity;
    let shortestItem = '';
    let shortestFaskes = '';
    let criticalBranch = 0;

    for (const s of stok) {
      const obat = (s as any).obat;
      if (!obat) continue;

      const nilai = s.jumlah_tersedia * obat.harga_beli;

      // Dead stock: stok > 3x minimum
      if (s.jumlah_tersedia > obat.stok_minimum * 3) {
        deadStockModal += nilai;
        deadStockCount++;
      }

      // Stockout risk: stok < minimum
      if (s.jumlah_tersedia < obat.stok_minimum) {
        stockoutRisiko += nilai;
        stockoutCount++;
      }

      // Ketahanan stok (asumsi penggunaan 10/hari)
      const hariTahan = Math.floor(s.jumlah_tersedia / 10);
      if (hariTahan < shortestDays && hariTahan > 0) {
        shortestDays = hariTahan;
        shortestItem = obat.nama;
        shortestFaskes = 'Cabang Sleman';
      }
    }

    // Hitung cabang kritis
    const faskesList = await FasilitasKesehatan.findAll();
    for (const f of faskesList) {
      const stokFaskes = stok.filter(s => s.faskes_id === f.id);
      const ada = stokFaskes.some(s => {
        const obat = (s as any).obat;
        return obat && s.jumlah_tersedia < obat.stok_minimum;
      });
      if (ada) criticalBranch++;
    }

    res.json({
      success: true,
      data: {
        deadStock: { modal: deadStockModal, count: deadStockCount },
        stockout: { risiko: stockoutRisiko, count: stockoutCount },
        ketahanan: { hari: shortestDays === Infinity ? 0 : shortestDays, item: shortestItem, faskes: shortestFaskes },
        cabangBerisiko: { count: criticalBranch, total: faskesList.length },
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/near-expiry
export async function getNearExpiry(req: Request, res: Response) {
  try {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const stok = await Stok.findAll({
      where: {
        tanggal_kedaluwarsa: { [Op.lte]: threeMonthsLater },
      },
      include: [
        { model: Obat, as: 'obat', attributes: ['nama', 'satuan', 'harga_beli'] },
        { model: FasilitasKesehatan, as: 'faskes', attributes: ['nama'] },
      ],
      order: [['tanggal_kedaluwarsa', 'ASC']],
    });

    const data = stok.map(s => {
      const obat = (s as any).obat;
      const exp = new Date(s.tanggal_kedaluwarsa as unknown as string);
      const diffMs = exp.getTime() - Date.now();
      const diffBulan = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      const nilai = s.jumlah_tersedia * (obat?.harga_beli || 0);

      return {
        nama: obat?.nama || '',
        qty: `${s.jumlah_tersedia} ${obat?.satuan || ''}`,
        nilai: `Rp ${(nilai / 1000000).toFixed(1)} jt tertahan`,
        expired: `Expired ${diffBulan} bln lagi`,
      };
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/surat-pesanan
export async function getSuratPesanan(req: Request, res: Response) {
  try {
    const sp = await SuratPesanan.findAll({
      include: [
        { model: SpItem, as: 'items', include: [{ model: Obat, as: 'obat', attributes: ['nama', 'satuan'] }] },
        { association: 'pbf', attributes: ['nama'] },
        { association: 'faskes', attributes: ['nama'] },
      ],
    });
    res.json({ success: true, data: sp });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
