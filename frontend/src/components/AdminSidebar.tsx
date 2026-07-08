"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, LogOut, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Pengguna", path: "/admin/users", icon: Users },
    { name: "Obat", path: "/admin/obat", icon: Pill },
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
      <button
        onClick={logout}
        className="flex gap-[12px] items-center px-[16px] py-[12px] rounded-[12px] font-josefin text-[16px] transition-all text-white/60 hover:bg-white/10 hover:text-white w-full text-left cursor-pointer"
      >
        <LogOut className="size-[20px] shrink-0" />
        Keluar
      </button>
    </aside>
  );
}
