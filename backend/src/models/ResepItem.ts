import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class ResepItem extends Model {
  declare id: string;
  declare resep_id: string;
  declare obat_id: string | null;
  declare formula_id: string | null;
  declare jumlah: number;
}

ResepItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    resep_id: { type: DataTypes.UUID, allowNull: false },
    obat_id: { type: DataTypes.UUID, allowNull: true },
    formula_id: { type: DataTypes.UUID, allowNull: true },
    jumlah: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'resep_item',
    timestamps: false,
  }
);

export default ResepItem;
