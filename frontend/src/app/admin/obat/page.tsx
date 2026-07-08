"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Obat {
  id: string; nama: string; jenis: string; golongan: string; satuan: string;
  harga_beli: number; stok_minimum: number; kode_atc: string | null;
  pbf_id: string | null; pbf?: { nama: string };
}

interface FormData {
  nama: string; jenis: string; golongan: string; satuan: string;
  harga_beli: string; stok_minimum: string; kode_atc: string; pbf_id: string;
}

const emptyForm: FormData = {
  nama: '', jenis: 'obat_jadi', golongan: 'reguler', satuan: '',
  harga_beli: '0', stok_minimum: '0', kode_atc: '', pbf_id: '',
};

export default function AdminObatPage() {
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [pbfList, setPbfList] = useState<{ id: string; nama: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  async function fetchObat() {
    const res = await fetch(`${API_BASE}/api/admin/obat`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setObatList(data.data);
  }

  useEffect(() => {
    fetchObat();
    fetch(`${API_BASE}/api/admin/pbf`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setPbfList(d.data); });
  }, []);

  function openCreate() { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true); }
  function openEdit(o: Obat) {
    setEditId(o.id);
    setForm({
      nama: o.nama, jenis: o.jenis, golongan: o.golongan, satuan: o.satuan,
      harga_beli: String(o.harga_beli), stok_minimum: String(o.stok_minimum),
      kode_atc: o.kode_atc || '', pbf_id: o.pbf_id || '',
    });
    setError(''); setShowModal(true);
  }

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const url = editId ? `${API_BASE}/api/admin/obat/${editId}` : `${API_BASE}/api/admin/obat`;
      const method = editId ? 'PUT' : 'POST';
      const body = {
        ...form,
        harga_beli: Number(form.harga_beli) || 0,
        stok_minimum: Number(form.stok_minimum) || 0,
        kode_atc: form.kode_atc || null,
        pbf_id: form.pbf_id || null,
      };

      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setShowModal(false); fetchObat();
    } catch { setError('Tidak dapat menghubungi server'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus obat ini dari master data?')) return;
    setListError('');
    const res = await fetch(`${API_BASE}/api/admin/obat/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) { setListError(data.error || 'Gagal menghapus'); return; }
    fetchObat();
  }

  const jenisLabels: Record<string, string> = { obat_jadi: 'Obat Jadi', bahan_baku: 'Bahan Baku' };
  const golonganColors: Record<string, string> = { reguler: '#0C818A', npp: '#dc2626' };

  function formatRupiah(v: number) {
    return `Rp${Number(v).toLocaleString('id-ID')}`;
  }

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-josefin font-bold text-[28px] text-black">Kelola Obat</h1>
          <p className="font-josefin text-black/50 text-[13px]">{obatList.length} obat terdaftar</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-white text-[14px] transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#0C818A' }}>
          <Plus className="size-[16px]" /> Tambah Obat
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
              {['Nama', 'Jenis', 'Golongan', 'Satuan', 'Harga Beli', 'Stok Min.', 'Kode ATC', 'PBF', 'Aksi'].map(h => (
                <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {obatList.map((o, i) => (
              <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-[20px] py-[14px] font-josefin font-medium text-[14px] text-black whitespace-nowrap">{o.nama}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{jenisLabels[o.jenis] || o.jenis}</td>
                <td className="px-[20px] py-[14px]">
                  <span className="font-josefin text-[12px] font-semibold px-[10px] py-[4px] rounded-full whitespace-nowrap"
                    style={{ color: golonganColors[o.golongan] || '#666', backgroundColor: `${golonganColors[o.golongan] || '#666'}15` }}>
                    {o.golongan.toUpperCase()}
                  </span>
                </td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{o.satuan}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{formatRupiah(o.harga_beli)}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/70 whitespace-nowrap">{o.stok_minimum}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{o.kode_atc || '-'}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60 whitespace-nowrap">{o.pbf?.nama || '-'}</td>
                <td className="px-[20px] py-[14px]">
                  <div className="flex gap-[8px]">
                    <button onClick={() => openEdit(o)} className="p-[6px] rounded-[6px] hover:bg-teal-50 text-teal-600 transition-colors">
                      <Pencil className="size-[15px]" />
                    </button>
                    <button onClick={() => handleDelete(o.id)} className="p-[6px] rounded-[6px] hover:bg-red-50 text-red-500 transition-colors">
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
              {editId ? 'Edit Obat' : 'Tambah Obat'}
            </h2>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Nama</label>
              <input type="text" value={form.nama}
                onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
                placeholder="Paracetamol 500mg"
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

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
                <option value="npp">NPP</option>
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Satuan</label>
              <input type="text" value={form.satuan}
                onChange={e => setForm(p => ({ ...p, satuan: e.target.value }))}
                placeholder="strip / sachet / gram"
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

            <div className="flex gap-[12px]">
              <div className="flex flex-col gap-[6px] flex-1">
                <label className="font-josefin font-medium text-[13px] text-black">Harga Beli (Rp)</label>
                <input type="number" min="0" value={form.harga_beli}
                  onChange={e => setForm(p => ({ ...p, harga_beli: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-[6px] flex-1">
                <label className="font-josefin font-medium text-[13px] text-black">Stok Minimum</label>
                <input type="number" min="0" value={form.stok_minimum}
                  onChange={e => setForm(p => ({ ...p, stok_minimum: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Kode ATC (opsional)</label>
              <input type="text" value={form.kode_atc}
                onChange={e => setForm(p => ({ ...p, kode_atc: e.target.value }))}
                placeholder="N02BE01"
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">PBF Pemasok</label>
              <select value={form.pbf_id} onChange={e => setForm(p => ({ ...p, pbf_id: e.target.value }))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                <option value="">— Tidak ada —</option>
                {pbfList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
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
