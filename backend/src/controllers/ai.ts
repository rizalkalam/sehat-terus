import { Request, Response } from 'express';
import { computeDefekta, computeSlowMoving } from './logistic';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const analyzeDiseaseData = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data penyakit diperlukan' });
    }

    const prompt = `
Kamu adalah sistem analisis kesehatan untuk wilayah D.I. Yogyakarta.
Berikut adalah data kasus penyakit terkini:

${JSON.stringify(data, null, 2)}

Berikan analisis singkat dalam Bahasa Indonesia mencakup:
1. Penyakit dengan kasus tertinggi dan tren-nya
2. Wilayah/kecamatan yang perlu perhatian khusus
3. Rekomendasi tindakan pencegahan
4. Status peringatan dini (Normal / Waspada / Bahaya)

Format respons sebagai JSON dengan struktur:
{
  "summary": "ringkasan singkat",
  "highestDisease": "nama penyakit",
  "alertStatus": "Normal | Waspada | Bahaya",
  "warningAreas": ["kecamatan1", "kecamatan2"],
  "recommendations": ["rekomendasi1", "rekomendasi2"],
  "details": "analisis lengkap"
}
Respons HANYA JSON, tanpa teks tambahan, tanpa markdown.
    `;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const groqData = await response.json() as any;
    const rawText = groqData.choices?.[0]?.message?.content || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menganalisis data', detail: err.message });
  }
};

// GET /api/ai/predict-drugs?faskes_id=
// Beda dari analyzeDiseaseData: angka (usulan_pesanan, nilai_modal_rp, dst.) DIHITUNG lebih dulu
// oleh computeDefekta/computeSlowMoving (logika sama dengan F25/F28 di logistic.ts) — LLM cuma
// diminta menulis narasi & prioritas dalam Bahasa Indonesia berdasarkan angka itu, TIDAK diminta
// mengarang angka sendiri (beda dari referensi lama yang membiarkan LLM menebak jumlah prediksi).
export const predictDrugNeeds = async (req: Request, res: Response) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi di server.' });
    }

    const faskesId = req.query.faskes_id as string | undefined;

    const [defektaGroups, slowMoving] = await Promise.all([
      computeDefekta(faskesId),
      computeSlowMoving(faskesId),
    ]);

    const kebutuhanMendesak = defektaGroups
      .flatMap((g: any) => g.items.map((item: any) => ({ ...item, pbf: g.pbf.nama, tipe: g.tipe })))
      .sort((a: any, b: any) => (a.ketahanan_hari ?? Infinity) - (b.ketahanan_hari ?? Infinity))
      .slice(0, 10);

    const stokBerlebih = [...slowMoving]
      .sort((a: any, b: any) => b.nilai_modal_rp - a.nilai_modal_rp)
      .slice(0, 10);

    if (kebutuhanMendesak.length === 0 && stokBerlebih.length === 0) {
      return res.json({
        success: true,
        prediction: {
          summary: 'Tidak ada obat di bawah stok minimum maupun stok slow-moving saat ini.',
          alert_status: 'Normal',
          rekomendasi: [],
          kebutuhan_mendesak: [],
          stok_berlebih: [],
        },
      });
    }

    const prompt = `
Kamu adalah asisten farmasi untuk klinik/apotek di D.I. Yogyakarta. Angka di bawah ini SUDAH
dihitung oleh sistem (jangan diubah atau dikarang ulang) — tugasmu HANYA menulis ringkasan naratif
dan rekomendasi prioritas dalam Bahasa Indonesia berdasarkan angka ini.

Obat yang butuh dipesan segera (stok di bawah minimum, "usulan_pesanan" = jumlah yang disarankan
dipesan, "ketahanan_hari" = perkiraan sisa hari stok bertahan):
${JSON.stringify(kebutuhanMendesak, null, 2)}

Obat dengan stok berlebih/tidak bergerak ("nilai_modal_rp" = nilai modal tertahan, "saran" =
realokasi ke faskes lain atau retur ke distributor):
${JSON.stringify(stokBerlebih, null, 2)}

Format respons HANYA JSON, tanpa teks tambahan, tanpa markdown:
{
  "summary": "ringkasan singkat situasi stok obat",
  "alert_status": "Normal | Waspada | Bahaya",
  "rekomendasi": ["rekomendasi1 (sebutkan nama obat spesifik dari data di atas)", "rekomendasi2"]
}
    `;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const groqData = await response.json() as any;
    const rawText = groqData.choices?.[0]?.message?.content || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.json({
      success: true,
      prediction: {
        summary: parsed.summary,
        alert_status: parsed.alert_status,
        rekomendasi: parsed.rekomendasi,
        kebutuhan_mendesak: kebutuhanMendesak,
        stok_berlebih: stokBerlebih,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memprediksi kebutuhan obat', detail: err.message });
  }
};
