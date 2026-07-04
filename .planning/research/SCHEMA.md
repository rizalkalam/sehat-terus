# Database Schema — Public Health Radar

> **Konteks untuk AI agent (Claude Code):**
> Public Health Radar adalah Executive MIS untuk manajer klinik/apotek multi-cabang di Indonesia.
> Sistem ini memprediksi kebutuhan obat berdasarkan tren penyakit + surveilans spasial,
> dan membantu pengadaan (Surat Pesanan ke PBF), deteksi outbreak (EWS), serta realokasi stok antar-cabang.
>
> **Arsitektur:** satu backend Express.js mengekspos REST API (TPS = data masuk, MIS = baca/agregasi),
> didokumentasikan via Swagger. Frontend MIS (role manajer) hanya mengonsumsi API, tidak query DB langsung.
> Database tunggal (PostgreSQL). TPS menulis transaksi, MIS membaca data turunan.
>
> **Konvensi:**
> - Semua PK bertipe `uuid` (gunakan `gen_random_uuid()`).
> - Timestamp pakai `timestamptz`. Uang pakai `numeric(14,2)`.
> - Nama tabel & kolom: `snake_case`, bahasa Indonesia (sesuai domain).
> - Soft-delete via kolom `aktif boolean` jika relevan (mis. pengguna), bukan hard delete.

---

## Ringkasan Entitas

| Grup | Tabel | Peran |
|------|-------|-------|
| Master | `pengguna`, `fasilitas_kesehatan`, `wilayah`, `obat`, `pbf` | Data referensi |
| Racikan | `formula_racikan`, `formula_komponen` | Definisi resep racikan (Bill of Materials) |
| TPS | `rekam_medis`, `resep`, `resep_item`, `stok`, `pergerakan_stok` | Transaksi masuk |
| MIS (turunan) | `prediksi_kebutuhan`, `alert_ews`, `surat_pesanan`, `sp_item` | Output sistem & pengadaan |

---

## ENUM

```sql
CREATE TYPE peran_pengguna   AS ENUM ('manajer', 'apoteker', 'staf_logistik', 'admin');
CREATE TYPE tipe_faskes      AS ENUM ('klinik', 'apotek', 'rumah_sakit');
CREATE TYPE jenis_obat       AS ENUM ('obat_jadi', 'bahan_baku');
CREATE TYPE golongan_obat    AS ENUM ('reguler', 'npp'); -- npp = Narkotika/Psikotropika/Prekursor
CREATE TYPE tipe_pergerakan  AS ENUM ('masuk', 'keluar', 'realokasi', 'penyesuaian');
CREATE TYPE jenis_sp         AS ENUM ('reguler', 'npp', 'darurat');
CREATE TYPE status_sp        AS ENUM ('draf', 'disetujui', 'dikirim', 'diterima', 'batal');
CREATE TYPE status_alert     AS ENUM ('aktif', 'ditangani', 'selesai');
```

---

## 1. MASTER DATA

### `wilayah`
Referensi kecamatan untuk peta GeoJSON & domisili pasien.
```sql
CREATE TABLE wilayah (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_kecamatan  varchar(20) UNIQUE NOT NULL,
  nama_kecamatan  varchar(100) NOT NULL,
  kabupaten       varchar(100) NOT NULL,
  provinsi        varchar(100) NOT NULL,
  geojson_id      varchar(100),           -- penghubung ke properti poligon GeoJSON
  created_at      timestamptz DEFAULT now()
);
```

### `fasilitas_kesehatan`
Cabang klinik/apotek. Sistem bersifat multi-cabang.
```sql
CREATE TABLE fasilitas_kesehatan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        varchar(150) NOT NULL,
  tipe        tipe_faskes NOT NULL,
  wilayah_id  uuid REFERENCES wilayah(id),
  lat         double precision,
  long        double precision,
  alamat      text,
  created_at  timestamptz DEFAULT now()
);
```

### `pengguna`
Akun internal. TIDAK ada registrasi mandiri; dibuat oleh admin.
`nomor_sipa` wajib untuk peran `apoteker` (dipakai menandatangani Surat Pesanan yang sah).
```sql
CREATE TABLE pengguna (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama           varchar(150) NOT NULL,
  email          varchar(150) UNIQUE NOT NULL,
  password_hash  varchar(255) NOT NULL,
  peran          peran_pengguna NOT NULL,
  nomor_sipa     varchar(50),            -- NULL kecuali apoteker
  faskes_id      uuid REFERENCES fasilitas_kesehatan(id), -- NULL = akses semua cabang (admin)
  aktif          boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);
```

### `obat`
Item persediaan yang bisa di-PO (obat jadi + bahan baku). Racikan TIDAK masuk sini.
`golongan = 'npp'` memicu Surat Pesanan khusus terpisah.
```sql
CREATE TABLE obat (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          varchar(200) NOT NULL,
  jenis         jenis_obat NOT NULL,
  golongan      golongan_obat NOT NULL DEFAULT 'reguler',
  satuan        varchar(30) NOT NULL,    -- box, strip, vial, gram, sachet
  harga_beli    numeric(14,2) NOT NULL DEFAULT 0,
  stok_minimum  integer NOT NULL DEFAULT 0,
  kode_atc      varchar(20),
  created_at    timestamptz DEFAULT now()
);
```

### `pbf`
Pedagang Besar Farmasi (distributor). Tujuan Surat Pesanan.
```sql
CREATE TABLE pbf (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        varchar(150) NOT NULL,
  alamat      text,
  kontak      varchar(100),
  nomor_izin  varchar(100),
  created_at  timestamptz DEFAULT now()
);
```

---

## 2. RACIKAN (Bill of Materials)

Racikan = resep gabungan beberapa komponen obat. TIDAK punya stok sendiri.
Saat resep racikan dibuat, stok tiap komponen dikurangi proporsional (lihat catatan logika di bawah).

### `formula_racikan`
```sql
CREATE TABLE formula_racikan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_racikan  varchar(200) NOT NULL,
  deskripsi     text,
  created_at    timestamptz DEFAULT now()
);
```

### `formula_komponen`
Junction: satu formula terdiri dari banyak komponen obat + takarannya.
```sql
CREATE TABLE formula_komponen (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id  uuid NOT NULL REFERENCES formula_racikan(id) ON DELETE CASCADE,
  obat_id     uuid NOT NULL REFERENCES obat(id),
  takaran     numeric(10,3) NOT NULL,   -- mis. 0.25 = seperempat tablet
  satuan      varchar(30) NOT NULL
);
```

---

## 3. TPS — DATA TRANSAKSI MASUK

### `rekam_medis`
Kunjungan pasien (sumber data surveilans penyakit). Sudah ada di plan seeding 02-02.
Target seed: ≥5.000 record.
```sql
CREATE TABLE rekam_medis (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_kunjungan  date NOT NULL,
  kode_icd10         varchar(10) NOT NULL,
  nama_penyakit      varchar(200) NOT NULL,
  kecamatan_domisili varchar(100) NOT NULL,  -- HARUS cocok dgn wilayah.nama_kecamatan
  faskes_id          uuid REFERENCES fasilitas_kesehatan(id),
  created_at         timestamptz DEFAULT now()
);
CREATE INDEX idx_rm_tanggal   ON rekam_medis(tanggal_kunjungan);
CREATE INDEX idx_rm_icd       ON rekam_medis(kode_icd10);
CREATE INDEX idx_rm_kecamatan ON rekam_medis(kecamatan_domisili);
```

### `resep` + `resep_item`
Resep dari kunjungan. `resep_item` boleh berisi `obat_id` ATAU `formula_id` (salah satu, divalidasi di service layer).
```sql
CREATE TABLE resep (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rekam_medis_id  uuid NOT NULL REFERENCES rekam_medis(id),
  dibuat_oleh     uuid REFERENCES pengguna(id),
  tanggal         timestamptz DEFAULT now()
);

CREATE TABLE resep_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resep_id    uuid NOT NULL REFERENCES resep(id) ON DELETE CASCADE,
  obat_id     uuid REFERENCES obat(id),            -- diisi jika item = obat tunggal
  formula_id  uuid REFERENCES formula_racikan(id), -- diisi jika item = racikan
  jumlah      integer NOT NULL,
  CONSTRAINT chk_obat_atau_formula CHECK (
    (obat_id IS NOT NULL AND formula_id IS NULL) OR
    (obat_id IS NULL AND formula_id IS NOT NULL)
  )
);
```

### `stok`
Snapshot stok per faskes per obat per batch. Multi-batch untuk pelacakan near-expiry.
```sql
CREATE TABLE stok (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faskes_id           uuid NOT NULL REFERENCES fasilitas_kesehatan(id),
  obat_id             uuid NOT NULL REFERENCES obat(id),
  jumlah_tersedia     integer NOT NULL DEFAULT 0,
  tanggal_kedaluwarsa date,
  batch               varchar(60),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (faskes_id, obat_id, batch, tanggal_kedaluwarsa)
);
```

### `pergerakan_stok`
Audit trail semua pergerakan. Untuk `tipe='realokasi'`, kedua faskes terisi.
```sql
CREATE TABLE pergerakan_stok (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obat_id        uuid NOT NULL REFERENCES obat(id),
  faskes_asal    uuid REFERENCES fasilitas_kesehatan(id),   -- NULL utk penerimaan dari PBF
  faskes_tujuan  uuid REFERENCES fasilitas_kesehatan(id),   -- NULL utk pengeluaran ke pasien
  tipe           tipe_pergerakan NOT NULL,
  jumlah         integer NOT NULL,
  tanggal        timestamptz DEFAULT now(),
  referensi      varchar(100),   -- mis. id resep, id SP, atau id alert_ews
  dicatat_oleh   uuid REFERENCES pengguna(id)
);
```

---

## 4. MIS — DATA TURUNAN & PENGADAAN

### `prediksi_kebutuhan`
Output model forecasting (disimpan agar tidak dihitung ulang tiap request).
Konsumsi obat = penjualan langsung + pemakaian via racikan (gabungkan keduanya saat training).
```sql
CREATE TABLE prediksi_kebutuhan (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obat_id          uuid NOT NULL REFERENCES obat(id),
  faskes_id        uuid NOT NULL REFERENCES fasilitas_kesehatan(id),
  periode          varchar(20) NOT NULL,   -- mis. '2026-07' atau 'next_30d'
  jumlah_prediksi  integer NOT NULL,
  akurasi          numeric(5,2),           -- % akurasi prediksi periode lalu vs realisasi
  dihitung_pada    timestamptz DEFAULT now()
);
```

### `alert_ews`
Output deteksi anomali (Early Warning System).
```sql
CREATE TABLE alert_ews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faskes_id           uuid REFERENCES fasilitas_kesehatan(id),
  kecamatan           varchar(100) NOT NULL,
  jenis_penyakit      varchar(200) NOT NULL,
  kode_icd10          varchar(10),
  persen_lonjakan     numeric(7,2) NOT NULL,    -- lonjakan total vs baseline (%)
  laju_harian         numeric(7,2),             -- kecepatan kenaikan per hari (%)
  jumlah_kasus        integer,                  -- kasus aktual (dari agregasi rekam_medis)
  obat_terdampak_id   uuid REFERENCES obat(id),
  ketahanan_stok_jam  integer,                  -- sisa jam ketahanan stok terdampak
  status              status_alert NOT NULL DEFAULT 'aktif',
  terdeteksi_pada     timestamptz DEFAULT now(),
  ditangani_pada      timestamptz,
  ditangani_oleh      uuid REFERENCES pengguna(id)   -- ditambah Phase 7 Plan 07-02, akuntabilitas siapa yang menangani/menyelesaikan alert
);
CREATE INDEX idx_alert_status ON alert_ews(status);
```

### `surat_pesanan` + `sp_item`
Pengadaan ke PBF. SATU SP = SATU PBF. Item NPP WAJIB di SP terpisah (`jenis='npp'`)
dan ditandatangani apoteker (lihat `dibuat_oleh` -> pengguna.nomor_sipa).
```sql
CREATE TABLE surat_pesanan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faskes_id   uuid NOT NULL REFERENCES fasilitas_kesehatan(id),
  pbf_id      uuid NOT NULL REFERENCES pbf(id),
  jenis       jenis_sp NOT NULL DEFAULT 'reguler',
  status      status_sp NOT NULL DEFAULT 'draf',
  dibuat_oleh uuid REFERENCES pengguna(id),
  alert_id    uuid REFERENCES alert_ews(id),   -- terisi jika SP dibuat dari tindakan EWS
  dibuat_pada timestamptz DEFAULT now()
);

CREATE TABLE sp_item (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sp_id             uuid NOT NULL REFERENCES surat_pesanan(id) ON DELETE CASCADE,
  obat_id           uuid NOT NULL REFERENCES obat(id),
  jumlah_usulan     integer NOT NULL,    -- diusulkan sistem (defekta cerdas)
  jumlah_disetujui  integer              -- final setelah manajer/apoteker meninjau
);
```

---

## CATATAN LOGIKA PENTING (untuk AI agent)

1. **Penguraian racikan:** saat `resep_item` dengan `formula_id` dibuat, service layer HARUS
   membaca `formula_komponen`, lalu mengurangi `stok` tiap komponen sebesar `takaran * jumlah`.
   Racikan tidak pernah punya baris stok sendiri.

2. **Konsumsi untuk forecasting:** kebutuhan obat = penjualan langsung (`resep_item.obat_id`)
   + pemakaian via racikan (`formula_komponen` x frekuensi racikan). Jangan hanya hitung penjualan langsung.

3. **Pemisahan SP:** saat membuat Surat Pesanan dari defekta yang disetujui,
   kelompokkan per `pbf_id`, DAN pisahkan item `obat.golongan='npp'` ke SP `jenis='npp'` tersendiri.

4. **Konsistensi nama wilayah:** `rekam_medis.kecamatan_domisili` HARUS cocok persis dengan
   `wilayah.nama_kecamatan` agar agregasi heatmap & EWS akurat. Normalisasi saat ingest.

5. **Near-expiry & dead-stock:** dihitung dari `stok` (tanggal_kedaluwarsa mendekati now,
   dan obat tanpa `pergerakan_stok` tipe 'keluar' dalam N hari = slow-moving).

6. **Realokasi antar-cabang:** menulis 1 baris `pergerakan_stok` tipe 'realokasi'
   dengan `faskes_asal` (surplus) + `faskes_tujuan` (kritis), dan mengurangi/menambah `stok` keduanya.

7. **Akses berbasis peran:** `pengguna.faskes_id = NULL` berarti akses semua cabang (admin).
   Selain itu, query MIS difilter ke cabang pengguna. Hanya `apoteker` boleh menandatangani SP (`jenis='npp'`).
