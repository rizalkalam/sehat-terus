import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class FormulaRacikan extends Model {
  declare id: string;
  declare nama_racikan: string;
  declare deskripsi: string | null;
  declare readonly created_at: Date;
}

FormulaRacikan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nama_racikan: { type: DataTypes.STRING(200), allowNull: false },
    deskripsi: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'formula_racikan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default FormulaRacikan;
