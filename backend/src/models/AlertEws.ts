import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type StatusAlert = 'aktif' | 'ditangani' | 'selesai';

export class AlertEws extends Model {
  declare id: string;
  declare faskes_id: string | null;
  declare kecamatan: string;
  declare jenis_penyakit: string;
  declare kode_icd10: string | null;
  declare persen_lonjakan: number;
  declare laju_harian: number | null;
  declare jumlah_kasus: number | null;
  declare obat_terdampak_id: string | null;
  declare ketahanan_stok_jam: number | null;
  declare status: StatusAlert;
  declare terdeteksi_pada: Date;
  declare ditangani_pada: Date | null;
  declare ditangani_oleh: string | null;
}

AlertEws.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    faskes_id: { type: DataTypes.UUID, allowNull: true },
    kecamatan: { type: DataTypes.STRING(100), allowNull: false },
    jenis_penyakit: { type: DataTypes.STRING(200), allowNull: false },
    kode_icd10: { type: DataTypes.STRING(10), allowNull: true },
    persen_lonjakan: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
    laju_harian: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    jumlah_kasus: { type: DataTypes.INTEGER, allowNull: true },
    obat_terdampak_id: { type: DataTypes.UUID, allowNull: true },
    ketahanan_stok_jam: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('aktif', 'ditangani', 'selesai'),
      allowNull: false,
      defaultValue: 'aktif',
    },
    terdeteksi_pada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ditangani_pada: { type: DataTypes.DATE, allowNull: true },
    ditangani_oleh: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: 'alert_ews',
    timestamps: false,
    indexes: [{ name: 'idx_alert_status', fields: ['status'] }],
  }
);

export default AlertEws;
