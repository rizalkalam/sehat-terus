import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import bcrypt from 'bcryptjs';
import { sequelize, FasilitasKesehatan, Pengguna } from './models';

const FASKES_SEED = [
  {
    nama: 'Klinik Sehat Terus Sleman',
    tipe: 'klinik' as const,
    alamat: 'Jl. Kaliurang Km. 7, Sleman, D.I. Yogyakarta',
  },
  {
    nama: 'Apotek Sehat Terus Depok',
    tipe: 'apotek' as const,
    alamat: 'Jl. Seturan Raya No. 12, Depok, Sleman',
  },
];

const USERS_SEED = [
  {
    nama: 'Carmenita',
    email: 'carmen@sehatterus.id',
    password: 'sehat123',
    peran: 'manajer' as const,
    faskes_index: 0,
  },
  {
    nama: 'Administrator',
    email: 'admin@sehatterus.id',
    password: 'admin123',
    peran: 'admin' as const,
    faskes_index: null, // admin = akses semua cabang
  },
  {
    nama: 'Apoteker Sleman',
    email: 'apoteker@sehatterus.id',
    password: 'apoteker123',
    peran: 'apoteker' as const,
    faskes_index: 0,
    nomor_sipa: 'SIPA-2026-001',
  },
  {
    nama: 'Staf Logistik',
    email: 'logistik@sehatterus.id',
    password: 'logistik123',
    peran: 'staf_logistik' as const,
    faskes_index: 1,
  },
];

async function seedAuth() {
  console.log('=== Seeding Auth Data ===');

  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    // Sync only fasilitas_kesehatan and pengguna tables
    await FasilitasKesehatan.sync({ alter: true });
    await Pengguna.sync({ alter: true });
    console.log('Tables synced.');

    // --- FasilitasKesehatan ---
    console.log('\nSeeding fasilitas_kesehatan...');
    const createdFaskes: FasilitasKesehatan[] = [];

    for (const f of FASKES_SEED) {
      const [faskes, created] = await FasilitasKesehatan.findOrCreate({
        where: { nama: f.nama },
        defaults: f,
      });
      createdFaskes.push(faskes);
      console.log(`  ${created ? 'CREATED' : 'EXISTS '} ${faskes.nama}`);
    }

    // --- Pengguna ---
    console.log('\nSeeding pengguna...');

    for (const u of USERS_SEED) {
      const existing = await Pengguna.findOne({ where: { email: u.email } });
      if (existing) {
        console.log(`  EXISTS  ${u.email}`);
        continue;
      }

      const password_hash = await bcrypt.hash(u.password, 10);
      const faskes_id = u.faskes_index !== null ? createdFaskes[u.faskes_index].id : null;

      await Pengguna.create({
        nama: u.nama,
        email: u.email,
        password_hash,
        peran: u.peran,
        faskes_id,
        nomor_sipa: (u as { nomor_sipa?: string }).nomor_sipa ?? null,
        aktif: true,
      });
      console.log(`  CREATED ${u.email} (${u.peran})`);
    }

    console.log('\n=== Auth seeding complete! ===');
    console.log('\nAkun demo tersedia:');
    for (const u of USERS_SEED) {
      console.log(`  ${u.email} / ${u.password}  (${u.peran})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Auth seeding FAILED:', err);
    process.exit(1);
  }
}

seedAuth();
