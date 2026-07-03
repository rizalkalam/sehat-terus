import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type JenisSp = 'reguler' | 'npp' | 'darurat';
export type StatusSp = 'draf' | 'disetujui' | 'dikirim' | 'diterima' | 'batal';

export class SuratPesanan extends Model {
  declare id: string;
  declare faskes_id: string;
  declare pbf_id: string;
  declare jenis: JenisSp;
  declare status: StatusSp;
  declare dibuat_oleh: string | null;
  declare alert_id: string | null;
  declare dibuat_pada: Date;
}

SuratPesanan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    faskes_id: { type: DataTypes.UUID, allowNull: false },
    pbf_id: { type: DataTypes.UUID, allowNull: false },
    jenis: {
      type: DataTypes.ENUM('reguler', 'npp', 'darurat'),
      allowNull: false,
      defaultValue: 'reguler',
    },
    status: {
      type: DataTypes.ENUM('draf', 'disetujui', 'dikirim', 'diterima', 'batal'),
      allowNull: false,
      defaultValue: 'draf',
    },
    dibuat_oleh: { type: DataTypes.UUID, allowNull: true },
    alert_id: { type: DataTypes.UUID, allowNull: true },
    dibuat_pada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'surat_pesanan',
    timestamps: false,
  }
);

export default SuratPesanan;
