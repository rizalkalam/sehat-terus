import React from "react";
import { ShieldAlert, Users, TrendingUp, AlertTriangle, Map } from "lucide-react";

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Dasbor Pengawasan Geospatial</h2>
        <p className="text-sm text-zinc-400">
          Pemantauan sebaran penyakit wilayah berbasis data rekam medis terpadu di Indonesia.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Total Kasus</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">-</span>
            <span className="text-[10px] text-zinc-500">Mulai mengumpulkan data</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Wilayah Aktif</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">-</span>
            <span className="text-[10px] text-zinc-500">Kecamatan terpetakan</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Tren Mingguan</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">-</span>
            <span className="text-[10px] text-emerald-400">Menunggu kalkulasi</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Wilayah Siaga</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">-</span>
            <span className="text-[10px] text-zinc-500">Menunggu analisis anomali</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map and Details panel */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Map Container Placeholder */}
        <div className="md:col-span-2 min-h-[500px] rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 z-10">
            <h3 className="font-semibold text-white">Peta Sebaran Epidemiologi (Choropleth Heatmap)</h3>
            <span className="text-xs text-zinc-400">Yogyakarta / Jakarta</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 z-10">
            <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <Map className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white">Menunggu Integrasi Peta</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Modul GIS Leaflet dan aset GeoJSON batas wilayah akan diintegrasikan pada Tahap 3 (Phase 3).
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent"></div>
        </div>

        {/* Region Detail Panel Placeholder */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white border-b border-zinc-800 pb-3 mb-4">Detail Informasi Wilayah</h3>
            <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-500 space-y-3">
              <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800">
                <AlertTriangle className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-xs max-w-[200px]">
                Pilih salah satu kecamatan pada peta untuk melihat detail statistik penyebaran penyakit secara langsung.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-500">
            *Data diperbarui setiap 24 jam dari log rekam medis terpadu.
          </div>
        </div>
      </div>
    </div>
  );
}
