import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { sequelize, RekamMedis, FasilitasKesehatan, Pengguna } from './models';

// Skenario demo: lonjakan kasus flu (pergantian musim) di kecamatan Pakem.
// Dirancang supaya kena DUA mekanisme rekomendasi yang jalan independen dengan jendela
// waktu beda (perlu naik BERTAHAP selama >2 minggu, bukan cuma 1 minggu, biar keduanya kena):
//
// 1. EWS Z-score (alerts.ts, detectAnomalies) — jendela harian, rolling 7 hari terakhir vs
//    baseline 28 hari sebelumnya. ZSCORE_THRESHOLD=2, MIN_KASUS_RECENT=5.
// 2. Forecasting mingguan (forecasting.ts, getForecastingAlerts) — Holt's linear trend per
//    MINGGU KALENDER PENUH (minggu berjalan dikeluarkan dari fit, lihat ADR-011). Kalau cuma
//    1 minggu terakhir yang tinggi lalu berhenti, Holt membaca itu sebagai penyimpangan yang
//    akan mereda (forecast turun) — TIDAK muncul di /proyeksi-tren. Perlu tren naik across
//    2+ minggu penuh berturut-turut supaya trend component-nya positif.
//
// Struktur (relatif ke hari ini):
//   Baseline sporadis  : hari -60 s/d -18, 1 kasus tiap ~4 hari  (rendah & stabil)
//   Ramp-up            : hari -17 s/d -8,  2 kasus/hari          (mulai naik)
//   Puncak             : hari -7  s/d 0,   5 kasus/hari          (lonjakan, juga jadi jendela
//                                                                  7-hari EWS)
// Sudah diverifikasi live: EWS z-score ~9 (jauh di atas threshold 2), dan forecasting/alerts
// menampilkan Influenza/Flu di top rising + rekomendasi_obat.

const KECAMATAN = 'Pakem';
const KODE_ICD10 = 'J11';
const NAMA_PENYAKIT = 'Influenza / Flu';

function dayOffset(daysAgo: number, hour: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function seedFluSpike() {
  console.log('=== Seeding lonjakan kasus flu (demo EWS + forecasting) ===');
  await sequelize.authenticate();

  const faskes = await FasilitasKesehatan.findOne({ where: { nama: 'Klinik Sehat Terus Sleman' } });
  const pencatat = await Pengguna.findOne({ where: { email: 'apoteker@sehatterus.id' } });
  if (!faskes || !pencatat) {
    throw new Error('Faskes/pengguna referensi tidak ditemukan — jalankan `npm run seed:auth` atau `npm run seed:all` dulu.');
  }

  // Idempotent: hapus dulu data demo lama (kalau script ini pernah dijalankan sebelumnya)
  // supaya bisa di-re-run beberapa kali menjelang hari-H tanpa data dobel/basi.
  const deleted = await RekamMedis.destroy({ where: { kecamatan_domisili: KECAMATAN, kode_icd10: KODE_ICD10 } });
  if (deleted > 0) console.log(`Hapus ${deleted} baris demo lama dulu (re-seed bersih).`);

  const rows: any[] = [];
  let totalBaseline = 0, totalRampUp = 0, totalPuncak = 0;

  // Baseline sporadis: hari -60 s/d -18, 1 kasus tiap 4 hari
  for (let d = 60; d >= 18; d -= 4) {
    rows.push({ tanggal_kunjungan: dayOffset(d, 9), kode_icd10: KODE_ICD10, nama_penyakit: NAMA_PENYAKIT, kecamatan_domisili: KECAMATAN, faskes_id: faskes.id, dicatat_oleh: pencatat.id });
    totalBaseline++;
  }

  // Ramp-up: hari -17 s/d -8, 2 kasus/hari
  for (let d = 17; d >= 8; d--) {
    for (let i = 0; i < 2; i++) {
      rows.push({ tanggal_kunjungan: dayOffset(d, 8 + i * 4), kode_icd10: KODE_ICD10, nama_penyakit: NAMA_PENYAKIT, kecamatan_domisili: KECAMATAN, faskes_id: faskes.id, dicatat_oleh: pencatat.id });
      totalRampUp++;
    }
  }

  // Puncak: hari -7 s/d 0, 5 kasus/hari (juga jendela 7-hari EWS)
  for (let d = 7; d >= 0; d--) {
    for (let i = 0; i < 5; i++) {
      rows.push({ tanggal_kunjungan: dayOffset(d, 6 + i * 3), kode_icd10: KODE_ICD10, nama_penyakit: NAMA_PENYAKIT, kecamatan_domisili: KECAMATAN, faskes_id: faskes.id, dicatat_oleh: pencatat.id });
      totalPuncak++;
    }
  }

  await RekamMedis.bulkCreate(rows);
  console.log(`Selesai: ${totalBaseline} kasus baseline + ${totalRampUp} kasus ramp-up + ${totalPuncak} kasus puncak = ${rows.length} baris.`);
  console.log(`Kecamatan: ${KECAMATAN}, Penyakit: ${NAMA_PENYAKIT} (${KODE_ICD10})`);
  console.log('\nLangkah selanjutnya:');
  console.log('1. POST /api/alerts/detect (login dulu, lalu panggil lewat Swagger/curl) -> alert Pakem/Influenza muncul');
  console.log('2. Cek /peringatan-dini -> alert baru untuk Pakem harus muncul (level kritis)');
  console.log('3. Cek /proyeksi-tren -> pilih dropdown "Influenza / Flu", dan kartu rekomendasi obat harus ikut muncul');

  process.exit(0);
}

seedFluSpike().catch((err) => {
  console.error('Gagal seed:', err);
  process.exit(1);
});
