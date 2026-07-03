import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Wilayah extends Model {
  declare id: string;
  declare kode_kecamatan: string;
  declare nama_kecamatan: string;
  declare kabupaten: string;
  declare provinsi: string;
  declare geojson_id: string | null;
  declare readonly created_at: Date;
}

Wilayah.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kode_kecamatan: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama_kecamatan: { type: DataTypes.STRING(100), allowNull: false },
    kabupaten: { type: DataTypes.STRING(100), allowNull: false },
    provinsi: { type: DataTypes.STRING(100), allowNull: false },
    geojson_id: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    sequelize,
    tableName: 'wilayah',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Wilayah;
