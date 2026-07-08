import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import {
  sequelize,
  FasilitasKesehatan,
  Pengguna,
  Wilayah,
  Obat,
  Pbf
} from './models';

// Sama dengan WILAYAH_SLEMAN di seedAll.ts — jaga konsisten kode_kecamatan & nama
const WILAYAH_SEED = [
  { kode: 'SLM-01', nama: 'Turi' },
  { kode: 'SLM-02', nama: 'Pakem' },
  { kode: 'SLM-03', nama: 'Cangkringan' },
  { kode: 'SLM-04', nama: 'Tempel' },
  { kode: 'SLM-05', nama: 'Sleman' },
  { kode: 'SLM-06', nama: 'Ngaglik' },
  { kode: 'SLM-07', nama: 'Ngemplak' },
  { kode: 'SLM-08', nama: 'Minggir' },
  { kode: 'SLM-09', nama: 'Seyegan' },
  { kode: 'SLM-10', nama: 'Mlati' },
  { kode: 'SLM-11', nama: 'Moyudan' },
  { kode: 'SLM-12', nama: 'Godean' },
  { kode: 'SLM-13', nama: 'Gamping' },
  { kode: 'SLM-14', nama: 'Depok' },
  { kode: 'SLM-15', nama: 'Kalasan' },
  { kode: 'SLM-16', nama: 'Berbah' },
  { kode: 'SLM-17', nama: 'Prambanan' },
];

const PBF_SEED = [
  { nama: 'PT Kimia Farma Trading & Distribution', alamat: 'Jl. Veteran No. 9, Jakarta Pusat', kontak: '021-3847123', nomor_izin: 'PBF-2024-001' },
  { nama: 'PT Rajawali Nusindo', alamat: 'Jl. Denpasar No. 8, Jakarta Selatan', kontak: '021-5201234', nomor_izin: 'PBF-2024-002' },
  { nama: 'PT Enseval Putera Megatrading', alamat: 'Jl. Pulo Lentut No. 10, Jakarta Timur', kontak: '021-4604500', nomor_izin: 'PBF-2024-003' },
];

// Setiap obat mereferensikan PBF_SEED lewat index (null = belum ada pemasok)
const OBAT_SEED = [
  { nama: 'Paracetamol 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 5000, stok_minimum: 50, kode_atc: 'N02BE01', pbf_index: 0 },
  { nama: 'Amoxicillin 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 15000, stok_minimum: 30, kode_atc: 'J01CA04', pbf_index: 0 },
  { nama: 'Oralit Sachet', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'sachet', harga_beli: 2000, stok_minimum: 100, kode_atc: 'A07CA', pbf_index: 1 },
  { nama: 'Ibuprofen 400mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 8000, stok_minimum: 40, kode_atc: 'M01AE01', pbf_index: 1 },
  { nama: 'Chlorpheniramine (CTM) 4mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 3000, stok_minimum: 50, kode_atc: 'R06AB04', pbf_index: 1 },
  { nama: 'Dexamethasone 0.5mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 4500, stok_minimum: 20, kode_atc: 'H02AB02', pbf_index: 2 },
  { nama: 'Antasida DOEN Tablet', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 3500, stok_minimum: 30, kode_atc: 'A02AX', pbf_index: 2 },
  { nama: 'Vitamin C 250mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 4000, stok_minimum: 60, kode_atc: 'A11GA01', pbf_index: 0 },
  { nama: 'Cetirizine 10mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 12000, stok_minimum: 25, kode_atc: 'R06AE07', pbf_index: 0 },
  { nama: 'Amlodipine 5mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 18000, stok_minimum: 20, kode_atc: 'C08CA01', pbf_index: 1 },
  { nama: 'Metformin 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 6000, stok_minimum: 30, kode_atc: 'A10BA02', pbf_index: 1 },
  { nama: 'Codein 10mg', jenis: 'obat_jadi' as const, golongan: 'npp' as const, satuan: 'strip', harga_beli: 25000, stok_minimum: 10, kode_atc: 'R05DA04', pbf_index: 2 },
  { nama: 'Talkum Venetum', jenis: 'bahan_baku' as const, golongan: 'reguler' as const, satuan: 'gram', harga_beli: 500, stok_minimum: 500, kode_atc: null, pbf_index: 2 },
  { nama: 'Asam Salisilat Serbuk', jenis: 'bahan_baku' as const, golongan: 'reguler' as const, satuan: 'gram', harga_beli: 1200, stok_minimum: 200, kode_atc: null, pbf_index: 2 },
];

const FASKES_SEED = [
  {
    nama: 'Klinik Sehat Terus Sleman',
    tipe: 'klinik' as const,
    alamat: 'Jl. Kaliurang Km. 7, Sleman, D.I. Yogyakarta',
    wilayah_nama: 'Sleman',
    lat: -7.7167,
    long: 110.3667,
  },
  {
    nama: 'Apotek Sehat Terus Depok',
    tipe: 'apotek' as const,
    alamat: 'Jl. Seturan Raya No. 12, Depok, Sleman',
    wilayah_nama: 'Depok',
    lat: -7.7700,
    long: 110.3900,
  },
];

const USERS_SEED = [
  {
    nama: 'Carmenita',
    email: 'carmen@sehatterus.id',
    password: 'sehat123',
    peran: 'manajer' as const,
    faskes_index: 0,
    telepon: '+62 813-2345-6789',
    alamat: 'Jl. Kaliurang Km. 8, Sleman, D.I. Yogyakarta',
  },
  {
    nama: 'Administrator',
    email: 'admin@sehatterus.id',
    password: 'admin123',
    peran: 'admin' as const,
    faskes_index: null,
  },
  {
    nama: 'Apoteker Sleman',
    email: 'apoteker@sehatterus.id',
    password: 'apoteker123',
    peran: 'apoteker' as const,
    faskes_index: 0,
    nomor_sipa: 'SIPA-2026-001',
    telepon: '+62 821-9876-5432',
    alamat: 'Jl. Kaliurang Km. 7, Sleman, D.I. Yogyakarta',
  },
  {
    nama: 'Staf Logistik',
    email: 'logistik@sehatterus.id',
    password: 'logistik123',
    peran: 'staf_logistik' as const,
    faskes_index: 1,
    telepon: '+62 856-1122-3344',
    alamat: 'Jl. Seturan Raya No. 12, Depok, Sleman',
  },
];

async function resetDb() {
  console.log('=== Resetting Database (Clearing All Data) ===');

  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Force sync drops all tables and recreates them empty based on current models
    console.log('Dropping and recreating all tables (force sync)...');
    await sequelize.sync({ force: true });
    console.log('All tables dropped and recreated.');

    // Seed Wilayah
    console.log('\nSeeding wilayah...');
    const wilayahMap: Record<string, Wilayah> = {};
    for (const w of WILAYAH_SEED) {
      const wilayah = await Wilayah.create({
        kode_kecamatan: w.kode,
        nama_kecamatan: w.nama,
        kabupaten: 'Sleman',
        provinsi: 'D.I. Yogyakarta',
        geojson_id: w.nama,
      });
      wilayahMap[w.nama] = wilayah;
      console.log(`  CREATED ${wilayah.nama_kecamatan}`);
    }

    // Seed PBF
    console.log('\nSeeding pbf...');
    const createdPbf: Pbf[] = [];
    for (const p of PBF_SEED) {
      const pbf = await Pbf.create(p);
      createdPbf.push(pbf);
      console.log(`  CREATED ${pbf.nama}`);
    }

    // Seed Obat
    console.log('\nSeeding obat...');
    for (const o of OBAT_SEED) {
      const { pbf_index, ...obatFields } = o;
      const obat = await Obat.create({
        ...obatFields,
        pbf_id: pbf_index !== null ? createdPbf[pbf_index].id : null,
      });
      console.log(`  CREATED ${obat.nama}`);
    }

    // Seed FasilitasKesehatan
    console.log('\nSeeding fasilitas_kesehatan...');
    const createdFaskes: FasilitasKesehatan[] = [];
    for (const f of FASKES_SEED) {
      const { wilayah_nama, ...faskesFields } = f;
      const faskes = await FasilitasKesehatan.create({
        ...faskesFields,
        wilayah_id: wilayahMap[wilayah_nama]?.id ?? null,
      });
      createdFaskes.push(faskes);
      console.log(`  CREATED ${faskes.nama}`);
    }

    // Seed Pengguna
    console.log('\nSeeding pengguna...');
    for (const u of USERS_SEED) {
      const password_hash = await bcrypt.hash(u.password, 10);
      const faskes_id = u.faskes_index !== null ? createdFaskes[u.faskes_index].id : null;

      await Pengguna.create({
        nama: u.nama,
        email: u.email,
        password_hash,
        peran: u.peran,
        faskes_id,
        nomor_sipa: (u as { nomor_sipa?: string }).nomor_sipa ?? null,
        telepon: (u as { telepon?: string }).telepon ?? null,
        alamat: (u as { alamat?: string }).alamat ?? null,
        aktif: true,
      });
      console.log(`  CREATED ${u.email} (${u.peran})`);
    }

    console.log('\n=== Database Reset & Auth Seed Complete! ===');
    console.log('Available test accounts:');
    for (const u of USERS_SEED) {
      console.log(`  - ${u.email} / ${u.password} (${u.peran})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Database reset FAILED:', err);
    process.exit(1);
  }
}

resetDb();
