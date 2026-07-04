"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Obat {
  id: string; nama: string; jenis: string;
  golongan: string; satuan: string;
  harga_beli: number; stok_minimum: number; kode_atc: string | null;
}

const emptyForm = { nama: '', jenis: 'obat_jadi', golongan: 'reguler', satuan: 'strip', harga_beli: 0, stok_minimum: 0, kode_atc: '' };

export default function AdminObatPage() {
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function fetchObat() {
    const res = await fetch(`${API_BASE}/api/admin/obat`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setObatList(data.data);
  }

  useEffect(() => { fetchObat(); }, []);

  function openCreate() { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true); }
  function openEdit(o: Obat) {
    setEditId(o.id);
    setForm({ nama: o.nama, jenis: o.jenis, golongan: o.golongan, satuan: o.satuan, harga_beli: o.harga_beli, stok_minimum: o.stok_minimum, kode_atc: o.kode_atc || '' });
    setError(''); setShowModal(true);
  }

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const url = editId ? `${API_BASE}/api/admin/obat/${editId}` : `${API_BASE}/api/admin/obat`;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setShowModal(false); fetchObat();
    } catch { setError('Tidak dapat menghubungi server'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus obat "${nama}"? Data yang terhubung mungkin ikut terhapus.`)) return;
    await fetch(`${API_BASE}/api/admin/obat/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchObat();
  }

  const filtered = obatList.filter(o => o.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-josefin font-bold text-[28px] text-black">Master Obat</h1>
          <p className="font-josefin text-black/50 text-[13px]">{obatList.length} obat terdaftar</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-white text-[14px] hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#0C818A' }}>
          <Plus className="size-[16px]" /> Tambah Obat
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Cari nama obat..."
        className="h-[42px] rounded-[10px] border border-gray-200 px-[16px] font-josefin text-[14px] outline-none focus:border-teal-500 w-[300px]" />

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Nama Obat', 'Jenis', 'Golongan', 'Satuan', 'Harga Beli', 'Stok Min', 'Aksi'].map(h => (
                <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-[20px] py-[12px] font-josefin font-medium text-[14px] text-black">{o.nama}</td>
                <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/70">{o.jenis}</td>
                <td className="px-[20px] py-[12px]">
                  <span className={`font-josefin text-[12px] font-semibold px-[8px] py-[3px] rounded-full ${o.golongan === 'npp' ? 'text-red-600 bg-red-100' : 'text-teal-700 bg-teal-100'}`}>
                    {o.golongan}
                  </span>
                </td>
                <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/70">{o.satuan}</td>
                <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/70">Rp {o.harga_beli.toLocaleString()}</td>
                <td className="px-[20px] py-[12px] font-josefin text-[13px] text-black/70">{o.stok_minimum}</td>
                <td className="px-[20px] py-[12px]">
                  <div className="flex gap-[8px]">
                    <button onClick={() => openEdit(o)} className="p-[6px] rounded-[6px] hover:bg-teal-50 text-teal-600 transition-colors">
                      <Pencil className="size-[15px]" />
                    </button>
                    <button onClick={() => handleDelete(o.id, o.nama)} className="p-[6px] rounded-[6px] hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="size-[15px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] p-[32px] w-[500px] flex flex-col gap-[16px] shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-josefin font-bold text-[22px] text-black">
              {editId ? 'Edit Obat' : 'Tambah Obat'}
            </h2>

            {[
              { label: 'Nama Obat', key: 'nama', type: 'text', placeholder: 'cth: Paracetamol 500mg' },
              { label: 'Kode ATC', key: 'kode_atc', type: 'text', placeholder: 'cth: N02BE01' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">{f.label}</label>
                <input type={f.type} value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">Jenis</label>
                <select value={form.jenis} onChange={e => setForm(p => ({ ...p, jenis: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                  <option value="obat_jadi">Obat Jadi</option>
                  <option value="bahan_baku">Bahan Baku</option>
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">Golongan</label>
                <select value={form.golongan} onChange={e => setForm(p => ({ ...p, golongan: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                  <option value="reguler">Reguler</option>
                  <option value="npp">NPP (Narkotika/Psikotropika)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">Satuan</label>
                <input value={form.satuan} onChange={e => setForm(p => ({ ...p, satuan: e.target.value }))}
                  placeholder="strip/sachet/gram"
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">Harga Beli</label>
                <input type="number" value={form.harga_beli}
                  onChange={e => setForm(p => ({ ...p, harga_beli: Number(e.target.value) }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">Stok Minimum</label>
                <input type="number" value={form.stok_minimum}
                  onChange={e => setForm(p => ({ ...p, stok_minimum: Number(e.target.value) }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
            </div>

            {error && <p className="font-josefin text-[13px] text-red-500">{error}</p>}

            <div className="flex gap-[12px] justify-end mt-[8px]">
              <button onClick={() => setShowModal(false)}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin text-[14px] text-black/60 hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-[14px] text-white hover:opacity-80 disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#0C818A' }}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}