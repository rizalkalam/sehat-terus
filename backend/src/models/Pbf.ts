import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Pbf extends Model {
  declare id: string;
  declare nama: string;
  declare alamat: string | null;
  declare kontak: string | null;
  declare nomor_izin: string | null;
  declare readonly created_at: Date;
}

Pbf.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nama: { type: DataTypes.STRING(150), allowNull: false },
    alamat: { type: DataTypes.TEXT, allowNull: true },
    kontak: { type: DataTypes.STRING(100), allowNull: true },
    nomor_izin: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    sequelize,
    tableName: 'pbf',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Pbf;
