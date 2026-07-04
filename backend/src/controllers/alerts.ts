import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AlertEws, Obat, FasilitasKesehatan, Stok, Wilayah, RekamMedis, sequelize } from '../models';

// Business rules for deriving `level` (kritis/waspada) — alert_ews has no stored
// severity column, so it's computed the same way everywhere it's needed.
// Mirrors the "<48 jam" stock-critical copy already used on the /peringatan-dini mockup.
const LONJAKAN_KRITIS_THRESHOLD = 150; // % lonjakan di atas baseline
const STOK_KRITIS_JAM_THRESHOLD = 48; // jam ketahanan stok

type Level = 'kritis' | 'waspada';

function computeLevel(persenLonjakan: number, ketahananStokJam: number | null): Level {
  const lonjakanKritis = Number(persenLonjakan) >= LONJAKAN_KRITIS_THRESHOLD;
  const stokKritis = ketahananStokJam !== null && ketahananStokJam <= STOK_KRITIS_JAM_THRESHOLD;
  return lonjakanKritis || stokKritis ? 'kritis' : 'waspada';
}

// Simple heuristic (MVP) — real projection is Phase 8 (double exponential smoothing).
function estimasiPuncak(lajuHarian: number | null): string {
  if (lajuHarian === null) return 'Tidak dapat diperkirakan (data laju harian tidak tersedia)';
  const laju = Number(lajuHarian);
  if (laju >= 15) return '1–2 hari mendatang';
  if (laju >= 10) return '2–3 hari mendatang';
  if (laju >= 5) return '4–6 hari mendatang';
  return '7–10 hari mendatang';
}

/**
 * GET /api/alerts
 * Lists EWS alerts, default status=aktif
 */
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'aktif', limit = 20, faskes_id } = req.query;

    const where: any = { status };
    if (faskes_id) where.faskes_id = faskes_id;

    const alerts = await AlertEws.findAll({
      where,
      order: [['terdeteksi_pada', 'DESC']],
      limit: Math.min(Number(limit) || 20, 100),
    });

    const data = alerts.map((a: any) => ({
      id: a.id,
      kecamatan: a.kecamatan,
      jenis_penyakit: a.jenis_penyakit,
      kode_icd10: a.kode_icd10,
      persen_lonjakan: Number(a.persen_lonjakan),
      laju_harian: a.laju_harian !== null ? Number(a.laju_harian) : null,
      jumlah_kasus: a.jumlah_kasus,
      status: a.status,
      level: computeLevel(a.persen_lonjakan, a.ketahanan_stok_jam),
      ketahanan_stok_jam: a.ketahanan_stok_jam,
      terdeteksi_pada: a.terdeteksi_pada,
    }));

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in getAlerts:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/alerts/:id
 * Alert detail for the modal view
 */
export const getAlertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = (await AlertEws.findByPk(req.params.id, {
      include: [{ model: Obat, as: 'obat_terdampak' }],
    })) as any;

    if (!alert) {
      res.status(404).json({ error: 'Alert tidak ditemukan.' });
      return;
    }

    let obat_kritis: any[] = [];
    if (alert.obat_terdampak) {
      const stokWhere: any = { obat_id: alert.obat_terdampak_id };
      if (alert.faskes_id) stokWhere.faskes_id = alert.faskes_id;
      const totalStok = (await Stok.sum('jumlah_tersedia', { where: stokWhere })) || 0;

      obat_kritis = [
        {
          obat_id: alert.obat_terdampak.id,
          nama: alert.obat_terdampak.nama,
          stok_tersedia: totalStok,
          ketahanan_jam: alert.ketahanan_stok_jam,
        },
      ];
    }

    res.status(200).json({
      id: alert.id,
      kecamatan: alert.kecamatan,
      jenis_penyakit: alert.jenis_penyakit,
      kode_icd10: alert.kode_icd10,
      persen_lonjakan: Number(alert.persen_lonjakan),
      laju_harian: alert.laju_harian !== null ? Number(alert.laju_harian) : null,
      jumlah_kasus: alert.jumlah_kasus,
      status: alert.status,
      level: computeLevel(alert.persen_lonjakan, alert.ketahanan_stok_jam),
      terdeteksi_pada: alert.terdeteksi_pada,
      estimasi_puncak: estimasiPuncak(alert.laju_harian),
      obat_kritis,
    });
  } catch (error: any) {
    console.error('Error in getAlertById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/alerts/stats
 * 3 stat cards for /peringatan-dini
 */
export const getAlertsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faskes_id } = req.query;

    const where: any = { status: 'aktif' };
    if (faskes_id) where.faskes_id = faskes_id;

    const aktifAlerts = (await AlertEws.findAll({
      where,
      include: [
        { model: Obat, as: 'obat_terdampak' },
        { model: FasilitasKesehatan, as: 'faskes' },
      ],
    })) as any[];

    // stok_kritis — aktif alerts with an at-risk medicine within the critical window
    const stokKritisAlerts = aktifAlerts.filter(
      (a) => a.obat_terdampak_id && a.ketahanan_stok_jam !== null && a.ketahanan_stok_jam <= STOK_KRITIS_JAM_THRESHOLD
    );
    const stokKritisObatNames = [...new Set(stokKritisAlerts.map((a) => a.obat_terdampak?.nama).filter(Boolean))];
    const stokKritisFaskesNames = [...new Set(stokKritisAlerts.map((a) => a.faskes?.nama).filter(Boolean))];

    // total_lonjakan — highlight the most severe active alert
    const sortedBySeverity = [...aktifAlerts].sort((a, b) => Number(b.persen_lonjakan) - Number(a.persen_lonjakan));
    const topAlert = sortedBySeverity[0];

    // wilayah_terdampak — distinct kecamatan among active alerts vs total kecamatan
    const wilayahTerdampak = new Set(aktifAlerts.map((a) => a.kecamatan));
    const totalKecamatan = await Wilayah.count();

    res.status(200).json({
      stok_kritis: {
        jumlah: stokKritisAlerts.length,
        label: 'Obat stok kritis',
        badges: [...stokKritisObatNames, ...stokKritisFaskesNames].slice(0, 2),
      },
      total_lonjakan: {
        jumlah: aktifAlerts.length,
        label: 'Lonjakan kasus aktif',
        badges: topAlert
          ? [topAlert.jenis_penyakit, `+${Math.round(Number(topAlert.persen_lonjakan))}%`]
          : [],
      },
      wilayah_terdampak: {
        jumlah: wilayahTerdampak.size,
        label: 'Kecamatan terdampak',
        badges: [`Dari ${totalKecamatan} kecamatan`],
      },
    });
  } catch (error: any) {
    console.error('Error in getAlertsStats:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/alerts/summary
 * Template-based situation summary text (MVP — not an LLM)
 */
export const getAlertsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faskes_id } = req.query;

    const where: any = { status: 'aktif' };
    if (faskes_id) where.faskes_id = faskes_id;

    const aktifAlerts = (await AlertEws.findAll({
      where,
      include: [{ model: Obat, as: 'obat_terdampak' }],
      order: [['persen_lonjakan', 'DESC']],
    })) as any[];

    if (aktifAlerts.length === 0) {
      res.status(200).json({
        teks: 'Situasi terkendali: tidak ada alert aktif saat ini.',
        generated_at: new Date().toISOString(),
      });
      return;
    }

    const top = aktifAlerts[0];
    const kecamatanCount = new Set(aktifAlerts.map((a) => a.kecamatan)).size;
    const level = computeLevel(top.persen_lonjakan, top.ketahanan_stok_jam);

    const stokClause =
      top.obat_terdampak && top.ketahanan_stok_jam !== null
        ? `, stok ${top.obat_terdampak.nama} diperkirakan habis dalam ${top.ketahanan_stok_jam} jam`
        : '';

    const teks =
      `Situasi ${level}: terdapat ${aktifAlerts.length} alert aktif di ${kecamatanCount} kecamatan. ` +
      `${top.jenis_penyakit} di Kec. ${top.kecamatan} mencapai +${Math.round(Number(top.persen_lonjakan))}% di atas normal${stokClause}. ` +
      `Segera pantau perkembangan dan siapkan tindakan mitigasi.`;

    res.status(200).json({
      teks,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getAlertsSummary:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const PATCHABLE_STATUSES = ['ditangani', 'selesai'];

/**
 * PATCH /api/alerts/:id
 * Marks an alert as handled/resolved
 */
export const updateAlertStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body ?? {};

    if (!PATCHABLE_STATUSES.includes(status)) {
      res.status(400).json({ error: `Status harus salah satu dari: ${PATCHABLE_STATUSES.join(', ')}.` });
      return;
    }

    const alert = await AlertEws.findByPk(req.params.id);
    if (!alert) {
      res.status(404).json({ error: 'Alert tidak ditemukan.' });
      return;
    }

    alert.status = status;
    alert.ditangani_pada = new Date();
    alert.ditangani_oleh = req.user!.id;
    await alert.save();

    res.status(200).json({
      id: alert.id,
      status: alert.status,
      ditangani_pada: alert.ditangani_pada,
      ditangani_oleh: alert.ditangani_oleh,
    });
  } catch (error: any) {
    console.error('Error in updateAlertStatus:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ── Z-score anomaly detection (F12) ─────────────────────────────────────────
//
// Compares the last RECENT_WINDOW_DAYS of daily case counts per
// (kecamatan, kode_icd10) against a BASELINE_WINDOW_DAYS trailing baseline.
// An anomaly requires BOTH:
//   1. z-score >= ZSCORE_THRESHOLD (statistically unusual vs its own baseline)
//   2. total kasus in the recent window >= MIN_KASUS_RECENT (absolute floor —
//      per REQUIREMENTS.md ANL-02, prevents tiny counts like 1→3 cases from
//      registering as a "300% spike" false alarm)
//
// Scope note: this only flags/creates/refreshes case-count anomalies. It does
// not set `obat_terdampak_id`/`ketahanan_stok_jam` (no reliable disease→obat
// mapping exists in the schema) and does not auto-resolve alerts that stop
// being anomalous — both are manual/future work. Threshold configuration
// (REQUIREMENTS.md ADM-02) is out of scope for this MVP; thresholds are
// constants below.
const ZSCORE_THRESHOLD = 2;
const MIN_KASUS_RECENT = 5;
const RECENT_WINDOW_DAYS = 7;
const BASELINE_WINDOW_DAYS = 28;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Simple day-over-day growth heuristic (average % change between consecutive
// days with a non-zero prior day) — matches the informal meaning of the
// seeded `laju_harian` values, not a real regression model.
function computeLajuHarian(dailyCounts: number[]): number {
  const deltas: number[] = [];
  for (let i = 1; i < dailyCounts.length; i++) {
    const prev = dailyCounts[i - 1];
    if (prev > 0) deltas.push(((dailyCounts[i] - prev) / prev) * 100);
  }
  return deltas.length > 0 ? mean(deltas) : 0;
}

/**
 * POST /api/alerts/detect
 * Runs the Z-score anomaly scan across all (kecamatan, kode_icd10) combos
 * with recent activity, creating/refreshing `alert_ews` rows for anomalies.
 */
export const detectAnomalies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Normalize to midnight-UTC boundaries so JS-side day buckets line up
    // exactly with Postgres's DATE_TRUNC('day', ...) — otherwise a naive
    // `now`-minus-N-days walk (carrying today's time-of-day) never lands on
    // today's own calendar bucket and silently drops same-day cases.
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const rangeEnd = new Date(today);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1); // tomorrow midnight — exclusive upper bound, includes all of today

    const recentStart = new Date(today);
    recentStart.setUTCDate(recentStart.getUTCDate() - (RECENT_WINDOW_DAYS - 1)); // recent window includes today
    const baselineStart = new Date(recentStart);
    baselineStart.setUTCDate(baselineStart.getUTCDate() - BASELINE_WINDOW_DAYS);

    const rows = (await RekamMedis.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('tanggal_kunjungan')), 'hari'],
        'kecamatan_domisili',
        'kode_icd10',
        'nama_penyakit',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah'],
      ],
      where: { tanggal_kunjungan: { [Op.gte]: baselineStart, [Op.lt]: rangeEnd } },
      group: [
        sequelize.fn('DATE_TRUNC', 'day', sequelize.col('tanggal_kunjungan')),
        'kecamatan_domisili',
        'kode_icd10',
        'nama_penyakit',
      ],
      raw: true,
    })) as any[];

    type GroupData = { kecamatan: string; kode_icd10: string; nama_penyakit: string; counts: Map<string, number> };
    const groups = new Map<string, GroupData>();

    for (const r of rows) {
      const key = `${r.kecamatan_domisili}::${r.kode_icd10}`;
      if (!groups.has(key)) {
        groups.set(key, {
          kecamatan: r.kecamatan_domisili,
          kode_icd10: r.kode_icd10,
          nama_penyakit: r.nama_penyakit,
          counts: new Map(),
        });
      }
      const dateKey = new Date(r.hari).toISOString().slice(0, 10);
      groups.get(key)!.counts.set(dateKey, parseInt(r.jumlah, 10));
    }

    const detected: any[] = [];
    let analyzed = 0;

    for (const g of groups.values()) {
      analyzed++;

      const baselineDaily: number[] = [];
      const recentDaily: number[] = [];
      for (let d = new Date(baselineStart); d < rangeEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateKey = d.toISOString().slice(0, 10);
        const count = g.counts.get(dateKey) ?? 0;
        if (d < recentStart) baselineDaily.push(count);
        else recentDaily.push(count);
      }

      const recentTotal = recentDaily.reduce((a, b) => a + b, 0);
      if (recentTotal < MIN_KASUS_RECENT) continue;

      const baselineMean = mean(baselineDaily);
      const baselineStd = stddev(baselineDaily, baselineMean);
      const recentMean = mean(recentDaily);

      let z: number;
      if (baselineStd > 0) {
        z = (recentMean - baselineMean) / baselineStd;
      } else {
        z = recentMean > baselineMean ? Infinity : 0;
      }
      if (z < ZSCORE_THRESHOLD) continue;

      const persenLonjakan = baselineMean > 0 ? ((recentMean - baselineMean) / baselineMean) * 100 : 100;
      const lajuHarian = computeLajuHarian(recentDaily);

      let alert = await AlertEws.findOne({
        where: { kecamatan: g.kecamatan, kode_icd10: g.kode_icd10, status: 'aktif' },
      });

      let aksi: 'baru' | 'diperbarui';
      if (alert) {
        alert.persen_lonjakan = persenLonjakan;
        alert.laju_harian = lajuHarian;
        alert.jumlah_kasus = recentTotal;
        alert.terdeteksi_pada = new Date();
        await alert.save();
        aksi = 'diperbarui';
      } else {
        alert = await AlertEws.create({
          kecamatan: g.kecamatan,
          jenis_penyakit: g.nama_penyakit,
          kode_icd10: g.kode_icd10,
          persen_lonjakan: persenLonjakan,
          laju_harian: lajuHarian,
          jumlah_kasus: recentTotal,
          status: 'aktif',
          terdeteksi_pada: new Date(),
        });
        aksi = 'baru';
      }

      detected.push({
        id: alert.id,
        kecamatan: g.kecamatan,
        jenis_penyakit: g.nama_penyakit,
        kode_icd10: g.kode_icd10,
        persen_lonjakan: Math.round(persenLonjakan * 10) / 10,
        z_score: Number.isFinite(z) ? Math.round(z * 100) / 100 : null,
        jumlah_kasus: recentTotal,
        aksi,
      });
    }

    res.status(200).json({
      checked_at: now.toISOString(),
      kombinasi_dianalisis: analyzed,
      anomali_terdeteksi: detected.length,
      alerts: detected,
    });
  } catch (error: any) {
    console.error('Error in detectAnomalies:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
