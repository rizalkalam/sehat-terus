import React from "react";
import { Activity } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Sehat Terus
            <span className="text-xs font-normal text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
              Sistem Pemantauan Kesehatan Publik
            </span>
          </h1>
          <p className="text-xs text-zinc-400">Public Health Radar & Early Warning System</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Data Terintegrasi
        </div>
      </div>
    </header>
  );
}
