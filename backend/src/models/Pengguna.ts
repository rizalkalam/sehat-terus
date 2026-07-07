import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type PeranPengguna = 'manajer' | 'apoteker' | 'staf_logistik' | 'admin';

export class Pengguna extends Model {
  declare id: string;
  declare nama: string;
  declare email: string;
  declare password_hash: string;
  declare peran: PeranPengguna;
  declare nomor_sipa: string | null;
  declare faskes_id: string | null;
  declare telepon: string | null;
  declare alamat: string | null;
  declare aktif: boolean;
  declare updated_at: Date | null;
  declare readonly created_at: Date;
}

Pengguna.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nama: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    peran: {
      type: DataTypes.ENUM('manajer', 'apoteker', 'staf_logistik', 'admin'),
      allowNull: false,
    },
    nomor_sipa: { type: DataTypes.STRING(50), allowNull: true },
    faskes_id: { type: DataTypes.UUID, allowNull: true },
    telepon: { type: DataTypes.STRING(30), allowNull: true },
    alamat: { type: DataTypes.TEXT, allowNull: true },
    aktif: { type: DataTypes.BOOLEAN, defaultValue: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'pengguna',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { name: 'idx_pengguna_email', unique: true, fields: ['email'] },
    ],
  }
);

export default Pengguna;
