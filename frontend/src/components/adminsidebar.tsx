"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Package, LayoutDashboard, Database, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Fungsi handler untuk memaksa logout dan refresh halaman penuh
const handleLogout = async () => {
    try {
      // 1. Jalankan fungsi logout bawaan dari AuthContext kamu
      await logout();
      
      // 2. JAGA-JAGA: Paksa hapus token yang mungkin tertinggal di localStorage atau sessionStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // 3. Alihkan halaman secara penuh ke "/login" menggunakan window.location
      window.location.href = "/login";
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
      
      // Tetap bersihkan penyimpanan lokal jika fungsi di atas error
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Pengguna", path: "/admin/users", icon: Users },
    { name: "Master Obat", path: "/admin/obat", icon: Package },
    { name: "Stok Obat", path: "/admin/stok", icon: Database },
  ];

  return (
    <aside className="w-[280px] h-screen bg-[#00454A] px-[32px] py-[48px] flex flex-col justify-between shrink-0 z-[1001]">
      <div className="flex flex-col gap-[32px]">
        {/* Brand */}
        <div className="flex flex-col">
          <div>
            <p className="font-josefin font-bold text-white text-[24px]">SehatTerus</p>
            <p className="font-josefin text-white/50 text-[12px]">Admin Panel</p>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex flex-col gap-[8px]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}
                className={cn(
                  "flex gap-[12px] items-center px-[16px] py-[12px] rounded-[12px] font-josefin text-[16px] transition-all",
                  isActive ? "bg-white/20 text-white font-semibold" : "text-white/60 hover:bg-white/10 hover:text-white"
                )}>
                <Icon className="size-[20px] shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tombol Logout */}
      <Link href="/"className="flex gap-[12px] items-center px-[16px] py-[12px] rounded-[12px] font-josefin text-[16px] transition-all text-white/60 hover:bg-white/10 hover:text-white w-full text-left">
        {/* Menggunakan ikon LogOut bawaanmu agar desain ikonnya tetap sama bagusnya */}
        <LogOut className="size-[20px] shrink-0 transform rotate-180" />
        BACK
      </Link>

    </aside>
  );
}