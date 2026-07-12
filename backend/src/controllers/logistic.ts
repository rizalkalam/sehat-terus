import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Stok, Obat, FasilitasKesehatan, SuratPesanan, SpItem, PergerakanStok, Pbf, Pengguna, Wilayah } from '../models';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AKTIF_SP_STATUS = ['disetujui', 'dikirim', 'diterima'];

// Rata-rata jumlah 'keluar' per hari, 30 hari terakhir. Key opsional per faskes (`obatId::faskesId`)
// atau global per obat (`obatId::_`) kalau faskes_id tidak diberikan.
async function getTrenHarianMap(faskesId?: string): Promise<Record<string, number>> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const where: any = { tipe: 'keluar', tanggal: { [Op.gte]: since } };
  if (faskesId) where.faskes_asal = faskesId;

  const rows = (await PergerakanStok.findAll({
    attributes: ['obat_id', 'faskes_asal', [sequelize.fn('SUM', sequelize.col('jumlah')), 'total']],
    where,
    group: ['obat_id', 'faskes_asal'],
    raw: true,
  })) as any[];

  const map: Record<string, number> = {};
  for (const r of rows) {
    const key = faskesId ? r.obat_id : `${r.obat_id}::_`;
    map[key] = (map[key] || 0) + parseInt(r.total, 10) / 30;
  }
  return map;
}

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

// GET /api/logistic/stok/chart?mode=bar|line&faskes_id=&obat_id=&months=7&limit=5
export async function getStokChart(req: Request, res: Response) {
  try {
    const mode = (req.query.mode as string) === 'line' ? 'line' : 'bar';

    if (mode === 'line') {
      const faskesId = req.query.faskes_id as string;
      const obatId = req.query.obat_id as string;
      const months = req.query.months ? parseInt(req.query.months as string, 10) : 7;
      if (!faskesId || !obatId) {
        res.status(400).json({ error: 'faskes_id dan obat_id wajib diisi untuk mode=line.' });
        return;
      }

      const currentStock = (await Stok.sum('jumlah_tersedia', { where: { obat_id: obatId, faskes_id: faskesId } })) || 0;

      const monthsAgoStart = new Date();
      monthsAgoStart.setMonth(monthsAgoStart.getMonth() - months);
      const keluarRows = (await PergerakanStok.findAll({
        where: { obat_id: obatId, faskes_asal: faskesId, tipe: 'keluar', tanggal: { [Op.gte]: monthsAgoStart } },
        attributes: ['jumlah', 'tanggal'],
        raw: true,
      })) as any[];

      const now = new Date();
      const points: { bulan: string; jumlah_tersedia: number; kebutuhan_prediksi: number }[] = [];
      let runningStock = currentStock;

      for (let m = 0; m < months; m++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        const keluarThisMonth = keluarRows
          .filter((r) => { const d = new Date(r.tanggal); return d >= monthDate && d < monthEnd; })
          .reduce((sum, r) => sum + r.jumlah, 0);

        points.unshift({
          bulan: MONTH_LABELS[monthDate.getMonth()],
          jumlah_tersedia: Math.max(0, Math.round(runningStock)),
          kebutuhan_prediksi: keluarThisMonth,
        });

        runningStock += keluarThisMonth; // mundur satu bulan: stok sebelumnya lebih tinggi sejumlah yang keluar bulan ini
      }

      res.json({ success: true, data: points });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const stok = await Stok.findAll({
      include: [{ model: Obat, as: 'obat', attributes: ['id', 'nama', 'satuan', 'stok_minimum'] }],
      attributes: ['jumlah_tersedia', 'obat_id'],
    });

    const trenMap = await getTrenHarianMap();

    const stokMap: Record<string, { nama: string; jumlah: number; obatId: string }> = {};
    for (const s of stok) {
      const obat = (s as any).obat;
      if (!obat) continue;
      const key = obat.id;
      if (!stokMap[key]) stokMap[key] = { nama: obat.nama, jumlah: 0, obatId: obat.id };
      stokMap[key].jumlah += s.jumlah_tersedia;
    }

    const chartData = Object.values(stokMap)
      .slice(0, limit)
      .map((entry) => {
        const trenHarian = trenMap[`${entry.obatId}::_`] || 0;
        return {
          drug: entry.nama.split(' ')[0],
          sisaStock: entry.jumlah,
          kebutuhan: Math.round(trenHarian * 30),
        };
      });

    res.json({ success: true, data: chartData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stok = await Stok.findAll({
      include: [{ model: Obat, as: 'obat', attributes: ['id', 'nama', 'stok_minimum', 'harga_beli'] }],
    });

    const trenMap = await getTrenHarianMap();

    let deadStockModal = 0;
    let deadStockCount = 0;
    let stockoutRisiko = 0;
    let stockoutCount = 0;
    let shortestDays = Infinity;
    let shortestItem = '';
    let shortestFaskesId = '';
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

      // Ketahanan stok — pakai rata-rata pemakaian nyata (pergerakan_stok 'keluar' 30 hari
      // terakhir), bukan asumsi tetap "/10" seperti sebelumnya.
      const trenHarian = trenMap[`${obat.id}::_`] || 0;
      if (trenHarian > 0) {
        const hariTahan = Math.floor(s.jumlah_tersedia / trenHarian);
        if (hariTahan < shortestDays) {
          shortestDays = hariTahan;
          shortestItem = obat.nama;
          shortestFaskesId = s.faskes_id;
        }
      }
    }

    const faskesList = await FasilitasKesehatan.findAll();
    const shortestFaskes = faskesList.find((f) => f.id === shortestFaskesId);

    for (const f of faskesList) {
      const stokFaskes = stok.filter((s) => s.faskes_id === f.id);
      const ada = stokFaskes.some((s) => {
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
        ketahanan: { hari: shortestDays === Infinity ? 0 : shortestDays, item: shortestItem, faskes: shortestFaskes?.nama || '' },
        cabangBerisiko: { count: criticalBranch, total: faskesList.length },
      },
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

// Logika inti F25 (defekta) — dipakai handler HTTP di bawah maupun predictDrugNeeds (FA7, ai.ts)
// supaya keduanya pakai satu sumber angka yang sama, bukan menghitung ulang secara terpisah.
export async function computeDefekta(faskesId?: string) {
  const stokWhere: any = {};
  if (faskesId) stokWhere.faskes_id = faskesId;

  const stok = await Stok.findAll({
    where: stokWhere,
    include: [{ model: Obat, as: 'obat', include: [{ model: Pbf, as: 'pbf' }] }],
  });

  const trenMap = await getTrenHarianMap(faskesId);

  const perObat: Record<string, { obat: any; total: number }> = {};
  for (const s of stok) {
    const obat = (s as any).obat;
    if (!obat) continue;
    if (!perObat[obat.id]) perObat[obat.id] = { obat, total: 0 };
    perObat[obat.id].total += s.jumlah_tersedia;
  }

  const defektaObat = Object.values(perObat).filter((e) => e.total < e.obat.stok_minimum);

  // Cek SP aktif per (PBF, jenis), supaya UI bisa kunci grup yang sedang berjalan.
  const activeSpWhere: any = { status: { [Op.in]: AKTIF_SP_STATUS } };
  if (faskesId) activeSpWhere.faskes_id = faskesId;
  const activeSp = await SuratPesanan.findAll({ where: activeSpWhere, attributes: ['pbf_id', 'jenis'], raw: true });
  const lockedKeys = new Set(activeSp.map((sp: any) => `${sp.pbf_id}::${sp.jenis}`));

  const groups: Record<string, { pbf: any; tipe: 'reguler' | 'npp'; locked: boolean; items: any[] }> = {};
  for (const { obat, total } of defektaObat) {
    const pbf = obat.pbf;
    // Item npp WAJIB di SP terpisah (satu PBF bisa memasok reguler & npp sekaligus) —
    // grup dipisah per (pbf, tipe), bukan cuma per pbf, supaya "Buat Pesanan" per grup
    // selalu valid dikirim sebagai satu SP.
    const tipe: 'reguler' | 'npp' = obat.golongan === 'npp' ? 'npp' : 'reguler';
    const groupKey = `${pbf?.id || 'tanpa-pbf'}::${tipe}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        pbf: pbf ? { id: pbf.id, nama: pbf.nama } : { id: null, nama: 'Belum ada PBF' },
        tipe,
        locked: pbf ? lockedKeys.has(`${pbf.id}::${tipe}`) : false,
        items: [],
      };
    }

    const trenHarian = (faskesId ? trenMap[obat.id] : trenMap[`${obat.id}::_`]) || 0;
    const kebutuhan30Hari = Math.round(trenHarian * 30);
    const kekurangan = Math.max(0, obat.stok_minimum - total);
    const usulan = Math.max(kekurangan, kebutuhan30Hari - total);

    groups[groupKey].items.push({
      obat_id: obat.id,
      nama: obat.nama,
      jenis: obat.jenis,
      satuan: obat.satuan,
      ketahanan_hari: trenHarian > 0 ? Math.floor(total / trenHarian) : null,
      tren_harian: Math.round(trenHarian * 10) / 10,
      jumlah_tersedia: total,
      stok_minimum: obat.stok_minimum,
      jumlah_kekurangan: kekurangan,
      usulan_pesanan: usulan,
      harga_satuan: Number(obat.harga_beli),
    });
  }

  return Object.values(groups);
}

// GET /api/logistic/defekta?faskes_id=
export async function getDefekta(req: Request, res: Response) {
  try {
    const faskesId = req.query.faskes_id as string | undefined;
    const data = await computeDefekta(faskesId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Logika inti F28 (slow-moving) — dipakai handler HTTP di bawah maupun predictDrugNeeds (FA7, ai.ts).
export async function computeSlowMoving(faskesId?: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stokWhere: any = { jumlah_tersedia: { [Op.gt]: 0 } };
  if (faskesId) stokWhere.faskes_id = faskesId;

  const stok = await Stok.findAll({
    where: stokWhere,
    include: [
      { model: Obat, as: 'obat', attributes: ['id', 'nama', 'stok_minimum', 'harga_beli'] },
      {
        model: FasilitasKesehatan,
        as: 'faskes',
        attributes: ['id', 'nama', 'tipe', 'alamat'],
        include: [{ model: Wilayah, as: 'wilayah', attributes: ['nama_kecamatan'] }],
      },
    ],
  });

  const recentMovement = (await PergerakanStok.findAll({
    where: { tipe: 'keluar', tanggal: { [Op.gte]: since } },
    attributes: ['obat_id', 'faskes_asal'],
    group: ['obat_id', 'faskes_asal'],
    raw: true,
  })) as any[];
  const movedSet = new Set(recentMovement.map((r) => `${r.obat_id}::${r.faskes_asal}`));

  const lastMovementRows = (await PergerakanStok.findAll({
    where: { tipe: 'keluar' },
    attributes: ['obat_id', 'faskes_asal', [sequelize.fn('MAX', sequelize.col('tanggal')), 'terakhir']],
    group: ['obat_id', 'faskes_asal'],
    raw: true,
  })) as any[];
  const lastMovementMap = new Map(lastMovementRows.map((r) => [`${r.obat_id}::${r.faskes_asal}`, r.terakhir]));

  // Semua stok per obat (lintas faskes) untuk cek faskes lain yang benar-benar defisit.
  const allStok = await Stok.findAll({
    include: [
      { model: Obat, as: 'obat', attributes: ['id', 'stok_minimum'] },
      {
        model: FasilitasKesehatan,
        as: 'faskes',
        attributes: ['id', 'nama', 'tipe', 'alamat'],
        include: [{ model: Wilayah, as: 'wilayah', attributes: ['nama_kecamatan'] }],
      },
    ],
  });

  const data: any[] = [];
  for (const s of stok) {
    const obat = (s as any).obat;
    const faskes = (s as any).faskes;
    if (!obat) continue;
    const key = `${obat.id}::${s.faskes_id}`;
    if (movedSet.has(key)) continue; // ada pergerakan baru-baru ini, bukan slow-moving

    const lastMoved = lastMovementMap.get(key);
    const hariTidakBergerak = lastMoved
      ? Math.floor((Date.now() - new Date(lastMoved).getTime()) / (1000 * 60 * 60 * 24))
      : null; // tidak pernah tercatat bergerak sama sekali

    const deficitElsewhere = allStok.find((other) => {
      const otherObat = (other as any).obat;
      return otherObat?.id === obat.id && other.faskes_id !== s.faskes_id && other.jumlah_tersedia < otherObat.stok_minimum;
    });

    data.push({
      stok_id: s.id,
      obat: { id: obat.id, nama: obat.nama },
      faskes: faskes
        ? {
            id: faskes.id,
            nama: faskes.nama,
            tipe: faskes.tipe,
            kecamatan: faskes.wilayah?.nama_kecamatan ?? null,
            alamat: faskes.alamat,
          }
        : null,
      jumlah_tersedia: s.jumlah_tersedia,
      hari_tidak_bergerak: hariTidakBergerak,
      nilai_modal_rp: s.jumlah_tersedia * Number(obat.harga_beli),
      saran: deficitElsewhere ? 'realokasi' : 'retur',
      faskes_tujuan_realokasi: deficitElsewhere
        ? {
            id: (deficitElsewhere as any).faskes?.id ?? null,
            nama: (deficitElsewhere as any).faskes?.nama ?? null,
            tipe: (deficitElsewhere as any).faskes?.tipe ?? null,
            kecamatan: (deficitElsewhere as any).faskes?.wilayah?.nama_kecamatan ?? null,
            alamat: (deficitElsewhere as any).faskes?.alamat ?? null,
            stok_tersedia: deficitElsewhere.jumlah_tersedia,
            stok_minimum: (deficitElsewhere as any).obat.stok_minimum,
            kekurangan: (deficitElsewhere as any).obat.stok_minimum - deficitElsewhere.jumlah_tersedia,
          }
        : null,
    });
  }

  return data;
}

// GET /api/logistic/slow-moving?faskes_id=&days=30
export async function getSlowMoving(req: Request, res: Response) {
  try {
    const faskesId = req.query.faskes_id as string | undefined;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const data = await computeSlowMoving(faskesId, days);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/logistic/surat-pesanan?faskes_id=&status=
export async function getSuratPesanan(req: Request, res: Response) {
  try {
    const where: any = {};
    if (req.query.faskes_id) where.faskes_id = req.query.faskes_id;
    if (req.query.status) where.status = req.query.status;

    const sp = await SuratPesanan.findAll({
      where,
      include: [
        { model: SpItem, as: 'items', include: [{ model: Obat, as: 'obat', attributes: ['nama', 'satuan', 'harga_beli'] }] },
        { association: 'pbf', attributes: ['nama'] },
        { association: 'faskes', attributes: ['nama'] },
      ],
      order: [['dibuat_pada', 'DESC']],
    });

    const data = sp.map((s: any) => {
      const totalNilai = s.items.reduce((sum: number, item: any) => sum + item.jumlah_usulan * Number(item.obat?.harga_beli || 0), 0);
      return {
        id: s.id,
        pbf: s.pbf ? { id: s.pbf_id, nama: s.pbf.nama } : null,
        status: s.status,
        tipe: s.jenis,
        dibuat_pada: s.dibuat_pada,
        total_item: s.items.length,
        total_nilai_rp: totalNilai,
      };
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/logistic/surat-pesanan
export async function createSuratPesanan(req: Request, res: Response) {
  try {
    const { faskes_id, pbf_id, tipe, items } = req.body ?? {};

    if (!faskes_id || !pbf_id || !tipe || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Field faskes_id, pbf_id, tipe, dan items (minimal 1) wajib diisi.' });
      return;
    }
    if (!['reguler', 'npp'].includes(tipe)) {
      res.status(400).json({ error: "tipe harus 'reguler' atau 'npp'." });
      return;
    }

    const [faskes, pbf] = await Promise.all([
      FasilitasKesehatan.findByPk(faskes_id),
      Pbf.findByPk(pbf_id),
    ]);
    if (!faskes) { res.status(400).json({ error: `Faskes '${faskes_id}' tidak ditemukan.` }); return; }
    if (!pbf) { res.status(400).json({ error: `PBF '${pbf_id}' tidak ditemukan.` }); return; }

    const obatIds = items.map((i: any) => i.obat_id);
    const obatList = await Obat.findAll({ where: { id: { [Op.in]: obatIds } } });
    if (obatList.length !== obatIds.length) {
      res.status(400).json({ error: 'Ada obat_id yang tidak ditemukan.' });
      return;
    }
    const golonganMismatch = obatList.some((o) => (tipe === 'npp' ? o.golongan !== 'npp' : o.golongan === 'npp'));
    if (golonganMismatch) {
      res.status(400).json({
        error: tipe === 'npp'
          ? 'SP jenis npp hanya boleh berisi obat golongan npp.'
          : 'SP jenis reguler tidak boleh berisi obat golongan npp — buat SP npp terpisah.',
      });
      return;
    }

    if (tipe === 'npp') {
      const user = await Pengguna.findByPk(req.user!.id);
      if (!user?.nomor_sipa) {
        res.status(403).json({ error: 'Hanya apoteker (punya nomor SIPA) yang boleh membuat SP npp.' });
        return;
      }
    }

    const sp = await sequelize.transaction(async (t) => {
      const created = await SuratPesanan.create(
        { faskes_id, pbf_id, jenis: tipe, status: 'draf', dibuat_oleh: req.user!.id },
        { transaction: t }
      );
      const obatMap = new Map(obatList.map((o) => [o.id, o]));
      await SpItem.bulkCreate(
        items.map((i: any) => ({ sp_id: created.id, obat_id: i.obat_id, jumlah_usulan: i.jumlah_usulan })),
        { transaction: t }
      );
      return { created, obatMap };
    });

    res.status(201).json({
      id: sp.created.id,
      status: sp.created.status,
      pbf_id,
      tipe,
      dibuat_pada: sp.created.dibuat_pada,
      items: items.map((i: any) => {
        const obat = sp.obatMap.get(i.obat_id);
        const harga = Number(obat?.harga_beli || 0);
        return { obat_id: i.obat_id, jumlah_usulan: i.jumlah_usulan, harga_satuan: harga, subtotal: harga * i.jumlah_usulan };
      }),
    });
  } catch (err: any) {
    console.error('Error in createSuratPesanan:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
