import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class RekamMedis extends Model {
  declare id: string;
  declare tanggal_kunjungan: Date;
  declare kode_icd10: string;
  declare nama_penyakit: string;
  declare kecamatan_domisili: string;
  declare faskes_id: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RekamMedis.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tanggal_kunjungan: { type: DataTypes.DATE, allowNull: false },
    kode_icd10: { type: DataTypes.STRING, allowNull: false },
    nama_penyakit: { type: DataTypes.STRING, allowNull: false },
    kecamatan_domisili: { type: DataTypes.STRING, allowNull: false },
    faskes_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: 'RekamMedis',
    indexes: [
      { name: 'idx_rekam_medis_tanggal_kunjungan', fields: ['tanggal_kunjungan'], using: 'BTREE' },
      { name: 'idx_rekam_medis_kecamatan_domisili', fields: ['kecamatan_domisili'], using: 'BTREE' },
      { name: 'idx_rekam_medis_kode_icd10', fields: ['kode_icd10'], using: 'BTREE' },
    ],
  }
);

export default RekamMedis;
