import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class SpItem extends Model {
  declare id: string;
  declare sp_id: string;
  declare obat_id: string;
  declare jumlah_usulan: number;
  declare jumlah_disetujui: number | null;
}

SpItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sp_id: { type: DataTypes.UUID, allowNull: false },
    obat_id: { type: DataTypes.UUID, allowNull: false },
    jumlah_usulan: { type: DataTypes.INTEGER, allowNull: false },
    jumlah_disetujui: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'sp_item',
    timestamps: false,
  }
);

export default SpItem;
