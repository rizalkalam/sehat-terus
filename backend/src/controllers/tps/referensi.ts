import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  Wilayah,
  Obat,
  Stok,
  FormulaRacikan,
  FormulaKomponen,
  RekamMedis,
} from '../../models';

const MASTER_PENYAKIT = [
  { kode_icd10: 'J06.9', nama_penyakit: 'ISPA' },
  { kode_icd10: 'J11', nama_penyakit: 'Influenza / Flu' },
  { kode_icd10: 'A09', nama_penyakit: 'Diare & Gastroenteritis' },
  { kode_icd10: 'A90', nama_penyakit: 'Demam Berdarah Dengue (DBD)' },
  { kode_icd10: 'I10', nama_penyakit: 'Hipertensi / Darah Tinggi' },
  { kode_icd10: 'A27.9', nama_penyakit: 'Leptospirosis' },
  { kode_icd10: 'B05', nama_penyakit: 'Campak (Measles)' },
  { kode_icd10: 'A36', nama_penyakit: 'Difteri' },
  { kode_icd10: 'A80', nama_penyakit: 'Poliomielitis Akut (Polio)' },
  { kode_icd10: 'J09', nama_penyakit: 'Flu Burung (Avian Influenza)' },
];

/**
 * GET /api/tps/referensi/penyakit
 * returns list of available ICD-10 disease codes
 */
export const listPenyakit = async (req: Request, res: Response): Promise<void> => {
  try {
    // Distinct diseases in RekamMedis
    const dbPenyakit = await RekamMedis.findAll({
      attributes: [
        [sequelizeFn('DISTINCT', 'kode_icd10'), 'kode_icd10'],
        'nama_penyakit'
      ],
      raw: true
    }) as any[];

    // Helper to merge arrays uniquely by code
    const merged = [...MASTER_PENYAKIT];
    dbPenyakit.forEach(dbItem => {
      if (dbItem.kode_icd10 && !merged.some(m => m.kode_icd10 === dbItem.kode_icd10)) {
        merged.push({
          kode_icd10: dbItem.kode_icd10,
          nama_penyakit: dbItem.nama_penyakit || 'Penyakit Tidak Dikenal'
        });
      }
    });

    res.status(200).json(merged);
  } catch (error: any) {
    console.error('Error in listPenyakit:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Helper for distinct query since sequelize typing can be tricky
import sequelize from '../../config/database';
const sequelizeFn = (fnName: string, colName: string) => {
  return sequelize.fn(fnName, sequelize.col(colName));
};

/**
 * GET /api/tps/referensi/wilayah
 * returns valid districts (kecamatan) in Sleman
 */
export const listWilayah = async (req: Request, res: Response): Promise<void> => {
  try {
    const wilayah = await Wilayah.findAll({
      attributes: ['id', 'nama_kecamatan', 'kabupaten'],
      order: [['nama_kecamatan', 'ASC']],
    });
    res.status(200).json(wilayah);
  } catch (error: any) {
    console.error('Error in listWilayah:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/tps/referensi/obat
 * returns active medicines with stock > 0 in user's faskes
 */
export const listObat = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const { q, golongan } = req.query;

    const obatWhere: any = {};
    if (q) {
      obatWhere.nama = { [Op.iLike]: `%${q}%` };
    }
    if (golongan && (golongan === 'reguler' || golongan === 'npp')) {
      obatWhere.golongan = golongan;
    }

    const results = await Obat.findAll({
      where: obatWhere,
      include: [
        {
          model: Stok,
          as: 'stok',
          required: true,
          where: {
            faskes_id,
            jumlah_tersedia: { [Op.gt]: 0 },
          },
          attributes: ['jumlah_tersedia'],
        },
      ],
      order: [['nama', 'ASC']],
    });

    const responseData = results.map((o: any) => ({
      id: o.id,
      nama: o.nama,
      satuan: o.satuan,
      golongan: o.golongan,
      stok_tersedia: o.stok.reduce((sum: number, s: any) => sum + s.jumlah_tersedia, 0),
    }));

    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Error in listObat:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * GET /api/tps/referensi/formula
 * returns formulas where all components are in stock (>= takaran)
 */
export const listFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    const formulas = (await FormulaRacikan.findAll({
      include: [
        {
          model: FormulaKomponen,
          as: 'komponen',
          include: [
            {
              model: Obat,
              as: 'obat',
              include: [
                {
                  model: Stok,
                  as: 'stok',
                  where: { faskes_id },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [['nama_racikan', 'ASC']],
    })) as any[];

    const availableFormulas = [];
    for (const formula of formulas) {
      let isAvailable = true;

      if (!formula.komponen || formula.komponen.length === 0) {
        isAvailable = false;
      } else {
        for (const comp of formula.komponen) {
          const obat = comp.obat;
          const totalStok = obat?.stok?.reduce((sum: number, s: any) => sum + s.jumlah_tersedia, 0) ?? 0;

          if (totalStok < comp.takaran) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        availableFormulas.push({
          id: formula.id,
          nama_racikan: formula.nama_racikan,
          deskripsi: formula.deskripsi,
          komponen_count: formula.komponen.length,
          stok_cukup: true,
        });
      }
    }

    res.status(200).json(availableFormulas);
  } catch (error: any) {
    console.error('Error in listFormula:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
