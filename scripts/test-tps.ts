import http from 'http';

const API_BASE = 'http://localhost:5000';

interface RequestResult {
  statusCode: number;
  body: any;
  headers: http.IncomingHttpHeaders;
}

function request(method: string, path: string, bodyObj?: any, cookie?: string): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const urlObj = new URL(url);
    const postData = bodyObj ? JSON.stringify(bodyObj) : '';

    const headers: any = {};
    if (bodyObj) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 5000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let body = rawData;
        try {
          body = JSON.parse(rawData);
        } catch (e) {
          // ignore JSON parse error
        }
        resolve({
          statusCode: res.statusCode || 500,
          body,
          headers: res.headers,
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (bodyObj) {
      req.write(postData);
    }
    req.end();
  });
}

function getCookieString(resHeaders: http.IncomingHttpHeaders): string | undefined {
  const setCookie = resHeaders['set-cookie'];
  if (!setCookie) return undefined;
  
  // Extract st_auth cookie
  const authCookie = setCookie.find(cookie => cookie.startsWith('st_auth='));
  if (!authCookie) return undefined;
  
  return authCookie.split(';')[0];
}

async function runTests() {
  console.log('=== MEMULAI SUITE PENGUJIAN TPS API ===\n');

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Menguji Login...');
    
    // Login as Apoteker (authorized for resep)
    const loginApoteker = await request('POST', '/api/auth/login', {
      email: 'apoteker@sehatterus.id',
      password: 'apoteker123',
    });
    if (loginApoteker.statusCode !== 200) {
      throw new Error(`Apoteker login failed: Status ${loginApoteker.statusCode}`);
    }
    const apotekerCookie = getCookieString(loginApoteker.headers);
    if (!apotekerCookie) throw new Error('Apoteker st_auth cookie not found in response headers');
    console.log('✓ Login Apoteker berhasil');

    // Login as Manager (not authorized for resep)
    const loginManager = await request('POST', '/api/auth/login', {
      email: 'carmen@sehatterus.id',
      password: 'sehat123',
    });
    if (loginManager.statusCode !== 200) {
      throw new Error(`Manager login failed: Status ${loginManager.statusCode}`);
    }
    const managerCookie = getCookieString(loginManager.headers);
    if (!managerCookie) throw new Error('Manager st_auth cookie not found in response headers');
    console.log('✓ Login Manager berhasil\n');

    // -------------------------------------------------------------------------
    // 2. AUTH GUARD TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 2] Menguji Proteksi Autentikasi...');
    const unauthTest = await request('GET', '/api/tps/referensi/penyakit');
    if (unauthTest.statusCode !== 401) {
      throw new Error(`Auth guard failed: expected 401, got ${unauthTest.statusCode}`);
    }
    console.log('✓ Proteksi endpoint berhasil (kembalikan 401)\n');

    // -------------------------------------------------------------------------
    // 3. LOOKUPS / REFERENSI ENDPOINTS TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Menguji Endpoint Referensi Lookup...');
    
    // Penyakit
    const resPenyakit = await request('GET', '/api/tps/referensi/penyakit', null, apotekerCookie);
    if (resPenyakit.statusCode !== 200 || !Array.isArray(resPenyakit.body)) {
      throw new Error('GET /api/tps/referensi/penyakit failed');
    }
    console.log(`✓ Penyakit lookup: ${resPenyakit.body.length} item ditemukan`);

    // Wilayah
    const resWilayah = await request('GET', '/api/tps/referensi/wilayah', null, apotekerCookie);
    if (resWilayah.statusCode !== 200 || !Array.isArray(resWilayah.body)) {
      throw new Error('GET /api/tps/referensi/wilayah failed');
    }
    console.log(`✓ Wilayah lookup: ${resWilayah.body.length} kecamatan ditemukan`);

    // Obat
    const resObat = await request('GET', '/api/tps/referensi/obat', null, apotekerCookie);
    if (resObat.statusCode !== 200 || !Array.isArray(resObat.body)) {
      throw new Error('GET /api/tps/referensi/obat failed');
    }
    console.log(`✓ Obat lookup: ${resObat.body.length} obat dengan stok > 0 ditemukan`);

    // Formula
    const resFormula = await request('GET', '/api/tps/referensi/formula', null, apotekerCookie);
    if (resFormula.statusCode !== 200 || !Array.isArray(resFormula.body)) {
      throw new Error('GET /api/tps/referensi/formula failed');
    }
    console.log(`✓ Formula lookup: ${resFormula.body.length} formula dengan stok komponen cukup ditemukan\n`);

    // Save lookups for later test data
    const sampleObat = resObat.body[0];
    const sampleFormula = resFormula.body[0];

    // -------------------------------------------------------------------------
    // 4. KUNJUNGAN CRUD TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 4] Menguji CRUD Kunjungan Pasien...');

    // 4.1. Create Kunjungan (Kecamatan Valid)
    const newKunjungan = await request('POST', '/api/tps/kunjungan', {
      kode_icd10: 'J06.9',
      nama_penyakit: 'ISPA',
      kecamatan_domisili: 'Depok',
    }, apotekerCookie);

    if (newKunjungan.statusCode !== 201 || !newKunjungan.body.id) {
      throw new Error(`Create kunjungan failed: status ${newKunjungan.statusCode}, body: ${JSON.stringify(newKunjungan.body)}`);
    }
    const visitId = newKunjungan.body.id;
    console.log(`✓ POST /api/tps/kunjungan (kecamatan valid): ID ${visitId} dibuat`);

    // 4.2. Create Kunjungan (Kecamatan Invalid)
    const invalidKecKunjungan = await request('POST', '/api/tps/kunjungan', {
      kode_icd10: 'J06.9',
      nama_penyakit: 'ISPA',
      kecamatan_domisili: 'KecamatanPalsu',
    }, apotekerCookie);

    if (invalidKecKunjungan.statusCode !== 400) {
      throw new Error(`Create kunjungan with invalid kecamatan should throw 400, got ${invalidKecKunjungan.statusCode}`);
    }
    console.log('✓ POST /api/tps/kunjungan (kecamatan invalid): diblokir dengan 400');

    // 4.3. List Kunjungan
    const listVisits = await request('GET', '/api/tps/kunjungan', null, apotekerCookie);
    if (listVisits.statusCode !== 200 || !listVisits.body.data) {
      throw new Error('GET /api/tps/kunjungan failed');
    }
    const createdInList = listVisits.body.data.find((v: any) => v.id === visitId);
    if (!createdInList || createdInList.ada_resep !== false) {
      throw new Error('Created visit not found in list, or ada_resep is incorrect');
    }
    console.log('✓ GET /api/tps/kunjungan: Kunjungan baru terdaftar dengan ada_resep = false');

    // 4.4. Get Kunjungan By ID
    const getVisit = await request('GET', `/api/tps/kunjungan/${visitId}`, null, apotekerCookie);
    if (getVisit.statusCode !== 200 || getVisit.body.resep !== null) {
      throw new Error('GET /api/tps/kunjungan/:id failed or resep is not null');
    }
    console.log('✓ GET /api/tps/kunjungan/:id: Detail kunjungan terambil dan resep = null');

    // 4.5. Update Kunjungan (Valid)
    const updateVisit = await request('PUT', `/api/tps/kunjungan/${visitId}`, {
      nama_penyakit: 'ISPA Ringan',
    }, apotekerCookie);
    if (updateVisit.statusCode !== 200 || updateVisit.body.nama_penyakit !== 'ISPA Ringan') {
      throw new Error('PUT /api/tps/kunjungan/:id failed');
    }
    console.log('✓ PUT /api/tps/kunjungan/:id: Berhasil update nama_penyakit menjadi "ISPA Ringan"\n');

    // -------------------------------------------------------------------------
    // 5. PRESCRIPTION & STOCK TRANSACTION TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 5] Menguji Pembuatan Resep & Transaksi Stok...');

    // 5.1. Create Resep (Unauthorized Role - Manager)
    const unauthorizedResep = await request('POST', `/api/tps/kunjungan/${visitId}/resep`, {
      items: [{ obat_id: sampleObat.id, jumlah: 1 }],
    }, managerCookie);
    if (unauthorizedResep.statusCode !== 403) {
      throw new Error(`Manager should be blocked from creating resep with 403, got ${unauthorizedResep.statusCode}`);
    }
    console.log('✓ POST /api/tps/kunjungan/:id/resep (unauthorized role): Diblokir dengan 403');

    // Get initial stock
    const obatInitialStock = sampleObat.stok_tersedia;

    // 5.2. Create Resep (Valid - Apoteker)
    const validResep = await request('POST', `/api/tps/kunjungan/${visitId}/resep`, {
      items: [
        { obat_id: sampleObat.id, jumlah: 2 },
        { formula_id: sampleFormula.id, jumlah: 1 }
      ],
    }, apotekerCookie);

    if (validResep.statusCode !== 201) {
      throw new Error(`Resep creation failed: status ${validResep.statusCode}, body: ${JSON.stringify(validResep.body)}`);
    }
    console.log('✓ POST /api/tps/kunjungan/:id/resep (valid): Resep dibuat, status 201');

    // 5.3. Check Stock Deduction
    const resObatAfter = await request('GET', '/api/tps/referensi/obat', null, apotekerCookie);
    const obatAfter = resObatAfter.body.find((o: any) => o.id === sampleObat.id);
    const expectedStock = obatInitialStock - 2;
    // Note: if formula also consumed the same obat, it could be lower, but we verify it's less
    if (!obatAfter || obatAfter.stok_tersedia > expectedStock) {
      throw new Error(`Stock deduction failed. Initial: ${obatInitialStock}, After: ${obatAfter?.stok_tersedia}, Expected <= ${expectedStock}`);
    }
    console.log(`✓ Verifikasi stok: Stok '${sampleObat.nama}' terpotong (Semula: ${obatInitialStock} -> Sekarang: ${obatAfter.stok_tersedia})`);

    // 5.4. Check Blocked Update & Delete Kunjungan
    const blockUpdate = await request('PUT', `/api/tps/kunjungan/${visitId}`, {
      nama_penyakit: 'ISPA Sedang',
    }, apotekerCookie);
    if (blockUpdate.statusCode !== 409) {
      throw new Error(`Expected 409 when updating visit with resep, got ${blockUpdate.statusCode}`);
    }
    console.log('✓ Update kunjungan diblokir dengan 409 karena resep sudah dibuat');

    const blockDelete = await request('DELETE', `/api/tps/kunjungan/${visitId}`, null, apotekerCookie);
    if (blockDelete.statusCode !== 409) {
      throw new Error(`Expected 409 when deleting visit with resep, got ${blockDelete.statusCode}`);
    }
    console.log('✓ Hapus kunjungan diblokir dengan 409 karena resep sudah dibuat');

    // 5.5. Create Duplicate Resep
    const duplicateResep = await request('POST', `/api/tps/kunjungan/${visitId}/resep`, {
      items: [{ obat_id: sampleObat.id, jumlah: 1 }],
    }, apotekerCookie);
    if (duplicateResep.statusCode !== 409) {
      throw new Error(`Expected 409 for duplicate resep, got ${duplicateResep.statusCode}`);
    }
    console.log('✓ Pembuatan resep duplikat diblokir dengan 409');

    // 5.6. Create Resep with Insufficient Stock (verify transaction safety/rollback)
    const newKunjungan2 = await request('POST', '/api/tps/kunjungan', {
      kode_icd10: 'J06.9',
      nama_penyakit: 'ISPA',
      kecamatan_domisili: 'Depok',
    }, apotekerCookie);
    const visitId2 = newKunjungan2.body.id;

    const insufficientResep = await request('POST', `/api/tps/kunjungan/${visitId2}/resep`, {
      items: [{ obat_id: sampleObat.id, jumlah: 99999 }],
    }, apotekerCookie);
    if (insufficientResep.statusCode !== 400 || insufficientResep.body.error !== 'Stok tidak cukup') {
      throw new Error(`Expected 400 Stok tidak cukup, got status ${insufficientResep.statusCode}, body: ${JSON.stringify(insufficientResep.body)}`);
    }
    console.log('✓ Pemesanan melebihi stok berhasil diblokir dengan 400 (Stok tidak cukup)\n');

    // -------------------------------------------------------------------------
    // 6. SUMMARY STATS (MIS GATEWAY) TEST
    // -------------------------------------------------------------------------
    console.log('[TEST 6] Menguji Endpoint Summary MIS...');
    const resSummary = await request('GET', '/api/cases/summary', null, apotekerCookie);
    if (resSummary.statusCode !== 200 || resSummary.body.total_kasus === undefined || !Array.isArray(resSummary.body.top_diseases)) {
      throw new Error(`GET /api/cases/summary failed with status ${resSummary.statusCode}`);
    }
    console.log(`✓ GET /api/cases/summary: Total kasus = ${resSummary.body.total_kasus}, Top disease = ${resSummary.body.top_diseases[0]?.nama_penyakit}`);

    console.log('\n=== SUCCESS: SEMUA UJI TPS API BERHASIL MELEWATI VERIFIKASI! ===');
    process.exit(0);
  } catch (error: any) {
    console.error('\n=== FAIL: UJI TPS API GAGAL ===');
    console.error(error.message || error);
    process.exit(1);
  }
}

runTests();
