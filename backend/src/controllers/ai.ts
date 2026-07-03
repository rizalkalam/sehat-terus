import { Request, Response } from 'express';

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
