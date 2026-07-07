import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { RekamMedis, Resep, ResepItem, Obat, FormulaRacikan, AlertEws } from '../models';
import { holtForecast } from '../utils/holtSmoothing';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface DiseaseMeta {
  kode_icd10: string;
  nama_penyakit: string;
}

// Diseases with any historical data — rare/unseen diseases contribute nothing to a trend anyway.
async function listTrackedDiseases(): Promise<DiseaseMeta[]> {
  const rows = (await RekamMedis.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('kode_icd10')), 'kode_icd10'],
      'nama_penyakit',
    ],
    raw: true,
  })) as any[];

  const seen = new Set<string>();
  const result: DiseaseMeta[] = [];
  for (const row of rows) {
    if (row.kode_icd10 && !seen.has(row.kode_icd10)) {
      seen.add(row.kode_icd10);
      result.push({ kode_icd10: row.kode_icd10, nama_penyakit: row.nama_penyakit });
    }
  }
  return result;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const diffToMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Zero-filled weekly case-count series for one disease, using only fully-elapsed weeks —
// the current in-progress week is excluded so it doesn't skew the fit/comparisons as a false dip.
async function weeklySeries(kode_icd10: string, weeksBack: number): Promise<{ weekStarts: Date[]; counts: number[]; currentWeekStart: Date }> {
  const currentWeekStart = mondayOf(new Date());
  const start = new Date(currentWeekStart.getTime() - weeksBack * WEEK_MS);

  const rows = (await RekamMedis.findAll({
    attributes: [
      [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('tanggal_kunjungan')), 'minggu'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah'],
    ],
    where: {
      kode_icd10,
      tanggal_kunjungan: { [Op.between]: [start, currentWeekStart] },
    },
    group: [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('tanggal_kunjungan'))],
    raw: true,
  })) as any[];

  const byWeek = new Map<string, number>();
  rows.forEach((r) => {
    const key = new Date(r.minggu).toISOString().slice(0, 10);
    byWeek.set(key, parseInt(r.jumlah, 10));
  });

  const weekStarts: Date[] = [];
  const counts: number[] = [];
  const cursor = new Date(start);

  while (cursor < currentWeekStart) {
    const key = cursor.toISOString().slice(0, 10);
    weekStarts.push(new Date(cursor));
    counts.push(byWeek.get(key) || 0);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return { weekStarts, counts, currentWeekStart };
}

async function forecastDisease(disease: DiseaseMeta, weeksBack: number, weeksAhead: number) {
  const { weekStarts, counts, currentWeekStart } = await weeklySeries(disease.kode_icd10, weeksBack);
  const { forecast } = holtForecast(counts, weeksAhead);

  const lastActual = counts[counts.length - 1] ?? 0;
  const nextForecastTotal = forecast.reduce((a, b) => a + b, 0);
  const persen_change = lastActual > 0
    ? Math.round(((forecast[0] - lastActual) / lastActual) * 1000) / 10
    : (forecast[0] > 0 ? 100 : 0);

  return { disease, weekStarts, counts, forecast, lastActual, nextForecastTotal, persen_change, currentWeekStart };
}

async function rekomendasiObatUntuk(kode_icd10: string): Promise<string[]> {
  // 1. Real prescription history for this disease, if any exists.
  const items = (await ResepItem.findAll({
    include: [
      { model: Resep, as: 'resep', required: true, include: [{ model: RekamMedis, as: 'rekam_medis', required: true, where: { kode_icd10 }, attributes: [] }], attributes: [] },
      { model: Obat, as: 'obat', required: false, attributes: ['nama'] },
      { model: FormulaRacikan, as: 'formula', required: false, attributes: ['nama_racikan'] },
    ],
    attributes: ['id'],
  })) as any[];

  if (items.length > 0) {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const nama = item.obat?.nama || item.formula?.nama_racikan;
      if (nama) counts.set(nama, (counts.get(nama) || 0) + 1);
    });
    if (counts.size > 0) {
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([nama]) => nama);
    }
  }

  // 2. Fallback: whatever the EWS engine already links this disease to.
  const alert = await AlertEws.findOne({
    where: { kode_icd10, obat_terdampak_id: { [Op.ne]: null } },
    include: [{ model: Obat, as: 'obat_terdampak', attributes: ['nama'] }],
  });
  const obatNama = (alert as any)?.obat_terdampak?.nama;
  return obatNama ? [obatNama] : [];
}

export const getProjection = async (req: Request, res: Response): Promise<void> => {
  try {
    const diseasesParam = (req.query.diseases as string) || 'J06.9,A90';
    const monthsBack = req.query.months_back ? parseInt(req.query.months_back as string, 10) : 6;
    const daysAhead = req.query.days_ahead ? parseInt(req.query.days_ahead as string, 10) : 30;
    const weeksBack = Math.max(1, Math.round((monthsBack * 30) / 7));
    const weeksAhead = Math.max(1, Math.ceil(daysAhead / 7));

    const codes = diseasesParam.split(',').map((c) => c.trim()).filter(Boolean);
    const tracked = await listTrackedDiseases();
    const targets = codes.map((code) => tracked.find((d) => d.kode_icd10 === code) || { kode_icd10: code, nama_penyakit: code });

    const output: any[] = [];
    for (const disease of targets) {
      const { weekStarts, counts, forecast, currentWeekStart } = await forecastDisease(disease, weeksBack, weeksAhead);

      weekStarts.forEach((date, i) => {
        output.push({
          tanggal: date.toISOString().slice(0, 10),
          nama_penyakit: disease.nama_penyakit,
          kode_icd10: disease.kode_icd10,
          kasus_aktual: counts[i],
          kasus_prediksi: null,
          tipe: 'historis',
        });
      });

      forecast.forEach((jumlah, i) => {
        const tanggal = new Date(currentWeekStart.getTime() + i * WEEK_MS);
        output.push({
          tanggal: tanggal.toISOString().slice(0, 10),
          nama_penyakit: disease.nama_penyakit,
          kode_icd10: disease.kode_icd10,
          kasus_aktual: null,
          kasus_prediksi: jumlah,
          tipe: 'proyeksi',
        });
      });
    }

    res.status(200).json(output);
  } catch (error: any) {
    console.error('Error in getProjection:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getForecastingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const diseases = await listTrackedDiseases();
    const results = await Promise.all(diseases.map((d) => forecastDisease(d, 26, 4)));

    const withSignal = results.filter((r) => r.lastActual > 0 || r.nextForecastTotal > 0);
    const rising = [...withSignal].sort((a, b) => b.persen_change - a.persen_change)[0];
    const falling = [...withSignal].filter((r) => r.persen_change < 0).sort((a, b) => a.persen_change - b.persen_change)[0];
    const total_kasus_proyeksi = withSignal.reduce((sum, r) => sum + r.nextForecastTotal, 0);

    res.status(200).json({
      peningkatan_tertinggi: rising ? {
        nama_penyakit: rising.disease.nama_penyakit,
        kode_icd10: rising.disease.kode_icd10,
        persen_change: rising.persen_change,
        kasus_prediksi: rising.forecast[0],
        label: 'Proyeksi minggu depan',
      } : null,
      penurunan_terbesar: falling ? {
        nama_penyakit: falling.disease.nama_penyakit,
        kode_icd10: falling.disease.kode_icd10,
        persen_change: falling.persen_change,
        kasus_prediksi: falling.forecast[0],
        label: 'Proyeksi minggu depan',
      } : null,
      total_kasus_proyeksi,
    });
  } catch (error: any) {
    console.error('Error in getForecastingStats:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getForecastingAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const diseases = await listTrackedDiseases();
    const results = await Promise.all(diseases.map((d) => forecastDisease(d, 26, 4)));

    const rising = results
      .filter((r) => r.persen_change > 0 && r.lastActual > 0)
      .sort((a, b) => b.persen_change - a.persen_change)
      .slice(0, 3);

    const output = await Promise.all(rising.map(async (r) => {
      const urgensi = r.persen_change >= 30 ? 'tinggi' : r.persen_change >= 10 ? 'sedang' : 'rendah';
      const rekomendasi_tindakan = urgensi === 'tinggi'
        ? 'Segera tambah stok obat terkait dan siapkan kapasitas layanan tambahan.'
        : urgensi === 'sedang'
        ? 'Pantau ketat dan siapkan stok cadangan dalam 1-2 minggu ke depan.'
        : 'Tetap pantau tren, belum perlu tindakan darurat.';

      return {
        jenis_penyakit: r.disease.nama_penyakit,
        kode_icd10: r.disease.kode_icd10,
        urgensi,
        persen_change: r.persen_change,
        deskripsi: `Tren ${r.disease.nama_penyakit} diproyeksikan naik ${r.persen_change}% minggu depan berdasarkan data historis.`,
        rekomendasi_obat: await rekomendasiObatUntuk(r.disease.kode_icd10),
        rekomendasi_tindakan,
      };
    }));

    res.status(200).json(output);
  } catch (error: any) {
    console.error('Error in getForecastingAlerts:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
