import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type JenisObat = 'obat_jadi' | 'bahan_baku';
export type GolonganObat = 'reguler' | 'npp';

export class Obat extends Model {
  declare id: string;
  declare nama: string;
  declare jenis: JenisObat;
  declare golongan: GolonganObat;
  declare satuan: string;
  declare harga_beli: number;
  declare stok_minimum: number;
  declare kode_atc: string | null;
  declare pbf_id: string | null;
  declare readonly created_at: Date;
}

Obat.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nama: { type: DataTypes.STRING(200), allowNull: false },
    jenis: { type: DataTypes.ENUM('obat_jadi', 'bahan_baku'), allowNull: false },
    golongan: { type: DataTypes.ENUM('reguler', 'npp'), allowNull: false, defaultValue: 'reguler' },
    satuan: { type: DataTypes.STRING(30), allowNull: false },
    harga_beli: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    stok_minimum: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    kode_atc: { type: DataTypes.STRING(20), allowNull: true },
    pbf_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: 'obat',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Obat;
