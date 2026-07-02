import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root .env or backend local .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config(); // fallback

import { sequelize, RekamMedis, FasilitasKesehatan, Pengguna } from './models';
import { faker } from '@faker-js/faker';

const KECAMATAN_LIST = [
  'Turi', 'Pakem', 'Cangkringan', 'Tempel', 'Sleman', 'Ngaglik',
  'Ngemplak', 'Minggir', 'Seyegan', 'Mlati', 'Moyudan', 'Godean',
  'Gamping', 'Depok', 'Kalasan', 'Berbah', 'Prambanan'
];

// Common diseases (high probability)
const COMMON_DISEASES = [
  { code: 'J06.9', name: 'Infeksi Saluran Pernafasan Akut (ISPA)', weight: 0.40 },
  { code: 'J11', name: 'Influenza / Flu', weight: 0.25 },
  { code: 'A09', name: 'Diare & Gastroenteritis', weight: 0.15 },
  { code: 'A90', name: 'Demam Berdarah Dengue (DBD)', weight: 0.13 },
  { code: 'I10', name: 'Hipertensi / Darah Tinggi', weight: 0.07 }
];

// Rare and dangerous diseases for tracking single occurrences (very low probability)
const RARE_DISEASES = [
  { code: 'A27.9', name: 'Leptospirosis' },
  { code: 'B05', name: 'Campak (Measles)' },
  { code: 'A36', name: 'Difteri' },
  { code: 'A80', name: 'Poliomielitis Akut (Polio)' },
  { code: 'J09', name: 'Flu Burung (Avian Influenza)' }
];

function getRandomDisease(): { code: string; name: string } {
  // 99.7% chance of a common disease, 0.3% chance of a rare disease
  const isRare = Math.random() < 0.003;
  
  if (isRare) {
    const index = Math.floor(Math.random() * RARE_DISEASES.length);
    return RARE_DISEASES[index];
  }

  // Weighted select for common diseases
  const r = Math.random();
  let cumulativeWeight = 0;
  for (const disease of COMMON_DISEASES) {
    cumulativeWeight += disease.weight;
    if (r <= cumulativeWeight) {
      return disease;
    }
  }
  return COMMON_DISEASES[0]; // fallback
}

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database (creates table if not exists)
    await sequelize.sync();
    console.log('Database tables synced.');

    // Fetch existing faskes and users
    const faskesList = await FasilitasKesehatan.findAll();
    const penggunaList = await Pengguna.findAll();
    if (faskesList.length === 0 || penggunaList.length === 0) {
      throw new Error('FasilitasKesehatan atau Pengguna kosong. Jalankan npm run seed:all terlebih dahulu!');
    }

    // Clear existing rekam medis records
    console.log('Clearing existing medical records...');
    await RekamMedis.destroy({ where: {}, truncate: true, cascade: true });
    console.log('Table cleared.');

    const totalRecords = 5500; // Seed 5,500 records to ensure we exceed 5,000 must-have threshold
    const records = [];
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const today = new Date();

    console.log(`Generating ${totalRecords} mock clinical records...`);

    for (let i = 0; i < totalRecords; i++) {
      const disease = getRandomDisease();
      const randomDate = faker.date.between({ from: twoYearsAgo, to: today });
      const randomKecamatan = KECAMATAN_LIST[Math.floor(Math.random() * KECAMATAN_LIST.length)];
      const randomFaskes = faskesList[Math.floor(Math.random() * faskesList.length)];
      const randomPengguna = penggunaList[Math.floor(Math.random() * penggunaList.length)];

      records.push({
        id: faker.string.uuid(),
        tanggal_kunjungan: randomDate,
        kode_icd10: disease.code,
        nama_penyakit: disease.name,
        kecamatan_domisili: randomKecamatan,
        faskes_id: randomFaskes.id,
        dicatat_oleh: randomPengguna.id,
      });
    }

    // Insert in chunks of 1000 for safety and performance
    const chunkSize = 1000;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await RekamMedis.bulkCreate(chunk);
      console.log(`Inserted records ${i + 1} to ${Math.min(i + chunkSize, records.length)}...`);
    }

    console.log(`SUCCESS: Successfully seeded ${records.length} clinical records!`);
    
    // Verify count
    const count = await RekamMedis.count();
    console.log(`Verified record count in database: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('FAIL: Seeding database failed:', error);
    process.exit(1);
  }
}

seed();
