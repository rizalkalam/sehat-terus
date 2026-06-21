"use client";

import React, { useState } from "react";
import { Search, Bell, ChevronDown, Activity, TrendingUp, Info } from "lucide-react";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";

// Mock historical + forecasted data
const trendData = [
  { date: "01 Jun", actual: 40, forecast: null, ciLower: null, ciUpper: null },
  { date: "08 Jun", actual: 48, forecast: null, ciLower: null, ciUpper: null },
  { date: "15 Jun", actual: 52, forecast: null, ciLower: null, ciUpper: null },
  { date: "22 Jun", actual: 60, forecast: null, ciLower: null, ciUpper: null },
  { date: "29 Jun", actual: 64, forecast: null, ciLower: null, ciUpper: null },
  { date: "06 Jul", actual: 70, forecast: 70, ciLower: 70, ciUpper: 70 },
  { date: "13 Jul", actual: null, forecast: 74, ciLower: 65, ciUpper: 83 },
  { date: "20 Jul", actual: null, forecast: 79, ciLower: 68, ciUpper: 90 },
  { date: "27 Jul", actual: null, forecast: 85, ciLower: 70, ciUpper: 100 },
];

export default function TrendPage() {
  const [selectedDisease, setSelectedDisease] = useState("Demam Berdarah Dengue (DBD)");
  const [selectedKecamatan, setSelectedKecamatan] = useState("Semua Kecamatan");
  const [timeframe, setTimeframe] = useState("3 Bulan Terakhir");

  return (
    <div className="p-[40px] flex flex-col gap-[30px] h-full min-h-screen text-black select-none">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full">
        <div>
          <p className="text-[#0c818a] font-semibold text-[20px] font-josefin leading-normal">
            Selamat datang, Carmen
          </p>
          <h1 className="text-black font-normal text-[40px] font-josefin leading-none mt-1">
            Trend
          </h1>
        </div>

        <div className="flex items-center gap-[24px]">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-black/10 hover:bg-black/15 text-[12px] font-josefin text-white border border-transparent rounded-[16px] px-4 py-2 w-[195px] transition-all duration-300">
            <Search className="size-[18px] text-teal-brand" />
            <input
              type="text"
              placeholder="Cari wilayah lain"
              className="bg-transparent border-none outline-none placeholder-zinc-500 text-black w-full"
            />
          </div>

          {/* Notification */}
          <button className="text-teal-brand hover:scale-110 transition-transform duration-300 relative cursor-pointer">
            <Bell className="size-[24px]" />
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full animate-ping" />
          </button>

          {/* Profile Avatar */}
          <div className="flex items-center gap-[18px]">
            <div className="border-3 border-teal-brand rounded-full size-[60px] overflow-hidden bg-white/50 flex items-center justify-center">
              <div className="bg-gradient-to-tr from-teal-500 to-[#3f9cab] size-full flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
            </div>
            <span className="text-[20px] font-semibold font-josefin text-black">
              Carmenita
            </span>
          </div>
        </div>
      </header>

      {/* Control Filters Bar */}
      <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-5 shadow-md flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {/* Disease Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-teal-brand/80 font-bold uppercase tracking-wider font-montserrat">Penyakit</span>
            <div className="relative w-[260px]">
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="bg-white/80 border border-teal-brand/10 text-teal-brand text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-2 w-full hover:bg-white transition-colors duration-200 cursor-pointer shadow-sm outline-none appearance-none"
              >
                <option value="Demam Berdarah Dengue (DBD)">Demam Berdarah Dengue (DBD)</option>
                <option value="Infeksi Saluran Pernafasan (ISPA)">Infeksi Saluran Pernafasan (ISPA)</option>
                <option value="Diare">Diare</option>
                <option value="Flu">Flu</option>
                <option value="Darah Tinggi">Darah Tinggi</option>
              </select>
              <ChevronDown className="size-[16px] text-teal-brand absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kecamatan Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-teal-brand/80 font-bold uppercase tracking-wider font-montserrat">Kecamatan</span>
            <div className="relative w-[180px]">
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="bg-white/80 border border-teal-brand/10 text-teal-brand text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-2 w-full hover:bg-white transition-colors duration-200 cursor-pointer shadow-sm outline-none appearance-none"
              >
                <option value="Semua Kecamatan">Semua Kecamatan</option>
                <option value="Ngemplak">Ngemplak</option>
                <option value="Depok">Depok</option>
                <option value="Gamping">Gamping</option>
                <option value="Mlati">Mlati</option>
              </select>
              <ChevronDown className="size-[16px] text-teal-brand absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-teal-brand/80 font-bold uppercase tracking-wider font-montserrat">Rentang Waktu</span>
            <div className="relative w-[160px]">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-white/80 border border-teal-brand/10 text-teal-brand text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-2 w-full hover:bg-white transition-colors duration-200 cursor-pointer shadow-sm outline-none appearance-none"
              >
                <option value="3 Bulan Terakhir">3 Bulan Terakhir</option>
                <option value="6 Bulan Terakhir">6 Bulan Terakhir</option>
                <option value="1 Tahun Terakhir">1 Tahun Terakhir</option>
              </select>
              <ChevronDown className="size-[16px] text-teal-brand absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-xs font-montserrat font-semibold text-teal-brand mt-4 xl:mt-0">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-teal-brand inline-block border-t-2 border-teal-brand" />
            <span>Kasus Riwayat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-purple-500 inline-block" />
            <span>Proyeksi Tren</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-purple-500/10 border border-purple-500/20 inline-block rounded-sm" />
            <span>Interval Kepercayaan</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[30px] w-full">
        {/* Chart Card */}
        <div className="lg:col-span-8 bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-6 shadow-lg h-[480px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-teal-brand text-[16px] flex items-center gap-2">
              <TrendingUp className="size-[18px]" />
              Grafik Deret Waktu & Estimasi Masa Depan
            </h3>
            <span className="text-xs text-teal-brand/60 font-medium">Model: Double Exponential Smoothing</span>
          </div>

          <div className="flex-1 w-full h-[350px] mt-4 font-montserrat text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(12, 129, 138, 0.1)" />
                <XAxis dataKey="date" stroke="#0c818a" />
                <YAxis stroke="#0c818a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(12, 129, 138, 0.2)",
                    borderRadius: "12px",
                    color: "#0c818a",
                    backdropFilter: "blur(4px)",
                  }}
                />
                {/* Confidence Interval Shading */}
                <Area
                  type="monotone"
                  dataKey="ciUpper"
                  stroke="none"
                  fill="rgba(168, 85, 247, 0.05)"
                />
                <Area
                  type="monotone"
                  dataKey="ciLower"
                  stroke="none"
                  fill="rgba(168, 85, 247, 0.05)"
                />
                {/* Actual Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#0c818a"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5, fill: "#0c818a" }}
                  name="Jumlah Kasus"
                />
                {/* Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5, fill: "#a855f7" }}
                  name="Proyeksi Kasus"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Insight Card */}
        <div className="lg:col-span-4 flex flex-col gap-[30px]">
          {/* Analysis Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-lg flex-1 flex flex-col justify-between border border-teal-500/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-teal-brand">
                <Activity className="size-[20px]" />
                <span className="font-bold text-[16px]">Informasi Analitis</span>
              </div>

              <div className="space-y-3 font-josefin text-zinc-800">
                <div className="bg-zinc-50 p-3.5 rounded-[12px] border border-zinc-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-zinc-500 font-semibold uppercase leading-none">Rata-rata Kasus</p>
                    <p className="text-[20px] font-bold text-teal-brand mt-1">45.2 <span className="text-[12px] font-normal text-zinc-500">/ minggu</span></p>
                  </div>
                  <span className="p-2 bg-teal-500/10 text-teal-brand rounded-full">
                    <TrendingUp className="size-5" />
                  </span>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-[12px] border border-zinc-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-zinc-500 font-semibold uppercase leading-none">Laju Pertumbuhan</p>
                    <p className="text-[20px] font-bold text-teal-brand mt-1">+4.2% <span className="text-[12px] font-normal text-zinc-500">mingguan</span></p>
                  </div>
                  <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-full">
                    <TrendingUp className="size-5" />
                  </span>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-[12px] border border-zinc-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-zinc-500 font-semibold uppercase leading-none">Status Wilayah</p>
                    <p className="text-[20px] font-bold text-amber-500 mt-1">SIAGA OUTBREAK</p>
                  </div>
                  <span className="p-2 bg-amber-500/10 text-amber-500 rounded-full animate-pulse">
                    <Info className="size-5" />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-zinc-400 font-medium leading-relaxed">
              *Prediksi dihitung otomatis menggunakan data time-series historis 3 bulan terakhir. Margin error proyeksi model ±8.5%.
            </div>
          </div>

          {/* Bottom Card Greeting */}
          <div className="bg-[#0c818a] h-[59px] rounded-[14px] flex items-center justify-center text-white shadow-md">
            <p className="font-josefin text-[22px] whitespace-nowrap">
              <span className="font-normal">Salam </span>
              <span className="font-bold">Sehat</span>
              <span className="font-light opacity-80">Terus</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
