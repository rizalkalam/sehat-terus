"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface StokItem {
  id: string; jumlah_tersedia: number; batch: string;
  tanggal_kedaluwarsa: string;
  obat?: { nama: string; satuan: string };
  faskes?: { nama: string };
}

export default function AdminStokPage() {
  const [stokList, setStokList] = useState<StokItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StokItem | null>(null);
  const [jumlah, setJumlah] = useState(0);
  const [expDate, setExpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function fetchStok() {
    const res = await fetch(`${API_BASE}/api/admin/stok`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setStokList(data.data);
  }

  useEffect(() => { fetchStok(); }, []);

  function openEdit(s: StokItem) {
    setEditItem(s);
    setJumlah(s.jumlah_tersedia);
    setExpDate(s.tanggal_kedaluwarsa?.split('T')[0] || '');
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!editItem) return;
    setLoading(true);
    await fetch(`${API_BASE}/api/admin/stok/${editItem.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jumlah_tersedia: jumlah, tanggal_kedaluwarsa: expDate }),
    });
    setShowModal(false); fetchStok(); setLoading(false);
  }

  const filtered = stokList.filter(s =>
    s.obat?.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.faskes?.nama.toLowerCase().includes(search.toLowerCase())
  );

  function getStatusColor(jumlah: number, nama: string) {
    if (jumlah <= 10) return { color: '#dc2626', bg: '#fee2e2', label: 'Kritis' };
    if (jumlah <= 30) return { color: '#d97706', bg: '#fef3c7', label: 'Rendah' };
    return { color: '#16a34a', bg: '#dcfce7', label: 'Aman' };
  }

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div>
        <h1 className="font-josefin font-bold text-[28px] text-black">Kelola Stok Obat</h1>
        <p className="font-josefin text-black/50 text-[13px]">{stokList.length} data stok</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Cari obat atau faskes..."
        className="h-[42px] rounded-[10px] border border-gray-200 px-[16px] font-josefin text-[14px] outline-none focus:border-teal-500 w-[300px]" />

      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Nama Obat', 'Faskes', 'Batch', 'Jumlah', 'Kedaluwarsa', 'Status', 'Aksi'].map(h => (
                <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const status = getStatusColor(s.jumlah_tersedia, s.obat?.nama || '');
              const exp = new Date(s.tanggal_kedaluwarsa);
              const isNearExp = exp.getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
              return (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-[20px] py-[12px] font-josefin font-medium text-[14px] text-black">{s.obat?.nama}</td>
                  <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/70">{s.faskes?.nama}</td>
                  <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/50">{s.batch}</td>
                  <td className="px-[20px] py-[12px] font-josefin font-bold text-[14px] text-black">
                    {s.jumlah_tersedia} <span className="font-normal text-black/40 text-[12px]">{s.obat?.satuan}</span>
                  </td>
                  <td className="px-[20px] py-[12px]">
                    <span className={`font-josefin text-[13px] ${isNearExp ? 'text-red-500 font-semibold' : 'text-black/70'}`}>
                      {exp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-[20px] py-[12px]">
                    <span className="font-josefin text-[12px] font-semibold px-[8px] py-[3px] rounded-full"
                      style={{ color: status.color, backgroundColor: status.bg }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-[20px] py-[12px]">
                    <button onClick={() => openEdit(s)} className="p-[6px] rounded-[6px] hover:bg-teal-50 text-teal-600 transition-colors">
                      <Pencil className="size-[15px]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Edit Stok */}
      {showModal && editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] p-[32px] w-[420px] flex flex-col gap-[16px] shadow-xl">
            <h2 className="font-josefin font-bold text-[22px] text-black">Update Stok</h2>
            <p className="font-josefin text-[14px] text-black/60">{editItem.obat?.nama} — {editItem.faskes?.nama}</p>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Jumlah Tersedia</label>
              <input type="number" value={jumlah} onChange={e => setJumlah(Number(e.target.value))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Tanggal Kedaluwarsa</label>
              <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

            <div className="flex gap-[12px] justify-end mt-[8px]">
              <button onClick={() => setShowModal(false)}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin text-[14px] text-black/60 hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-[14px] text-white hover:opacity-80 disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#0C818A' }}>
                {loading ? 'Menyimpan...' : 'Update Stok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}