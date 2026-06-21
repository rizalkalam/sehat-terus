"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, LineChart, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Peta Geospatial",
      path: "/",
      icon: Map,
      description: "Visualisasi penyebaran penyakit",
    },
    {
      name: "Proyeksi Tren",
      path: "/proyeksi-tren",
      icon: LineChart,
      description: "Forecasting epidemiologi wilayah",
    },
    {
      name: "Peringatan Dini",
      path: "/peringatan-dini",
      icon: ShieldAlert,
      description: "Deteksi anomali & outbreak",
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between h-[calc(100vh-73px)] shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <h2 className="mb-3 px-4 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Menu Utama
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group border",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-white")} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold leading-none">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 font-normal leading-normal truncate group-hover:text-zinc-400 mt-1">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/40 text-[11px] text-zinc-500">
        <p className="font-semibold text-zinc-400">Sistem Read-Only</p>
        <p className="mt-1 leading-relaxed">
          Diperbarui secara otomatis dari sistem API backend epidemiologi utama.
        </p>
      </div>
    </aside>
  );
}
