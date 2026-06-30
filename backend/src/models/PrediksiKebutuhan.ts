import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class PrediksiKebutuhan extends Model {
  declare id: string;
  declare obat_id: string;
  declare faskes_id: string;
  declare periode: string;
  declare jumlah_prediksi: number;
  declare akurasi: number | null;
  declare dihitung_pada: Date;
}

PrediksiKebutuhan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    obat_id: { type: DataTypes.UUID, allowNull: false },
    faskes_id: { type: DataTypes.UUID, allowNull: false },
    periode: { type: DataTypes.STRING(20), allowNull: false },
    jumlah_prediksi: { type: DataTypes.INTEGER, allowNull: false },
    akurasi: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    dihitung_pada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'prediksi_kebutuhan',
    timestamps: false,
  }
);

export default PrediksiKebutuhan;
