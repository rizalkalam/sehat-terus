"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface KebutuhanMendesak {
  obat_id: string; nama: string; jenis: string; satuan: string;
  ketahanan_hari: number | null; jumlah_tersedia: number; stok_minimum: number;
  usulan_pesanan: number; pbf: string; tipe: string;
}

interface StokBerlebih {
  stok_id: string; obat: { nama: string }; faskes: { nama: string } | null;
  jumlah_tersedia: number; hari_tidak_bergerak: number | null; nilai_modal_rp: number;
  saran: string; faskes_tujuan_realokasi: { nama: string } | null;
}

interface Prediction {
  summary: string; alert_status: string; rekomendasi: string[];
  kebutuhan_mendesak: KebutuhanMendesak[]; stok_berlebih: StokBerlebih[];
}

const alertColors: Record<string, string> = { Normal: '#0C818A', Waspada: '#d97706', Bahaya: '#dc2626' };

export default function AdminPrediksiObatPage() {
  const [faskesList, setFaskesList] = useState<{ id: string; nama: string }[]>([]);
  const [faskesId, setFaskesId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setFaskesList(d.data); });
  }, []);

  async function runPrediction() {
    setLoading(true); setError(''); setPrediction(null);
    try {
      const url = new URL(`${API_BASE}/api/ai/predict-drugs`);
      if (faskesId) url.searchParams.set('faskes_id', faskesId);
      const res = await fetch(url.toString(), { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menjalankan prediksi'); return; }
      setPrediction(data.prediction);
    } catch { setError('Tidak dapat menghubungi server'); }
    finally { setLoading(false); }
  }

  function formatRupiah(v: number) {
    return `Rp${Number(v).toLocaleString('id-ID')}`;
  }

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div>
        <h1 className="font-josefin font-bold text-[28px] text-black">Prediksi Kebutuhan Obat (AI)</h1>
        <p className="font-josefin text-black/50 text-[13px]">
          Ringkasan & rekomendasi dari Groq berdasarkan angka defekta dan slow-moving yang sudah dihitung sistem
        </p>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-[24px] flex items-end gap-[16px] flex-wrap">
        <div className="flex flex-col gap-[6px]">
          <label className="font-josefin font-medium text-[13px] text-black">Fasilitas Kesehatan</label>
          <select value={faskesId} onChange={e => setFaskesId(e.target.value)}
            className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500 min-w-[240px]">
            <option value="">— Semua Faskes —</option>
            {faskesList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
          </select>
        </div>
        <button onClick={runPrediction} disabled={loading}
          className="flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-white text-[14px] transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: '#0C818A' }}>
          {loading ? <Loader2 className="size-[16px] animate-spin" /> : <Sparkles className="size-[16px]" />}
          {loading ? 'Memprediksi...' : 'Jalankan Prediksi'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-[16px] py-[12px]">
          <p className="font-josefin text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {prediction && (
        <>
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-[24px] flex flex-col gap-[16px]">
            <div className="flex items-center gap-[12px]">
              <span className="font-josefin text-[12px] font-semibold px-[12px] py-[6px] rounded-full"
                style={{ color: alertColors[prediction.alert_status] || '#666', backgroundColor: `${alertColors[prediction.alert_status] || '#666'}15` }}>
                {prediction.alert_status || 'Normal'}
              </span>
            </div>
            <p className="font-josefin text-[14px] text-black/80">{prediction.summary}</p>
            {prediction.rekomendasi?.length > 0 && (
              <ul className="flex flex-col gap-[6px] list-disc pl-[20px]">
                {prediction.rekomendasi.map((r, i) => (
                  <li key={i} className="font-josefin text-[13px] text-black/70">{r}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-[12px]">
            <h2 className="font-josefin font-bold text-[18px] text-black">Kebutuhan Mendesak</h2>
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
              {prediction.kebutuhan_mendesak.length === 0 ? (
                <p className="font-josefin text-[13px] text-black/50 p-[20px]">Tidak ada obat di bawah stok minimum.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Obat', 'PBF', 'Ketahanan', 'Tersedia', 'Minimum', 'Usulan Pesan'].map(h => (
                        <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.kebutuhan_mendesak.map((k, i) => (
                      <tr key={k.obat_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-[20px] py-[14px] font-josefin font-medium text-[14px] text-black whitespace-nowrap">{k.nama}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{k.pbf}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{k.ketahanan_hari !== null ? `${k.ketahanan_hari} hari` : '-'}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{k.jumlah_tersedia} {k.satuan}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{k.stok_minimum}</td>
                        <td className="px-[20px] py-[14px] font-josefin font-semibold text-[13px] text-black whitespace-nowrap">{k.usulan_pesanan} {k.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[12px]">
            <h2 className="font-josefin font-bold text-[18px] text-black">Stok Berlebih / Slow-Moving</h2>
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
              {prediction.stok_berlebih.length === 0 ? (
                <p className="font-josefin text-[13px] text-black/50 p-[20px]">Tidak ada obat slow-moving.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Obat', 'Faskes', 'Tersedia', 'Tidak Bergerak', 'Nilai Modal', 'Saran'].map(h => (
                        <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.stok_berlebih.map((s, i) => (
                      <tr key={s.stok_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-[20px] py-[14px] font-josefin font-medium text-[14px] text-black whitespace-nowrap">{s.obat.nama}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{s.faskes?.nama || '-'}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{s.jumlah_tersedia}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{s.hari_tidak_bergerak !== null ? `${s.hari_tidak_bergerak} hari` : 'belum pernah'}</td>
                        <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{formatRupiah(s.nilai_modal_rp)}</td>
                        <td className="px-[20px] py-[14px]">
                          <span className="font-josefin text-[12px] font-semibold px-[10px] py-[4px] rounded-full whitespace-nowrap"
                            style={{ color: s.saran === 'realokasi' ? '#0C818A' : '#d97706', backgroundColor: s.saran === 'realokasi' ? '#0C818A15' : '#d9770615' }}>
                            {s.saran === 'realokasi' ? `Realokasi → ${s.faskes_tujuan_realokasi?.nama || '-'}` : 'Retur'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
