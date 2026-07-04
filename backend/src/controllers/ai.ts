import { Request, Response } from 'express';
import { Stok, Obat, FasilitasKesehatan, PergerakanStok, AlertEws } from '../models';

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

export const predictDrugNeeds = async (req: Request, res: Response) => {
  try {
    const { faskes_id } = req.query;

    // Ambil data stok
    const stok = await Stok.findAll({
      where: faskes_id ? { faskes_id } : {},
      include: [
        { model: Obat, as: 'obat', attributes: ['nama', 'satuan', 'stok_minimum', 'harga_beli'] },
        { model: FasilitasKesehatan, as: 'faskes', attributes: ['nama'] },
      ],
    });

    // Ambil data pergerakan stok (30 hari terakhir)
const pergerakan = await PergerakanStok.findAll({
  where: { tipe: 'keluar' },
  include: [{ model: Obat, as: 'obat', attributes: ['nama'] }],
  limit: 50,
});

    // Ambil data alert aktif
    const alerts = await AlertEws.findAll({
      where: { status: 'aktif' },
      attributes: ['kecamatan', 'jenis_penyakit', 'persen_lonjakan', 'jumlah_kasus'],
    });

    const prompt = `
Kamu adalah sistem prediksi kebutuhan obat untuk klinik/farmasi di D.I. Yogyakarta.

Data stok obat saat ini:
${JSON.stringify(stok.map(s => ({
  obat: (s as any).obat?.nama,
  faskes: (s as any).faskes?.nama,
  stok: s.jumlah_tersedia,
  satuan: (s as any).obat?.satuan,
  stok_minimum: (s as any).obat?.stok_minimum,
  kedaluwarsa: s.tanggal_kedaluwarsa,
})), null, 2)}

Alert penyakit aktif di wilayah:
${JSON.stringify(alerts, null, 2)}

Berikan prediksi kebutuhan obat bulan depan dalam Bahasa Indonesia.
Format respons HANYA JSON tanpa teks tambahan:
{
  "summary": "ringkasan singkat prediksi",
  "predictions": [
    {
      "nama_obat": "nama obat",
      "stok_sekarang": 0,
      "prediksi_kebutuhan": 0,
      "satuan": "strip",
      "prioritas": "tinggi | sedang | rendah",
      "alasan": "alasan singkat"
    }
  ],
  "rekomendasi": ["rekomendasi1", "rekomendasi2"],
  "total_estimasi_biaya": 0
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

    return res.json({ success: true, prediction: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memprediksi kebutuhan', detail: err.message });
  }
};