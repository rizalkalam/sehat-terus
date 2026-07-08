"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Stok {
  id: string; faskes_id: string; obat_id: string; jumlah_tersedia: number;
  tanggal_kedaluwarsa: string | null; batch: string | null;
  obat?: { nama: string; satuan: string }; faskes?: { nama: string };
}

interface FormData {
  faskes_id: string; obat_id: string; jumlah_tersedia: string;
  tanggal_kedaluwarsa: string; batch: string;
}

const emptyForm: FormData = { faskes_id: '', obat_id: '', jumlah_tersedia: '0', tanggal_kedaluwarsa: '', batch: '' };

export default function AdminStokPage() {
  const [stokList, setStokList] = useState<Stok[]>([]);
  const [faskesList, setFaskesList] = useState<{ id: string; nama: string }[]>([]);
  const [obatList, setObatList] = useState<{ id: string; nama: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  async function fetchStok() {
    const res = await fetch(`${API_BASE}/api/admin/stok`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setStokList(data.data);
  }

  useEffect(() => {
    fetchStok();
    fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setFaskesList(d.data); });
    fetch(`${API_BASE}/api/admin/obat`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setObatList(d.data); });
  }, []);

  function openCreate() { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true); }
  function openEdit(s: Stok) {
    setEditId(s.id);
    setForm({
      faskes_id: s.faskes_id, obat_id: s.obat_id, jumlah_tersedia: String(s.jumlah_tersedia),
      tanggal_kedaluwarsa: s.tanggal_kedaluwarsa ? s.tanggal_kedaluwarsa.slice(0, 10) : '',
      batch: s.batch || '',
    });
    setError(''); setShowModal(true);
  }

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const url = editId ? `${API_BASE}/api/admin/stok/${editId}` : `${API_BASE}/api/admin/stok`;
      const method = editId ? 'PUT' : 'POST';
      const body = {
        ...form,
        jumlah_tersedia: Number(form.jumlah_tersedia) || 0,
        tanggal_kedaluwarsa: form.tanggal_kedaluwarsa || null,
        batch: form.batch || null,
      };

      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setShowModal(false); fetchStok();
    } catch { setError('Tidak dapat menghubungi server'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus baris stok ini?')) return;
    setListError('');
    const res = await fetch(`${API_BASE}/api/admin/stok/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) { setListError(data.error || 'Gagal menghapus'); return; }
    fetchStok();
  }

  function formatTanggal(v: string | null) {
    if (!v) return '-';
    return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-josefin font-bold text-[28px] text-black">Kelola Stok</h1>
          <p className="font-josefin text-black/50 text-[13px]">{stokList.length} baris stok terdaftar</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-white text-[14px] transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#0C818A' }}>
          <Plus className="size-[16px]" /> Tambah Stok
        </button>
      </div>

      {listError && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-[16px] py-[12px]">
          <p className="font-josefin text-[13px] text-red-600">{listError}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Obat', 'Faskes', 'Jumlah', 'Satuan', 'Kedaluwarsa', 'Batch', 'Aksi'].map(h => (
                <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stokList.map((s, i) => (
              <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-[20px] py-[14px] font-josefin font-medium text-[14px] text-black whitespace-nowrap">{s.obat?.nama || '-'}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{s.faskes?.nama || '-'}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{s.jumlah_tersedia}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{s.obat?.satuan || '-'}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{formatTanggal(s.tanggal_kedaluwarsa)}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{s.batch || '-'}</td>
                <td className="px-[20px] py-[14px]">
                  <div className="flex gap-[8px]">
                    <button onClick={() => openEdit(s)} className="p-[6px] rounded-[6px] hover:bg-teal-50 text-teal-600 transition-colors">
                      <Pencil className="size-[15px]" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-[6px] rounded-[6px] hover:bg-red-50 text-red-500 transition-colors">
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
          <div className="bg-white rounded-[20px] p-[32px] w-[480px] max-h-[90vh] overflow-y-auto flex flex-col gap-[20px] shadow-xl">
            <h2 className="font-josefin font-bold text-[22px] text-black">
              {editId ? 'Edit Stok' : 'Tambah Stok'}
            </h2>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Obat</label>
              <select value={form.obat_id} onChange={e => setForm(p => ({ ...p, obat_id: e.target.value }))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                <option value="">— Pilih obat —</option>
                {obatList.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Fasilitas Kesehatan</label>
              <select value={form.faskes_id} onChange={e => setForm(p => ({ ...p, faskes_id: e.target.value }))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                <option value="">— Pilih faskes —</option>
                {faskesList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
              </select>
            </div>

            <div className="flex gap-[12px]">
              <div className="flex flex-col gap-[6px] flex-1">
                <label className="font-josefin font-medium text-[13px] text-black">Jumlah Tersedia</label>
                <input type="number" min="0" value={form.jumlah_tersedia}
                  onChange={e => setForm(p => ({ ...p, jumlah_tersedia: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-[6px] flex-1">
                <label className="font-josefin font-medium text-[13px] text-black">Tanggal Kedaluwarsa</label>
                <input type="date" value={form.tanggal_kedaluwarsa}
                  onChange={e => setForm(p => ({ ...p, tanggal_kedaluwarsa: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Batch (opsional)</label>
              <input type="text" value={form.batch}
                onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
                placeholder="B-2026-001"
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

            {error && <p className="font-josefin text-[13px] text-red-500">{error}</p>}

            <div className="flex gap-[12px] justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin text-[14px] text-black/60 hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-[14px] text-white transition-opacity hover:opacity-80 disabled:opacity-60"
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
