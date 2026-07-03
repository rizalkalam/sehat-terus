import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type TipePergerakan = 'masuk' | 'keluar' | 'realokasi' | 'penyesuaian';

export class PergerakanStok extends Model {
  declare id: string;
  declare obat_id: string;
  declare faskes_asal: string | null;
  declare faskes_tujuan: string | null;
  declare tipe: TipePergerakan;
  declare jumlah: number;
  declare tanggal: Date;
  declare referensi: string | null;
  declare dicatat_oleh: string | null;
}

PergerakanStok.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    obat_id: { type: DataTypes.UUID, allowNull: false },
    faskes_asal: { type: DataTypes.UUID, allowNull: true },
    faskes_tujuan: { type: DataTypes.UUID, allowNull: true },
    tipe: {
      type: DataTypes.ENUM('masuk', 'keluar', 'realokasi', 'penyesuaian'),
      allowNull: false,
    },
    jumlah: { type: DataTypes.INTEGER, allowNull: false },
    tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    referensi: { type: DataTypes.STRING(100), allowNull: true },
    dicatat_oleh: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: 'pergerakan_stok',
    timestamps: false,
  }
);

export default PergerakanStok;
