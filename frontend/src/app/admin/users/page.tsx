"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, PowerOff } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id: string; nama: string; email: string;
  peran: string; aktif: boolean; faskes_id: string | null;
  faskes?: { nama: string };
}

interface FormData {
  nama: string; email: string; password: string;
  peran: string; faskes_id: string;
}

const emptyForm: FormData = { nama: '', email: '', password: '', peran: 'staf_logistik', faskes_id: '' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [faskesList, setFaskesList] = useState<{ id: string; nama: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchUsers() {
    const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setUsers(data.data);
  }

  useEffect(() => {
    fetchUsers();
    fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setFaskesList(d.data); });
  }, []);

  function openCreate() { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true); }
  function openEdit(u: User) {
    setEditId(u.id);
    setForm({ nama: u.nama, email: u.email, password: '', peran: u.peran, faskes_id: u.faskes_id || '' });
    setError(''); setShowModal(true);
  }

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const url = editId ? `${API_BASE}/api/admin/users/${editId}` : `${API_BASE}/api/admin/users`;
      const method = editId ? 'PUT' : 'POST';
      const body = { ...form };
      if (editId && !body.password) delete (body as Partial<FormData>).password;

      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return; }
      setShowModal(false); fetchUsers();
    } catch { setError('Tidak dapat menghubungi server'); }
    finally { setLoading(false); }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Nonaktifkan pengguna ini?')) return;
    await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchUsers();
  }

  const peranColors: Record<string, string> = {
    admin: '#dc2626', manajer: '#0C818A', apoteker: '#7c3aed',
    staf_logistik: '#d97706',
  };

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-josefin font-bold text-[28px] text-black">Kelola Pengguna</h1>
          <p className="font-josefin text-black/50 text-[13px]">{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] font-josefin font-semibold text-white text-[14px] transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#0C818A' }}>
          <Plus className="size-[16px]" /> Tambah Pengguna
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Nama', 'Email', 'Peran', 'Faskes', 'Status', 'Aksi'].map(h => (
                <th key={h} className="font-josefin font-semibold text-[13px] text-black/50 text-left px-[20px] py-[14px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-[20px] py-[14px] font-josefin font-medium text-[14px] text-black">{u.nama}</td>
                <td className="px-[20px] py-[14px] font-josefin text-[14px] text-black/70">{u.email}</td>
                <td className="px-[20px] py-[14px]">
                  <span className="font-josefin text-[12px] font-semibold px-[10px] py-[4px] rounded-full"
                    style={{ color: peranColors[u.peran] || '#666', backgroundColor: `${peranColors[u.peran] || '#666'}15` }}>
                    {u.peran}
                  </span>
                </td>
                <td className="px-[20px] py-[14px] font-josefin text-[13px] text-black/60">{u.faskes?.nama || '-'}</td>
                <td className="px-[20px] py-[14px]">
                  <span className={`font-josefin text-[12px] font-semibold px-[10px] py-[4px] rounded-full ${u.aktif ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                    {u.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-[20px] py-[14px]">
                  <div className="flex gap-[8px]">
                    <button onClick={() => openEdit(u)} className="p-[6px] rounded-[6px] hover:bg-teal-50 text-teal-600 transition-colors">
                      <Pencil className="size-[15px]" />
                    </button>
                    <button onClick={() => handleDeactivate(u.id)} className="p-[6px] rounded-[6px] hover:bg-red-50 text-red-500 transition-colors">
                      <PowerOff className="size-[15px]" />
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
          <div className="bg-white rounded-[20px] p-[32px] w-[480px] flex flex-col gap-[20px] shadow-xl">
            <h2 className="font-josefin font-bold text-[22px] text-black">
              {editId ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h2>

            {[
              { label: 'Nama', key: 'nama', type: 'text', placeholder: 'Nama lengkap' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'email@domain.com' },
              { label: editId ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-[6px]">
                <label className="font-josefin font-medium text-[13px] text-black">{f.label}</label>
                <input type={f.type} value={form[f.key as keyof FormData]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500" />
              </div>
            ))}

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Peran</label>
              <select value={form.peran} onChange={e => setForm(p => ({ ...p, peran: e.target.value }))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                {['admin', 'manajer', 'apoteker', 'staf_logistik'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-josefin font-medium text-[13px] text-black">Fasilitas Kesehatan</label>
              <select value={form.faskes_id} onChange={e => setForm(p => ({ ...p, faskes_id: e.target.value }))}
                className="h-[40px] rounded-[8px] border border-gray-200 px-[12px] font-josefin text-[14px] outline-none focus:border-teal-500">
                <option value="">— Tidak ada —</option>
                {faskesList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
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
