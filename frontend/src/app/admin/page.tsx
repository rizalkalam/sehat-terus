"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Activity } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Pengguna {
  id: string;
  nama: string;
  peran: string;
  aktif: boolean;
}

interface Faskes {
  id: string;
  nama: string;
  tipe: string;
}

const peranLabel: Record<string, string> = {
  admin: "Admin",
  manajer: "Manajer",
  apoteker: "Apoteker",
  staf_logistik: "Staf Logistik",
};

const peranColor: Record<string, string> = {
  admin: "#dc2626",
  manajer: "#0C818A",
  apoteker: "#7c3aed",
  staf_logistik: "#d97706",
};

export default function AdminPage() {
  const [users, setUsers] = useState<Pengguna[]>([]);
  const [faskes, setFaskes] = useState<Faskes[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, faskesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' }),
        ]);
        const [usersData, faskesData] = await Promise.all([
          usersRes.json(), faskesRes.json(),
        ]);
        if (usersData.success) setUsers(usersData.data);
        if (faskesData.success) setFaskes(faskesData.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const aktifCount = users.filter(u => u.aktif).length;
  const nonaktifCount = users.length - aktifCount;

  const perPeran = Object.keys(peranLabel).map(peran => ({
    peran,
    count: users.filter(u => u.peran === peran).length,
  }));
  const maxPeranCount = Math.max(1, ...perPeran.map(p => p.count));

  const cards = [
    { label: 'Total Pengguna', value: users.length, icon: Users, color: '#0C818A' },
    { label: 'Pengguna Aktif', value: aktifCount, icon: UserCheck, color: '#1f9254' },
    { label: 'Pengguna Nonaktif', value: nonaktifCount, icon: UserX, color: '#dc2626' },
    { label: 'Fasilitas Kesehatan', value: faskes.length, icon: Activity, color: '#6EC4CC' },
  ];

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div>
        <h1 className="font-josefin font-bold text-[32px] text-black">Admin Panel</h1>
        <p className="font-josefin text-black/50 text-[14px]">Kelola data sistem SehatTerus</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px]">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 flex flex-col gap-[12px]">
              <div className="size-[44px] rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                <Icon className="size-[22px]" style={{ color: card.color }} />
              </div>
              <div>
                <p className="font-josefin font-bold text-[28px] text-black">{card.value}</p>
                <p className="font-josefin text-[13px] text-black/50">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        {/* Distribusi peran */}
        <div className="lg:col-span-2 bg-white rounded-[16px] p-[28px] shadow-sm border border-gray-100 flex flex-col gap-[20px]">
          <h2 className="font-josefin font-bold text-[18px] text-black">Distribusi Peran Pengguna</h2>
          <div className="flex flex-col gap-[16px]">
            {perPeran.map(({ peran, count }) => (
              <div key={peran} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between">
                  <span className="font-josefin text-[14px] font-medium text-black/70">{peranLabel[peran]}</span>
                  <span className="font-josefin text-[14px] font-bold text-black">{count}</span>
                </div>
                <div className="h-[8px] rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxPeranCount) * 100}%`, backgroundColor: peranColor[peran] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom kanan: faskes + quick action */}
        <div className="flex flex-col gap-[16px]">
          <div className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 flex flex-col gap-[14px]">
            <h2 className="font-josefin font-bold text-[16px] text-black">Fasilitas Kesehatan</h2>
            <div className="flex flex-col gap-[10px]">
              {faskes.map(f => (
                <div key={f.id} className="flex flex-col gap-[2px] pb-[10px] border-b border-gray-50 last:border-0 last:pb-0">
                  <span className="font-josefin text-[14px] font-medium text-black">{f.nama}</span>
                  <span className="font-josefin text-[12px] text-black/50 capitalize">{f.tipe}</span>
                </div>
              ))}
              {faskes.length === 0 && (
                <span className="font-josefin text-[13px] text-black/40">Belum ada data.</span>
              )}
            </div>
          </div>

          <a href="/admin/users"
            className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-[8px]">
            <p className="font-josefin font-bold text-[16px]" style={{ color: '#0C818A' }}>Kelola Pengguna</p>
            <p className="font-josefin text-[13px] text-black/50">Tambah, edit, dan nonaktifkan akun pengguna</p>
          </a>
        </div>
      </div>
    </div>
  );
}
