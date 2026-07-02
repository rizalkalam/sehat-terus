import sequelize from '../config/database';

import RekamMedis from './RekamMedis';
import Wilayah from './Wilayah';
import FasilitasKesehatan from './FasilitasKesehatan';
import Pengguna from './Pengguna';
import Obat from './Obat';
import Pbf from './Pbf';
import FormulaRacikan from './FormulaRacikan';
import FormulaKomponen from './FormulaKomponen';
import Resep from './Resep';
import ResepItem from './ResepItem';
import Stok from './Stok';
import PergerakanStok from './PergerakanStok';
import AlertEws from './AlertEws';
import PrediksiKebutuhan from './PrediksiKebutuhan';
import SuratPesanan from './SuratPesanan';
import SpItem from './SpItem';

// ── Master: Wilayah ───────────────────────────────────────────────────────────
Wilayah.hasMany(FasilitasKesehatan, { foreignKey: 'wilayah_id', as: 'faskes' });
FasilitasKesehatan.belongsTo(Wilayah, { foreignKey: 'wilayah_id', as: 'wilayah' });

// ── Master: FasilitasKesehatan ↔ Pengguna ────────────────────────────────────
FasilitasKesehatan.hasMany(Pengguna, { foreignKey: 'faskes_id', as: 'pengguna' });
Pengguna.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });

// ── Master: FasilitasKesehatan ↔ RekamMedis ──────────────────────────────────
FasilitasKesehatan.hasMany(RekamMedis, { foreignKey: 'faskes_id', as: 'rekam_medis' });
RekamMedis.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });

// ── Master: Pengguna ↔ RekamMedis ────────────────────────────────────────────
Pengguna.hasMany(RekamMedis, { foreignKey: 'dicatat_oleh', as: 'rekam_medis_dicatat' });
RekamMedis.belongsTo(Pengguna, { foreignKey: 'dicatat_oleh', as: 'pencatat' });

// ── Racikan ───────────────────────────────────────────────────────────────────
FormulaRacikan.hasMany(FormulaKomponen, { foreignKey: 'formula_id', as: 'komponen', onDelete: 'CASCADE' });
FormulaKomponen.belongsTo(FormulaRacikan, { foreignKey: 'formula_id', as: 'formula' });
Obat.hasMany(FormulaKomponen, { foreignKey: 'obat_id', as: 'digunakan_di_formula' });
FormulaKomponen.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });

// ── TPS: Resep ────────────────────────────────────────────────────────────────
RekamMedis.hasMany(Resep, { foreignKey: 'rekam_medis_id', as: 'resep' });
Resep.belongsTo(RekamMedis, { foreignKey: 'rekam_medis_id', as: 'rekam_medis' });
Pengguna.hasMany(Resep, { foreignKey: 'dibuat_oleh', as: 'resep_dibuat' });
Resep.belongsTo(Pengguna, { foreignKey: 'dibuat_oleh', as: 'pembuat' });

Resep.hasMany(ResepItem, { foreignKey: 'resep_id', as: 'items', onDelete: 'CASCADE' });
ResepItem.belongsTo(Resep, { foreignKey: 'resep_id', as: 'resep' });
Obat.hasMany(ResepItem, { foreignKey: 'obat_id', as: 'resep_items' });
ResepItem.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });
FormulaRacikan.hasMany(ResepItem, { foreignKey: 'formula_id', as: 'resep_items' });
ResepItem.belongsTo(FormulaRacikan, { foreignKey: 'formula_id', as: 'formula' });

// ── TPS: Stok ─────────────────────────────────────────────────────────────────
FasilitasKesehatan.hasMany(Stok, { foreignKey: 'faskes_id', as: 'stok' });
Stok.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });
Obat.hasMany(Stok, { foreignKey: 'obat_id', as: 'stok' });
Stok.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });

// ── TPS: PergerakanStok ───────────────────────────────────────────────────────
Obat.hasMany(PergerakanStok, { foreignKey: 'obat_id', as: 'pergerakan' });
PergerakanStok.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });
FasilitasKesehatan.hasMany(PergerakanStok, { foreignKey: 'faskes_asal', as: 'pergerakan_keluar' });
FasilitasKesehatan.hasMany(PergerakanStok, { foreignKey: 'faskes_tujuan', as: 'pergerakan_masuk' });
Pengguna.hasMany(PergerakanStok, { foreignKey: 'dicatat_oleh', as: 'pergerakan_dicatat' });
PergerakanStok.belongsTo(Pengguna, { foreignKey: 'dicatat_oleh', as: 'pencatat' });

// ── MIS: AlertEws ─────────────────────────────────────────────────────────────
FasilitasKesehatan.hasMany(AlertEws, { foreignKey: 'faskes_id', as: 'alerts' });
AlertEws.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });
Obat.hasMany(AlertEws, { foreignKey: 'obat_terdampak_id', as: 'alerts' });
AlertEws.belongsTo(Obat, { foreignKey: 'obat_terdampak_id', as: 'obat_terdampak' });

// ── MIS: PrediksiKebutuhan ────────────────────────────────────────────────────
Obat.hasMany(PrediksiKebutuhan, { foreignKey: 'obat_id', as: 'prediksi' });
PrediksiKebutuhan.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });
FasilitasKesehatan.hasMany(PrediksiKebutuhan, { foreignKey: 'faskes_id', as: 'prediksi' });
PrediksiKebutuhan.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });

// ── MIS: SuratPesanan ─────────────────────────────────────────────────────────
FasilitasKesehatan.hasMany(SuratPesanan, { foreignKey: 'faskes_id', as: 'surat_pesanan' });
SuratPesanan.belongsTo(FasilitasKesehatan, { foreignKey: 'faskes_id', as: 'faskes' });
Pbf.hasMany(SuratPesanan, { foreignKey: 'pbf_id', as: 'surat_pesanan' });
SuratPesanan.belongsTo(Pbf, { foreignKey: 'pbf_id', as: 'pbf' });
Pengguna.hasMany(SuratPesanan, { foreignKey: 'dibuat_oleh', as: 'surat_pesanan_dibuat' });
SuratPesanan.belongsTo(Pengguna, { foreignKey: 'dibuat_oleh', as: 'pembuat' });
AlertEws.hasMany(SuratPesanan, { foreignKey: 'alert_id', as: 'surat_pesanan' });
SuratPesanan.belongsTo(AlertEws, { foreignKey: 'alert_id', as: 'alert' });

SuratPesanan.hasMany(SpItem, { foreignKey: 'sp_id', as: 'items', onDelete: 'CASCADE' });
SpItem.belongsTo(SuratPesanan, { foreignKey: 'sp_id', as: 'surat_pesanan' });
Obat.hasMany(SpItem, { foreignKey: 'obat_id', as: 'sp_items' });
SpItem.belongsTo(Obat, { foreignKey: 'obat_id', as: 'obat' });

export {
  sequelize,
  RekamMedis,
  Wilayah,
  FasilitasKesehatan,
  Pengguna,
  Obat,
  Pbf,
  FormulaRacikan,
  FormulaKomponen,
  Resep,
  ResepItem,
  Stok,
  PergerakanStok,
  AlertEws,
  PrediksiKebutuhan,
  SuratPesanan,
  SpItem,
};
