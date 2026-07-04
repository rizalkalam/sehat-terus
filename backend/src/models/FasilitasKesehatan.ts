import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class FasilitasKesehatan extends Model {
  declare id: string;
  declare nama: string;
  declare tipe: 'klinik' | 'apotek' | 'rumah_sakit';
  declare wilayah_id: string | null;
  declare lat: number | null;
  declare long: number | null;
  declare alamat: string | null;
  declare readonly created_at: Date;
}

FasilitasKesehatan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nama: { type: DataTypes.STRING(150), allowNull: false },
    tipe: { type: DataTypes.ENUM('klinik', 'apotek', 'rumah_sakit'), allowNull: false },
    wilayah_id: { type: DataTypes.UUID, allowNull: true },
    lat: { type: DataTypes.DOUBLE, allowNull: true },
    long: { type: DataTypes.DOUBLE, allowNull: true },
    alamat: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'fasilitas_kesehatan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default FasilitasKesehatan;
