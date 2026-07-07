import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import bcrypt from 'bcryptjs';
import {
  sequelize,
  Wilayah, FasilitasKesehatan, Pengguna,
  Obat, Pbf, FormulaRacikan, FormulaKomponen,
  Stok, PergerakanStok,
  AlertEws, PrediksiKebutuhan, SuratPesanan, SpItem,
  RekamMedis,
} from './models';

// ─── Helper ───────────────────────────────────────────────────────────────────
function log(label: string, msg: string) {
  console.log(`  [${label}] ${msg}`);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const WILAYAH_SLEMAN = [
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

const OBAT_LIST = [
  { nama: 'Paracetamol 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 5000, stok_minimum: 50, kode_atc: 'N02BE01' },
  { nama: 'Amoxicillin 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 15000, stok_minimum: 30, kode_atc: 'J01CA04' },
  { nama: 'Oralit Sachet', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'sachet', harga_beli: 2000, stok_minimum: 100, kode_atc: 'A07CA' },
  { nama: 'Ibuprofen 400mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 8000, stok_minimum: 40, kode_atc: 'M01AE01' },
  { nama: 'Chlorpheniramine (CTM) 4mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 3000, stok_minimum: 50, kode_atc: 'R06AB04' },
  { nama: 'Dexamethasone 0.5mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 4500, stok_minimum: 20, kode_atc: 'H02AB02' },
  { nama: 'Antasida DOEN Tablet', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 3500, stok_minimum: 30, kode_atc: 'A02AX' },
  { nama: 'Vitamin C 250mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 4000, stok_minimum: 60, kode_atc: 'A11GA01' },
  { nama: 'Cetirizine 10mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 12000, stok_minimum: 25, kode_atc: 'R06AE07' },
  { nama: 'Amlodipine 5mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 18000, stok_minimum: 20, kode_atc: 'C08CA01' },
  { nama: 'Metformin 500mg', jenis: 'obat_jadi' as const, golongan: 'reguler' as const, satuan: 'strip', harga_beli: 6000, stok_minimum: 30, kode_atc: 'A10BA02' },
  { nama: 'Codein 10mg', jenis: 'obat_jadi' as const, golongan: 'npp' as const, satuan: 'strip', harga_beli: 25000, stok_minimum: 10, kode_atc: 'R05DA04' },
  // Bahan baku racikan
  { nama: 'Talkum Venetum', jenis: 'bahan_baku' as const, golongan: 'reguler' as const, satuan: 'gram', harga_beli: 500, stok_minimum: 500, kode_atc: null },
  { nama: 'Asam Salisilat Serbuk', jenis: 'bahan_baku' as const, golongan: 'reguler' as const, satuan: 'gram', harga_beli: 1200, stok_minimum: 200, kode_atc: null },
];

const PBF_LIST = [
  { nama: 'PT Kimia Farma Trading & Distribution', alamat: 'Jl. Veteran No. 9, Jakarta Pusat', kontak: '021-3847123', nomor_izin: 'PBF-2024-001' },
  { nama: 'PT Rajawali Nusindo', alamat: 'Jl. Denpasar No. 8, Jakarta Selatan', kontak: '021-5201234', nomor_izin: 'PBF-2024-002' },
  { nama: 'PT Enseval Putera Megatrading', alamat: 'Jl. Pulo Lentut No. 10, Jakarta Timur', kontak: '021-4604500', nomor_izin: 'PBF-2024-003' },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────────

async function seedAll() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       SehatTerus — Full DB Seeder        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Sync semua tabel (alter: true agar tidak hapus data existing)
    console.log('▸ Syncing all tables...');
    await sequelize.sync({ alter: true });
    console.log('✓ All tables synced\n');

    // ── 1. WILAYAH ──────────────────────────────────────────────────────────
    console.log('▸ [1/9] Seeding wilayah...');
    const wilayahMap: Record<string, Wilayah> = {};
    for (const w of WILAYAH_SLEMAN) {
      const [rec, created] = await Wilayah.findOrCreate({
        where: { kode_kecamatan: w.kode },
        defaults: {
          kode_kecamatan: w.kode,
          nama_kecamatan: w.nama,
          kabupaten: 'Sleman',
          provinsi: 'D.I. Yogyakarta',
          geojson_id: w.nama,
        },
      });
      wilayahMap[w.nama] = rec;
      log('wilayah', `${created ? 'CREATED' : 'EXISTS '} ${rec.nama_kecamatan}`);
    }

    // ── 2. FASILITAS KESEHATAN ───────────────────────────────────────────────
    console.log('\n▸ [2/9] Seeding fasilitas_kesehatan...');
    const faskesData = [
      { nama: 'Klinik Sehat Terus Sleman', tipe: 'klinik' as const, wilayah_nama: 'Sleman', lat: -7.7167, long: 110.3667, alamat: 'Jl. Kaliurang Km. 7, Sleman, D.I. Yogyakarta' },
      { nama: 'Apotek Sehat Terus Depok', tipe: 'apotek' as const, wilayah_nama: 'Depok', lat: -7.7700, long: 110.3900, alamat: 'Jl. Seturan Raya No. 12, Depok, Sleman' },
    ];
    const faskesMap: Record<string, FasilitasKesehatan> = {};
    for (const f of faskesData) {
      const wilayah = wilayahMap[f.wilayah_nama];
      const [rec, created] = await FasilitasKesehatan.findOrCreate({
        where: { nama: f.nama },
        defaults: { nama: f.nama, tipe: f.tipe, wilayah_id: wilayah?.id ?? null, lat: f.lat, long: f.long, alamat: f.alamat },
      });
      faskesMap[f.nama] = rec;
      log('faskes', `${created ? 'CREATED' : 'EXISTS '} ${rec.nama}`);
    }
    const faskes1 = faskesMap['Klinik Sehat Terus Sleman'];
    const faskes2 = faskesMap['Apotek Sehat Terus Depok'];

    // ── 3. PENGGUNA ──────────────────────────────────────────────────────────
    console.log('\n▸ [3/9] Seeding pengguna...');
    const penggunaData = [
      { nama: 'Carmenita', email: 'carmen@sehatterus.id', password: 'sehat123', peran: 'manajer' as const, faskes: faskes1 },
      { nama: 'Administrator', email: 'admin@sehatterus.id', password: 'admin123', peran: 'admin' as const, faskes: null },
      { nama: 'Apoteker Sleman', email: 'apoteker@sehatterus.id', password: 'apoteker123', peran: 'apoteker' as const, faskes: faskes1, nomor_sipa: 'SIPA-2026-001' },
      { nama: 'Staf Logistik Depok', email: 'logistik@sehatterus.id', password: 'logistik123', peran: 'staf_logistik' as const, faskes: faskes2 },
    ];
    const penggunaMap: Record<string, Pengguna> = {};
    for (const u of penggunaData) {
      const exists = await Pengguna.findOne({ where: { email: u.email } });
      if (exists) {
        exists.faskes_id = u.faskes?.id ?? null;
        exists.nomor_sipa = (u as { nomor_sipa?: string }).nomor_sipa ?? null;
        exists.peran = u.peran;
        await exists.save();
        penggunaMap[u.email] = exists;
        log('pengguna', `UPDATED ${u.email} (${u.peran})`);
        continue;
      }
      const password_hash = await bcrypt.hash(u.password, 10);
      const rec = await Pengguna.create({
        nama: u.nama, email: u.email, password_hash,
        peran: u.peran, faskes_id: u.faskes?.id ?? null,
        nomor_sipa: (u as { nomor_sipa?: string }).nomor_sipa ?? null,
        aktif: true,
      });
      penggunaMap[u.email] = rec;
      log('pengguna', `CREATED ${u.email} (${u.peran})`);
    }

    // ── 4. OBAT ──────────────────────────────────────────────────────────────
    console.log('\n▸ [4/9] Seeding obat...');
    const obatMap: Record<string, Obat> = {};
    for (const o of OBAT_LIST) {
      const [rec, created] = await Obat.findOrCreate({
        where: { nama: o.nama },
        defaults: o,
      });
      obatMap[o.nama] = rec;
      log('obat', `${created ? 'CREATED' : 'EXISTS '} ${rec.nama} (${rec.golongan})`);
    }

    // ── 5. PBF ───────────────────────────────────────────────────────────────
    console.log('\n▸ [5/9] Seeding pbf...');
    const pbfMap: Record<string, Pbf> = {};
    for (const p of PBF_LIST) {
      const [rec, created] = await Pbf.findOrCreate({
        where: { nama: p.nama },
        defaults: p,
      });
      pbfMap[p.nama] = rec;
      log('pbf', `${created ? 'CREATED' : 'EXISTS '} ${rec.nama}`);
    }

    // ── 5.5. OBAT → PBF (pemasok utama, round-robin) ────────────────────────
    // Skema tidak punya kolom ini sebelumnya — obat.pbf_id ditambahkan khusus untuk
    // Phase 9 (defekta perlu dikelompokkan per PBF). Lihat DECISIONS.md ADR-012.
    const pbfList = Object.values(pbfMap);
    let obatPbfAssigned = 0;
    const obatEntries = Object.values(obatMap);
    for (let i = 0; i < obatEntries.length; i++) {
      const obat = obatEntries[i];
      if (!obat.pbf_id) {
        await obat.update({ pbf_id: pbfList[i % pbfList.length].id });
        obatPbfAssigned++;
      }
    }
    log('obat', `${obatPbfAssigned} obat di-assign ke PBF (round-robin), ${obatEntries.length - obatPbfAssigned} sudah punya pbf_id`);

    // ── 6. FORMULA RACIKAN ───────────────────────────────────────────────────
    console.log('\n▸ [6/9] Seeding formula_racikan...');
    const paracetamol = obatMap['Paracetamol 500mg'];
    const ctm = obatMap['Chlorpheniramine (CTM) 4mg'];
    const talkum = obatMap['Talkum Venetum'];
    const salisilat = obatMap['Asam Salisilat Serbuk'];

    const formulaData = [
      { nama_racikan: 'Puyer Demam Anak', deskripsi: 'Kombinasi paracetamol dan CTM untuk demam dengan gejala alergi' },
      { nama_racikan: 'Salep Antijamur', deskripsi: 'Talkum dengan asam salisilat untuk infeksi jamur ringan' },
    ];
    const formulaKomponenData: { formula_nama: string; obat: Obat; takaran: number; satuan: string }[] = [
      { formula_nama: 'Puyer Demam Anak', obat: paracetamol, takaran: 0.5, satuan: 'tablet' },
      { formula_nama: 'Puyer Demam Anak', obat: ctm, takaran: 0.25, satuan: 'tablet' },
      { formula_nama: 'Salep Antijamur', obat: talkum, takaran: 5, satuan: 'gram' },
      { formula_nama: 'Salep Antijamur', obat: salisilat, takaran: 0.5, satuan: 'gram' },
    ];

    const formulaMap: Record<string, FormulaRacikan> = {};
    for (const f of formulaData) {
      const [rec, created] = await FormulaRacikan.findOrCreate({
        where: { nama_racikan: f.nama_racikan },
        defaults: f,
      });
      formulaMap[f.nama_racikan] = rec;
      log('formula', `${created ? 'CREATED' : 'EXISTS '} ${rec.nama_racikan}`);
      if (created) {
        const komps = formulaKomponenData.filter(k => k.formula_nama === f.nama_racikan);
        for (const k of komps) {
          await FormulaKomponen.create({ formula_id: rec.id, obat_id: k.obat.id, takaran: k.takaran, satuan: k.satuan });
        }
        log('formula', `  └─ ${komps.length} komponen ditambahkan`);
      }
    }

    // ── 7. STOK ──────────────────────────────────────────────────────────────
    console.log('\n▸ [7/9] Seeding stok...');
    const stokSeed = [
      // Klinik Sleman
      { faskes: faskes1, obat: obatMap['Paracetamol 500mg'], jumlah: 200, batch: 'PCM-2025-A', exp: '2027-06-30' },
      { faskes: faskes1, obat: obatMap['Amoxicillin 500mg'], jumlah: 80, batch: 'AMX-2025-A', exp: '2027-03-31' },
      { faskes: faskes1, obat: obatMap['Oralit Sachet'], jumlah: 300, batch: 'ORL-2025-A', exp: '2027-12-31' },
      { faskes: faskes1, obat: obatMap['Ibuprofen 400mg'], jumlah: 120, batch: 'IBU-2025-A', exp: '2027-09-30' },
      { faskes: faskes1, obat: obatMap['Chlorpheniramine (CTM) 4mg'], jumlah: 15, batch: 'CTM-2025-A', exp: '2026-08-31' }, // near-minimum
      { faskes: faskes1, obat: obatMap['Dexamethasone 0.5mg'], jumlah: 60, batch: 'DEX-2025-A', exp: '2027-06-30' },
      { faskes: faskes1, obat: obatMap['Vitamin C 250mg'], jumlah: 250, batch: 'VTC-2025-A', exp: '2027-12-31' },
      { faskes: faskes1, obat: obatMap['Codein 10mg'], jumlah: 8, batch: 'COD-2025-A', exp: '2027-06-30' },
      // Apotek Depok
      { faskes: faskes2, obat: obatMap['Paracetamol 500mg'], jumlah: 350, batch: 'PCM-2025-B', exp: '2027-06-30' },
      { faskes: faskes2, obat: obatMap['Cetirizine 10mg'], jumlah: 90, batch: 'CTZ-2025-A', exp: '2027-09-30' },
      { faskes: faskes2, obat: obatMap['Amlodipine 5mg'], jumlah: 60, batch: 'AML-2025-A', exp: '2027-06-30' },
      { faskes: faskes2, obat: obatMap['Metformin 500mg'], jumlah: 5, batch: 'MET-2025-A', exp: '2027-03-31' }, // near-minimum
      { faskes: faskes2, obat: obatMap['Antasida DOEN Tablet'], jumlah: 100, batch: 'ANT-2025-A', exp: '2026-12-31' }, // near-expiry
      { faskes: faskes2, obat: obatMap['Talkum Venetum'], jumlah: 1000, batch: 'TLK-2025-A', exp: '2028-01-01' },
      { faskes: faskes2, obat: obatMap['Asam Salisilat Serbuk'], jumlah: 300, batch: 'SAL-2025-A', exp: '2028-01-01' },
    ];

    let stokCreated = 0;
    for (const s of stokSeed) {
      const existing = await Stok.findOne({
        where: { faskes_id: s.faskes.id, obat_id: s.obat.id, batch: s.batch },
      });
      if (!existing) {
        await Stok.create({
          faskes_id: s.faskes.id, obat_id: s.obat.id,
          jumlah_tersedia: s.jumlah, batch: s.batch,
          tanggal_kedaluwarsa: s.exp,
        });
        stokCreated++;
      }
    }
    log('stok', `${stokCreated} baris baru dibuat (${stokSeed.length - stokCreated} sudah ada)`);

    // Pergerakan stok awal (penerimaan dari PBF)
    const pgCount = await PergerakanStok.count();
    if (pgCount === 0) {
      const apoteker = penggunaMap['apoteker@sehatterus.id'];
      const logistik = penggunaMap['logistik@sehatterus.id'];
      const pergerakanBatch = stokSeed.map(s => ({
        obat_id: s.obat.id,
        faskes_asal: null,
        faskes_tujuan: s.faskes.id,
        tipe: 'masuk' as const,
        jumlah: s.jumlah,
        referensi: `INIT-${s.batch}`,
        dicatat_oleh: s.faskes.id === faskes1.id ? apoteker?.id ?? null : logistik?.id ?? null,
      }));
      await PergerakanStok.bulkCreate(pergerakanBatch);
      log('pergerakan_stok', `${pergerakanBatch.length} pergerakan awal (masuk) dibuat`);
    } else {
      log('pergerakan_stok', `EXISTS  (${pgCount} baris)`);
    }

    // ── 7.5. RIWAYAT PEMAKAIAN (pergerakan_stok tipe 'keluar') ──────────────
    // Sebelum ini, satu-satunya baris 'keluar' nyata berasal dari test-tps.ts —
    // tidak cukup untuk menghitung tren_harian/ketahanan/slow-moving (Phase 9).
    // Ditambahkan di sini sebagai riwayat historis sintetis (bukan transaksi TPS
    // sungguhan), murni untuk memberi sinyal nyata ke fitur defekta/slow-moving.
    // Tidak mengubah Stok.jumlah_tersedia — snapshot stok saat ini tetap dari stokSeed,
    // baris ini cuma riwayat tren. Lihat DECISIONS.md ADR-012.
    const KELUAR_MARKER = 'SEED-KELUAR-HIST';
    const existingHist = await PergerakanStok.count({ where: { referensi: KELUAR_MARKER } });
    if (existingHist === 0) {
      const FAST_MOVERS = ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Oralit Sachet', 'Ibuprofen 400mg'];
      const MEDIUM_MOVERS = ['Dexamethasone 0.5mg', 'Chlorpheniramine (CTM) 4mg', 'Amlodipine 5mg', 'Metformin 500mg'];
      // Semua obat lain (Vitamin C, Antasida, Cetirizine, Codein, bahan baku racikan) sengaja
      // TIDAK diberi pergerakan 'keluar' dalam 45 hari terakhir — itulah kandidat slow-moving asli.

      const apotekerUser = penggunaMap['apoteker@sehatterus.id'];
      const logistikUser = penggunaMap['logistik@sehatterus.id'];
      const histBatch: any[] = [];
      const HARI_RIWAYAT = 45;

      for (const s of stokSeed) {
        const namaObat = s.obat.nama;
        let intervalHari: number | null = null;
        let qtyRange: [number, number] = [1, 1];

        if (FAST_MOVERS.includes(namaObat)) { intervalHari = 2; qtyRange = [2, 6]; }
        else if (MEDIUM_MOVERS.includes(namaObat)) { intervalHari = 5; qtyRange = [1, 3]; }
        else continue; // slow/dead mover — tidak diberi riwayat pergerakan

        for (let hari = HARI_RIWAYAT; hari > 0; hari -= intervalHari) {
          const tanggal = new Date();
          tanggal.setDate(tanggal.getDate() - hari);
          const jumlah = qtyRange[0] + Math.floor(Math.random() * (qtyRange[1] - qtyRange[0] + 1));
          histBatch.push({
            obat_id: s.obat.id,
            faskes_asal: s.faskes.id,
            faskes_tujuan: null,
            tipe: 'keluar' as const,
            jumlah,
            tanggal,
            referensi: KELUAR_MARKER,
            dicatat_oleh: s.faskes.id === faskes1.id ? apotekerUser?.id ?? null : logistikUser?.id ?? null,
          });
        }
      }

      await PergerakanStok.bulkCreate(histBatch);
      log('pergerakan_stok', `${histBatch.length} riwayat 'keluar' sintetis ditambahkan (${HARI_RIWAYAT} hari, fast+medium movers)`);
    } else {
      log('pergerakan_stok', `Riwayat 'keluar' sintetis EXISTS (${existingHist} baris)`);
    }

    // ── 8. ALERT EWS ─────────────────────────────────────────────────────────
    console.log('\n▸ [8/9] Seeding alert_ews...');
    const alertCount = await AlertEws.count();
    if (alertCount === 0) {
      const oratilObat = obatMap['Oralit Sachet'];
      const alertsData = [
        { kecamatan: 'Depok', jenis_penyakit: 'Diare & Gastroenteritis', kode_icd10: 'A09', persen_lonjakan: 187.5, laju_harian: 12.3, jumlah_kasus: 45, obat_terdampak_id: oratilObat.id, ketahanan_stok_jam: 36, status: 'aktif' as const, faskes_id: faskes1.id },
        { kecamatan: 'Ngaglik', jenis_penyakit: 'Demam Berdarah Dengue (DBD)', kode_icd10: 'A90', persen_lonjakan: 125.0, laju_harian: 8.7, jumlah_kasus: 28, obat_terdampak_id: null, ketahanan_stok_jam: null, status: 'aktif' as const, faskes_id: faskes1.id },
        { kecamatan: 'Mlati', jenis_penyakit: 'Infeksi Saluran Pernafasan Akut (ISPA)', kode_icd10: 'J06.9', persen_lonjakan: 210.0, laju_harian: 15.1, jumlah_kasus: 63, obat_terdampak_id: obatMap['Amoxicillin 500mg'].id, ketahanan_stok_jam: 72, status: 'aktif' as const, faskes_id: faskes1.id },
        { kecamatan: 'Gamping', jenis_penyakit: 'Influenza / Flu', kode_icd10: 'J11', persen_lonjakan: 95.0, laju_harian: 6.2, jumlah_kasus: 39, obat_terdampak_id: obatMap['Paracetamol 500mg'].id, ketahanan_stok_jam: 120, status: 'ditangani' as const, faskes_id: faskes2.id, ditangani_pada: new Date() },
        { kecamatan: 'Sleman', jenis_penyakit: 'Leptospirosis', kode_icd10: 'A27.9', persen_lonjakan: 400.0, laju_harian: 33.3, jumlah_kasus: 4, obat_terdampak_id: null, ketahanan_stok_jam: null, status: 'selesai' as const, faskes_id: null, ditangani_pada: new Date(Date.now() - 7 * 86400000) },
      ];
      await AlertEws.bulkCreate(alertsData as Parameters<typeof AlertEws.bulkCreate>[0]);
      log('alert_ews', `${alertsData.length} alert dibuat`);
    } else {
      log('alert_ews', `EXISTS  (${alertCount} alert)`);
    }

    // ── 9. PREDIKSI KEBUTUHAN ────────────────────────────────────────────────
    console.log('\n▸ [9/9] Seeding prediksi_kebutuhan...');
    const predCount = await PrediksiKebutuhan.count();
    if (predCount === 0) {
      const periode = '2026-07';
      const prediksiData = [
        { obat_id: obatMap['Paracetamol 500mg'].id, faskes_id: faskes1.id, periode, jumlah_prediksi: 180, akurasi: 92.5 },
        { obat_id: obatMap['Amoxicillin 500mg'].id, faskes_id: faskes1.id, periode, jumlah_prediksi: 75, akurasi: 88.0 },
        { obat_id: obatMap['Oralit Sachet'].id, faskes_id: faskes1.id, periode, jumlah_prediksi: 220, akurasi: 85.3 },
        { obat_id: obatMap['Paracetamol 500mg'].id, faskes_id: faskes2.id, periode, jumlah_prediksi: 320, akurasi: 90.1 },
        { obat_id: obatMap['Cetirizine 10mg'].id, faskes_id: faskes2.id, periode, jumlah_prediksi: 85, akurasi: 79.4 },
        { obat_id: obatMap['Metformin 500mg'].id, faskes_id: faskes2.id, periode, jumlah_prediksi: 40, akurasi: 94.2 },
      ];
      await PrediksiKebutuhan.bulkCreate(prediksiData);
      log('prediksi_kebutuhan', `${prediksiData.length} prediksi dibuat untuk periode ${periode}`);
    } else {
      log('prediksi_kebutuhan', `EXISTS  (${predCount} prediksi)`);
    }

    // ── Bonus: Surat Pesanan ─────────────────────────────────────────────────
    const spCount = await SuratPesanan.count();
    if (spCount === 0) {
      const apoteker = penggunaMap['apoteker@sehatterus.id'];
      const pbfKimia = pbfMap['PT Kimia Farma Trading & Distribution'];
      const sp = await SuratPesanan.create({
        faskes_id: faskes1.id,
        pbf_id: pbfKimia.id,
        jenis: 'reguler',
        status: 'draf',
        dibuat_oleh: apoteker?.id ?? null,
      });
      await SpItem.bulkCreate([
        { sp_id: sp.id, obat_id: obatMap['Chlorpheniramine (CTM) 4mg'].id, jumlah_usulan: 100 },
        { sp_id: sp.id, obat_id: obatMap['Amoxicillin 500mg'].id, jumlah_usulan: 60 },
      ]);
      log('surat_pesanan', `1 SP draf dibuat dengan 2 item`);
    } else {
      log('surat_pesanan', `EXISTS  (${spCount} SP)`);
    }

    // ── 9.5. REKAM MEDIS (TPS KUNJUNGAN) ──────────────────────────────────────
    console.log('\n▸ [9.5] Seeding rekam_medis (TPS kunjungan)...');
    const rmCount = await RekamMedis.count();
    if (rmCount === 0) {
      const apoteker = penggunaMap['apoteker@sehatterus.id'];
      const manajer = penggunaMap['carmen@sehatterus.id'];
      const admin = penggunaMap['admin@sehatterus.id'];
      
      const diseases = [
        { code: 'J06.9', name: 'Infeksi Saluran Pernafasan Akut (ISPA)' },
        { code: 'J11', name: 'Influenza / Flu' },
        { code: 'A09', name: 'Diare & Gastroenteritis' },
        { code: 'A90', name: 'Demam Berdarah Dengue (DBD)' },
        { code: 'I10', name: 'Hipertensi / Darah Tinggi' },
      ];

      const kecamatanList = ['Depok', 'Sleman', 'Mlati', 'Ngaglik', 'Gamping'];

      const visits = [];
      const now = new Date();

      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (i % 7)); // past 7 days
        const disease = diseases[i % diseases.length];
        const kecamatan = kecamatanList[i % kecamatanList.length];
        
        visits.push({
          tanggal_kunjungan: date,
          kode_icd10: disease.code,
          nama_penyakit: disease.name,
          kecamatan_domisili: kecamatan,
          faskes_id: i % 2 === 0 ? faskes1.id : faskes2.id,
          dicatat_oleh: i % 3 === 0 ? apoteker?.id : (i % 3 === 1 ? manajer?.id : admin?.id),
        });
      }

      await RekamMedis.bulkCreate(visits);
      log('rekam_medis', `15 kunjungan awal dibuat`);
    } else {
      log('rekam_medis', `EXISTS  (${rmCount} kunjungan)`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║       Seeding selesai! Ringkasan:        ║');
    console.log('╠══════════════════════════════════════════╣');
    const counts = await Promise.all([
      Wilayah.count(), FasilitasKesehatan.count(), Pengguna.count(),
      Obat.count(), Pbf.count(), FormulaRacikan.count(),
      Stok.count(), PergerakanStok.count(),
      AlertEws.count(), PrediksiKebutuhan.count(), SuratPesanan.count(),
      RekamMedis.count(),
    ]);
    const labels = ['wilayah','fasilitas_kesehatan','pengguna','obat','pbf','formula_racikan','stok','pergerakan_stok','alert_ews','prediksi_kebutuhan','surat_pesanan','rekam_medis'];
    labels.forEach((l, i) => console.log(`║  ${l.padEnd(26)} ${String(counts[i]).padStart(4)} baris  ║`));
    console.log('╚══════════════════════════════════════════╝');

    process.exit(0);
  } catch (err) {
    console.error('\n✗ Seeding FAILED:', err);
    process.exit(1);
  }
}

seedAll();
