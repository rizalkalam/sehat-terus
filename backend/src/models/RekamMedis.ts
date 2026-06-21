import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class RekamMedis extends Model {
  public id!: string;
  public tanggal_kunjungan!: Date;
  public kode_icd10!: string;
  public nama_penyakit!: string;
  public kecamatan_domisili!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RekamMedis.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tanggal_kunjungan: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    kode_icd10: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_penyakit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kecamatan_domisili: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'RekamMedis',
    indexes: [
      {
        name: 'idx_rekam_medis_tanggal_kunjungan',
        fields: ['tanggal_kunjungan'],
        using: 'BTREE',
      },
      {
        name: 'idx_rekam_medis_kecamatan_domisili',
        fields: ['kecamatan_domisili'],
        using: 'BTREE',
      },
    ],
  }
);

export default RekamMedis;
