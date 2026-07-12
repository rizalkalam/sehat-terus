import { Request, Response } from 'express';
import { Op } from 'sequelize';
import RekamMedis from '../models/RekamMedis';
import Wilayah from '../models/Wilayah';
import FasilitasKesehatan from '../models/FasilitasKesehatan';
import { KECAMATAN_POPULATIONS } from '../config/kecamatan';
import sequelize from '../config/database';

export const getSpatialCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, diseases } = req.query;

    const where: any = {};
    if (start_date || end_date) {
      where.tanggal_kunjungan = {};
      if (start_date) where.tanggal_kunjungan[Op.gte] = new Date(start_date as string);
      if (end_date) where.tanggal_kunjungan[Op.lte] = new Date(end_date as string);
    }

    if (diseases) {
      const diseaseCodes = (diseases as string).split(',');
      where.kode_icd10 = { [Op.in]: diseaseCodes };
    }

    const results = await RekamMedis.findAll({
      attributes: [
        'kecamatan_domisili',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_cases']
      ],
      where,
      group: ['kecamatan_domisili']
    });

    const caseMap = new Map<string, number>();
    results.forEach((item: any) => {
      const name = item.kecamatan_domisili;
      const count = parseInt(item.get('total_cases') as string, 10);
      caseMap.set(name, count);
    });

    const finalResults = Object.keys(KECAMATAN_POPULATIONS).map(name => ({
      kecamatan_domisili: name,
      total_cases: caseMap.get(name) || 0,
      population: KECAMATAN_POPULATIONS[name]
    }));

    res.status(200).json(finalResults);
  } catch (error: any) {
    console.error('Error in getSpatialCases:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getTemporalCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, diseases } = req.query;

    const start = start_date ? new Date(start_date as string) : new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000);
    const end = end_date ? new Date(end_date as string) : new Date();

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let interval = 'month';
    if (diffDays < 30) {
      interval = 'day';
    } else if (diffDays <= 180) {
      interval = 'week';
    }

    const where: any = {
      tanggal_kunjungan: {
        [Op.between]: [start, end]
      }
    };

    if (diseases) {
      const diseaseCodes = (diseases as string).split(',');
      where.kode_icd10 = { [Op.in]: diseaseCodes };
    }

    const dateField = sequelize.fn('DATE_TRUNC', interval, sequelize.col('tanggal_kunjungan'));
    const results = await RekamMedis.findAll({
      attributes: [
        [dateField, 'visit_date'],
        'kode_icd10',
        'nama_penyakit',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_cases']
      ],
      where,
      group: [
        sequelize.fn('DATE_TRUNC', interval, sequelize.col('tanggal_kunjungan')),
        'kode_icd10',
        'nama_penyakit'
      ],
      order: [
        [sequelize.fn('DATE_TRUNC', interval, sequelize.col('tanggal_kunjungan')), 'ASC']
      ]
    });

    const finalResults = results.map((item: any) => ({
      visit_date: item.get('visit_date'),
      kode_icd10: item.get('kode_icd10'),
      nama_penyakit: item.get('nama_penyakit'),
      total_cases: parseInt(item.get('total_cases') as string, 10)
    }));

    res.status(200).json(finalResults);
  } catch (error: any) {
    console.error('Error in getTemporalCases:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getRegionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const { start_date, end_date } = req.query;

    const population = KECAMATAN_POPULATIONS[name];
    if (population === undefined) {
      res.status(404).json({ error: `Region '${name}' not found` });
      return;
    }

    const where: any = { kecamatan_domisili: name };
    if (start_date || end_date) {
      where.tanggal_kunjungan = {};
      if (start_date) where.tanggal_kunjungan[Op.gte] = new Date(start_date as string);
      if (end_date) where.tanggal_kunjungan[Op.lte] = new Date(end_date as string);
    }

    const cases = await RekamMedis.count({ where });

    const wilayah = await Wilayah.findOne({ where: { nama_kecamatan: name } });
    let cabang: { id: string; nama: string; tipe: string; alamat: string | null }[] = [];
    if (wilayah) {
      const faskesList = await FasilitasKesehatan.findAll({
        where: { wilayah_id: wilayah.id },
        attributes: ['id', 'nama', 'tipe', 'alamat'],
      });
      cabang = faskesList.map((f: any) => ({
        id: f.id,
        nama: f.nama,
        tipe: f.tipe,
        alamat: f.alamat,
      }));
    }

    res.status(200).json({
      name,
      population,
      cases,
      cabang_count: cabang.length,
      cabang
    });
  } catch (error: any) {
    console.error('Error in getRegionDetail:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getCasesSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    const start = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = end_date ? new Date(end_date as string) : new Date();

    const where: any = {
      tanggal_kunjungan: {
        [Op.between]: [start, end]
      }
    };

    const total_kasus = await RekamMedis.count({ where });
    
    const active_kecamatan = await RekamMedis.count({
      distinct: true,
      col: 'kecamatan_domisili',
      where
    });

    const active_patients = total_kasus; // proxy

    const topDiseasesResult = await RekamMedis.findAll({
      attributes: [
        'kode_icd10',
        'nama_penyakit',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah']
      ],
      where,
      group: ['kode_icd10', 'nama_penyakit'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });

    const top_diseases = topDiseasesResult.map((item: any) => {
      const jumlah = parseInt(item.get('jumlah') as string, 10);
      const persen = total_kasus > 0 ? parseFloat(((jumlah / total_kasus) * 100).toFixed(1)) : 0;
      return {
        kode_icd10: item.get('kode_icd10'),
        nama_penyakit: item.get('nama_penyakit'),
        jumlah,
        persen
      };
    });

    const periode_label = start_date && end_date
      ? `Periode ${start_date} s/d ${end_date}`
      : '30 hari terakhir';

    res.status(200).json({
      total_kasus,
      active_kecamatan,
      active_patients,
      periode_label,
      top_diseases
    });
  } catch (error: any) {
    console.error('Error in getCasesSummary:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
