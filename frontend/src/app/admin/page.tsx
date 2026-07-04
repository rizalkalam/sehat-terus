"use client";

import { useEffect, useState } from "react";
import { Users, Package, Database, Activity } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, obat: 0, stok: 0, faskes: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, obatRes, stokRes, faskesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/obat`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/stok`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' }),
        ]);
        const [users, obat, stok, faskes] = await Promise.all([
          usersRes.json(), obatRes.json(), stokRes.json(), faskesRes.json(),
        ]);
        setStats({
          users: users.data?.length || 0,
          obat: obat.data?.length || 0,
          stok: stok.data?.length || 0,
          faskes: faskes.data?.length || 0,
        });
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Pengguna', value: stats.users, icon: Users, color: '#0C818A' },
    { label: 'Master Obat', value: stats.obat, icon: Package, color: '#2A9DA6' },
    { label: 'Data Stok', value: stats.stok, icon: Database, color: '#49999F' },
    { label: 'Fasilitas Kesehatan', value: stats.faskes, icon: Activity, color: '#6EC4CC' },
  ];

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div>
        <h1 className="font-josefin font-bold text-[32px] text-black">Admin Panel</h1>
        <p className="font-josefin text-black/50 text-[14px]">Kelola data sistem SehatTerus</p>
      </div>

      <div className="grid grid-cols-4 gap-[16px]">
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

      <div className="grid grid-cols-3 gap-[16px] mt-[8px]">
        {[
          { title: 'Kelola Pengguna', desc: 'Tambah, edit, dan nonaktifkan akun pengguna', href: '/admin/users', color: '#0C818A' },
          { title: 'Kelola Obat', desc: 'Tambah dan update master data obat', href: '/admin/obat', color: '#2A9DA6' },
          { title: 'Kelola Stok', desc: 'Update jumlah stok per fasilitas kesehatan', href: '/admin/stok', color: '#49999F' },
        ].map((item, i) => (
          <a key={i} href={item.href}
            className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-[8px]">
            <p className="font-josefin font-bold text-[18px]" style={{ color: item.color }}>{item.title}</p>
            <p className="font-josefin text-[13px] text-black/50">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}