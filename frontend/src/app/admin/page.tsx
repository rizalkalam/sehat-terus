"use client";

import { useEffect, useState } from "react";
import { Users, Activity } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, faskes: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, faskesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/faskes`, { credentials: 'include' }),
        ]);
        const [users, faskes] = await Promise.all([
          usersRes.json(), faskesRes.json(),
        ]);
        setStats({
          users: users.data?.length || 0,
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
    { label: 'Fasilitas Kesehatan', value: stats.faskes, icon: Activity, color: '#6EC4CC' },
  ];

  return (
    <div className="p-[40px] flex flex-col gap-[24px]">
      <div>
        <h1 className="font-josefin font-bold text-[32px] text-black">Admin Panel</h1>
        <p className="font-josefin text-black/50 text-[14px]">Kelola data sistem SehatTerus</p>
      </div>

      <div className="grid grid-cols-2 gap-[16px] max-w-[560px]">
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
        <a href="/admin/users"
          className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-[8px]">
          <p className="font-josefin font-bold text-[18px]" style={{ color: '#0C818A' }}>Kelola Pengguna</p>
          <p className="font-josefin text-[13px] text-black/50">Tambah, edit, dan nonaktifkan akun pengguna</p>
        </a>
      </div>
    </div>
  );
}
