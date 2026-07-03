import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class FormulaKomponen extends Model {
  declare id: string;
  declare formula_id: string;
  declare obat_id: string;
  declare takaran: number;
  declare satuan: string;
}

FormulaKomponen.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    formula_id: { type: DataTypes.UUID, allowNull: false },
    obat_id: { type: DataTypes.UUID, allowNull: false },
    takaran: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    satuan: { type: DataTypes.STRING(30), allowNull: false },
  },
  {
    sequelize,
    tableName: 'formula_komponen',
    timestamps: false,
  }
);

export default FormulaKomponen;
