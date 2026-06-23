import http from "http";

const API_BASE = "http://localhost:5000";

function getJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      if (statusCode !== 200) {
        reject(new Error(`Request Gagal. Status Code: ${statusCode} untuk ${url}`));
        res.resume();
        return;
      }
      res.setEncoding("utf8");
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e: any) {
          reject(e);
        }
      });
    }).on("error", (e) => {
      reject(e);
    });
  });
}

async function runTests() {
  console.log("=== MEMULAI VALIDASI ENDPOINT BACKEND ===");
  try {
    // 1. Health check
    console.log("Menguji /health...");
    const health = await getJSON(`${API_BASE}/health`);
    console.log("Response /health:", health);
    if (health.status !== "OK") throw new Error("Health check failed");

    // 2. Spatial
    console.log("Menguji /api/cases/spatial...");
    const spatial = await getJSON(`${API_BASE}/api/cases/spatial`);
    console.log(`Response /api/cases/spatial: ${spatial.length} kecamatan ditemukan.`);
    if (!Array.isArray(spatial) || spatial.length === 0) {
      throw new Error("Spatial aggregation failed or returned empty array");
    }
    const sampleSpatial = spatial[0];
    if (!sampleSpatial.kecamatan_domisili || sampleSpatial.total_cases === undefined || !sampleSpatial.population) {
      throw new Error("Spatial response schema is invalid");
    }
    console.log("Sample spatial data:", sampleSpatial);

    // 3. Temporal
    console.log("Menguji /api/cases/temporal...");
    const temporal = await getJSON(`${API_BASE}/api/cases/temporal`);
    console.log(`Response /api/cases/temporal: ${temporal.length} data kelompok waktu ditemukan.`);
    if (!Array.isArray(temporal)) {
      throw new Error("Temporal aggregation failed");
    }
    if (temporal.length > 0) {
      const sampleTemporal = temporal[0];
      console.log("Actual sampleTemporal:", sampleTemporal);
      if (!sampleTemporal.visit_date || !sampleTemporal.kode_icd10 || !sampleTemporal.nama_penyakit || sampleTemporal.total_cases === undefined) {
        throw new Error("Temporal response schema is invalid");
      }
      console.log("Sample temporal data:", sampleTemporal);
    } else {
      console.log("Perhatian: Temporal data kosong, pastikan database ter-seed.");
    }

    // 4. Region Detail
    console.log("Menguji /api/cases/region/Ngemplak...");
    const region = await getJSON(`${API_BASE}/api/cases/region/Ngemplak`);
    console.log("Response /api/cases/region/Ngemplak:", region);
    if (region.name !== "Ngemplak" || !region.population || region.cases === undefined) {
      throw new Error("Region detail schema is invalid");
    }

    console.log("\n=== SUCCESS: SEMUA ENDPOINT VALID! ===");
    process.exit(0);
  } catch (error: any) {
    console.error("\n=== FAIL: VALIDASI ENDPOINT GAGAL ===");
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
