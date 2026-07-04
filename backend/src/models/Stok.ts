import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Stok extends Model {
  declare id: string;
  declare faskes_id: string;
  declare obat_id: string;
  declare jumlah_tersedia: number;
  declare tanggal_kedaluwarsa: Date | null;
  declare batch: string | null;
  declare readonly updated_at: Date;
}

Stok.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    faskes_id: { type: DataTypes.UUID, allowNull: false },
    obat_id: { type: DataTypes.UUID, allowNull: false },
    jumlah_tersedia: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    tanggal_kedaluwarsa: { type: DataTypes.DATEONLY, allowNull: true },
    batch: { type: DataTypes.STRING(60), allowNull: true },
  },
  {
    sequelize,
    tableName: 'stok',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['faskes_id', 'obat_id', 'batch', 'tanggal_kedaluwarsa'],
        name: 'uq_stok_faskes_obat_batch',
      },
    ],
  }
);

export default Stok;
