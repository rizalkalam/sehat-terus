import { Request, Response } from 'express';
import {
  RekamMedis,
  Resep,
  ResepItem,
  Stok,
  PergerakanStok,
  FormulaRacikan,
  FormulaKomponen,
  Obat,
  sequelize,
} from '../../models';

/**
 * POST /api/tps/kunjungan/:id/resep
 * Creates a prescription, deducts stock, and records movement in a transaction
 */
export const createResep = async (req: Request, res: Response): Promise<void> => {
  try {
    const faskes_id = req.user?.faskes_id;
    const dicatat_oleh = req.user?.id;
    const peran = req.user?.peran;

    if (!faskes_id) {
      res.status(400).json({ error: 'Pengguna tidak terasosiasi dengan faskes manapun.' });
      return;
    }

    // Role verification (only apoteker or admin)
    if (peran !== 'apoteker' && peran !== 'admin') {
      res.status(403).json({ error: 'Hanya apoteker atau admin yang dapat membuat resep.' });
      return;
    }

    const { id: rekam_medis_id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Item resep wajib dikirimkan.' });
      return;
    }

    // 1. Visit validation
    const visit = await RekamMedis.findOne({
      where: { id: rekam_medis_id, faskes_id },
    });

    if (!visit) {
      res.status(404).json({ error: 'Kunjungan tidak ditemukan.' });
      return;
    }

    // 2. Check if resep already exists
    const hasResep = await Resep.findOne({ where: { rekam_medis_id } });
    if (hasResep) {
      res.status(409).json({ error: 'Kunjungan ini sudah memiliki resep.' });
      return;
    }

    // 3. XOR validation & aggregate quantity requirements
    const obatNeeds = new Map<string, number>();

    for (const item of items) {
      const hasObat = !!item.obat_id;
      const hasFormula = !!item.formula_id;

      if ((hasObat && hasFormula) || (!hasObat && !hasFormula)) {
        res.status(400).json({ error: 'Setiap item harus memiliki obat_id ATAU formula_id saja (XOR).' });
        return;
      }

      if (item.jumlah <= 0) {
        res.status(400).json({ error: 'Jumlah item harus lebih dari 0.' });
        return;
      }

      if (hasObat) {
        const current = obatNeeds.get(item.obat_id) || 0;
        obatNeeds.set(item.obat_id, current + item.jumlah);
      } else {
        const formula = (await FormulaRacikan.findOne({
          where: { id: item.formula_id },
          include: [{ model: FormulaKomponen, as: 'komponen' }],
        })) as any;

        if (!formula) {
          res.status(400).json({ error: `Formula dengan ID '${item.formula_id}' tidak ditemukan.` });
          return;
        }

        if (!formula.komponen || formula.komponen.length === 0) {
          res.status(400).json({ error: `Formula '${formula.nama_racikan}' tidak memiliki komponen obat.` });
          return;
        }

        for (const comp of formula.komponen) {
          const neededQty = Math.ceil(Number(comp.takaran) * item.jumlah);
          const current = obatNeeds.get(comp.obat_id) || 0;
          obatNeeds.set(comp.obat_id, current + neededQty);
        }
      }
    }

    // 4. Check stocks
    const insufficientItems = [];
    for (const [obatId, neededQty] of obatNeeds.entries()) {
      const obat = await Obat.findByPk(obatId);
      if (!obat) {
        res.status(400).json({ error: `Obat dengan ID '${obatId}' tidak ditemukan.` });
        return;
      }

      const totalStock = (await Stok.sum('jumlah_tersedia', {
        where: { faskes_id, obat_id: obatId },
      })) || 0;

      if (totalStock < neededQty) {
        insufficientItems.push({
          obat: obat.nama,
          diminta: neededQty,
          tersedia: totalStock,
        });
      }
    }

    if (insufficientItems.length > 0) {
      res.status(400).json({
        error: 'Stok tidak cukup',
        detail: insufficientItems,
      });
      return;
    }

    // 5. Database transaction for atomic updates
    const result = await sequelize.transaction(async (t) => {
      // 5.1 Create Resep header
      const resep = await Resep.create(
        {
          rekam_medis_id,
          dibuat_oleh: dicatat_oleh,
          tanggal: new Date(),
        },
        { transaction: t }
      );

      const itemsResponse = [];

      // 5.2 Process each prescription item
      for (const item of items) {
        // Create ResepItem
        const resepItem = await ResepItem.create(
          {
            resep_id: resep.id,
            obat_id: item.obat_id || null,
            formula_id: item.formula_id || null,
            jumlah: item.jumlah,
          },
          { transaction: t }
        );

        if (item.obat_id) {
          // Direct medicine stock deduction (FEFO)
          const stocks = await Stok.findAll({
            where: { faskes_id, obat_id: item.obat_id },
            order: [
              ['tanggal_kedaluwarsa', 'ASC'],
              ['id', 'ASC'],
            ],
            transaction: t,
          });

          let remaining = item.jumlah;
          for (const stockRow of stocks) {
            if (remaining <= 0) break;
            const available = stockRow.jumlah_tersedia;
            if (available <= 0) continue;

            const deduct = Math.min(available, remaining);
            stockRow.jumlah_tersedia -= deduct;
            await stockRow.save({ transaction: t });
            remaining -= deduct;
          }

          // Record movement
          await PergerakanStok.create(
            {
              obat_id: item.obat_id,
              faskes_asal: faskes_id,
              faskes_tujuan: null,
              tipe: 'keluar',
              jumlah: item.jumlah,
              referensi: resep.id,
              dicatat_oleh,
            },
            { transaction: t }
          );

          const obat = await Obat.findByPk(item.obat_id, { transaction: t });
          const updatedTotalStock = (await Stok.sum('jumlah_tersedia', {
            where: { faskes_id, obat_id: item.obat_id },
            transaction: t,
          })) || 0;

          itemsResponse.push({
            id: resepItem.id,
            obat_id: item.obat_id,
            nama_obat: obat?.nama || 'Obat',
            jumlah: item.jumlah,
            stok_setelah: updatedTotalStock,
          });
        } else {
          // Formula components deduction (FEFO)
          const formula = (await FormulaRacikan.findOne({
            where: { id: item.formula_id },
            include: [{ model: FormulaKomponen, as: 'komponen' }],
            transaction: t,
          })) as any;

          for (const comp of formula.komponen) {
            const neededQty = Math.ceil(Number(comp.takaran) * item.jumlah);

            const stocks = await Stok.findAll({
              where: { faskes_id, obat_id: comp.obat_id },
              order: [
                ['tanggal_kedaluwarsa', 'ASC'],
                ['id', 'ASC'],
              ],
              transaction: t,
            });

            let remaining = neededQty;
            for (const stockRow of stocks) {
              if (remaining <= 0) break;
              const available = stockRow.jumlah_tersedia;
              if (available <= 0) continue;

              const deduct = Math.min(available, remaining);
              stockRow.jumlah_tersedia -= deduct;
              await stockRow.save({ transaction: t });
              remaining -= deduct;
            }

            // Record movement
            await PergerakanStok.create(
              {
                obat_id: comp.obat_id,
                faskes_asal: faskes_id,
                faskes_tujuan: null,
                tipe: 'keluar',
                jumlah: neededQty,
                referensi: resep.id,
                dicatat_oleh,
              },
              { transaction: t }
            );
          }

          itemsResponse.push({
            id: resepItem.id,
            formula_id: item.formula_id,
            nama_formula: formula.nama_racikan,
            jumlah: item.jumlah,
          });
        }
      }

      return {
        id: resep.id,
        rekam_medis_id: resep.rekam_medis_id,
        dibuat_oleh: resep.dibuat_oleh,
        tanggal: resep.tanggal,
        items: itemsResponse,
      };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in createResep:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
