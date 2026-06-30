import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Resep extends Model {
  declare id: string;
  declare rekam_medis_id: string;
  declare dibuat_oleh: string | null;
  declare tanggal: Date;
}

Resep.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    rekam_medis_id: { type: DataTypes.UUID, allowNull: false },
    dibuat_oleh: { type: DataTypes.UUID, allowNull: true },
    tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'resep',
    timestamps: false,
  }
);

export default Resep;
