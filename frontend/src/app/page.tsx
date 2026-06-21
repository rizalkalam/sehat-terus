"use client";

import React, { useState } from "react";
import { Search, Bell, MapPin, ChevronDown, Activity, Heart } from "lucide-react";
import ActivePatientsCard from "@/components/ActivePatientsCard";

export default function Dashboard() {
  const [selectedKecamatan, setSelectedKecamatan] = useState({
    name: "Ngemplak",
    cases: 216,
    status: "Tinggi",
  });

  return (
    <div className="p-[40px] flex flex-col gap-[30px] h-full min-h-screen text-black select-none">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full">
        <div>
          <p className="text-[#0c818a] font-semibold text-[20px] font-josefin leading-normal">
            Selamat datang, Carmen
          </p>
          <h1 className="text-black font-normal text-[40px] font-josefin leading-none mt-1">
            Dashboard
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
              {/* Fallback mockup avatar image */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-[30px] w-full">
        {/* Left Column (9 cols in xl, contains Map & Table) */}
        <div className="xl:col-span-9 flex flex-col gap-[30px]">
          {/* Map Card */}
          <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-6 shadow-lg h-[486px] relative overflow-hidden flex flex-col justify-between">
            {/* Top row actions on Map */}
            <div className="flex justify-between items-start z-10">
              {/* Location Badge */}
              <div className="bg-[rgba(105,126,128,0.2)] backdrop-blur-sm rounded-[8px] px-4 py-2 flex items-center gap-2 text-white font-josefin">
                <MapPin className="size-[18px] text-teal-300" />
                <span className="text-[14px]">D.I. Yogyakarta</span>
              </div>

              {/* Filters & Legend */}
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <button className="bg-teal-brand text-white text-[14px] font-josefin rounded-[8px] px-4 py-1.5 flex items-center gap-2 hover:bg-teal-brand-hover transition-colors duration-200 cursor-pointer shadow-md">
                    <span>3 Bulan Terakhir</span>
                    <ChevronDown className="size-[16px]" />
                  </button>
                  <button className="bg-teal-brand text-white text-[14px] font-josefin rounded-[8px] px-4 py-1.5 flex items-center gap-2 hover:bg-teal-brand-hover transition-colors duration-200 cursor-pointer shadow-md">
                    <span>Kategori</span>
                    <ChevronDown className="size-[16px]" />
                  </button>
                </div>
                
                {/* Legend Card */}
                <div className="bg-[rgba(105,126,128,0.2)] backdrop-blur-sm rounded-[8px] p-3 flex flex-col gap-1.5 text-white font-josefin text-[14px] w-[105px]">
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-emerald-400 rounded-full" />
                    <span>Rendah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-amber-400 rounded-full" />
                    <span>Sedang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-rose-500 rounded-full animate-pulse" />
                    <span>Tinggi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Yogyakarta Map SVG/Drawing */}
            <div className="absolute inset-0 size-full flex items-center justify-center p-8 z-0">
              <svg
                viewBox="0 0 800 400"
                className="w-full h-full max-h-[350px] opacity-75 drop-shadow-2xl"
              >
                {/* Mock Yogyakarta districts path */}
                <path
                  d="M150,150 L200,80 L250,90 L320,120 L380,80 L440,110 L480,90 L520,130 L600,100 L680,180 L620,230 L550,210 L520,280 L440,320 L400,270 L340,330 L280,290 L220,350 L150,310 L170,220 Z"
                  fill="#2d7a82"
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="transition-colors duration-300 hover:fill-[#37949d] cursor-pointer"
                  onClick={() => setSelectedKecamatan({ name: "Mlati", cases: 312, status: "Tinggi" })}
                />
                <path
                  d="M320,120 L380,80 L440,110 L480,90 L400,180 L350,160 Z"
                  fill="#c084fc"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-300 hover:fill-[#a855f7] cursor-pointer"
                  onClick={() => setSelectedKecamatan({ name: "Ngemplak", cases: 216, status: "Tinggi" })}
                />
                <path
                  d="M200,80 L250,90 L320,120 L350,160 L280,200 L200,150 Z"
                  fill="#facc15"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-300 hover:fill-[#eab308] cursor-pointer"
                  onClick={() => setSelectedKecamatan({ name: "Depok", cases: 142, status: "Sedang" })}
                />
                <path
                  d="M150,150 L200,150 L280,200 L220,250 L170,220 Z"
                  fill="#4ade80"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-300 hover:fill-[#22c55e] cursor-pointer"
                  onClick={() => setSelectedKecamatan({ name: "Gamping", cases: 48, status: "Rendah" })}
                />
                {/* Labels and Pins */}
                <circle cx="360" cy="120" r="6" fill="#f43f5e" className="animate-ping" />
                <circle cx="360" cy="120" r="4" fill="#f43f5e" />
              </svg>
            </div>

            {/* Kecamatan Detail Popover (Bottom Left) */}
            <div className="bg-[rgba(105,126,128,0.3)] backdrop-blur-md rounded-[8px] p-4 text-white font-josefin w-[194px] z-10 shadow-lg border border-white/10">
              <p className="text-[14px]">
                <span className="font-bold">Kecamatan:</span> {selectedKecamatan.name}
              </p>
              <p className="text-[14px] mt-1">
                <span className="font-bold">Total Kasus:</span> {selectedKecamatan.cases}
              </p>
              <p className="text-[14px] mt-1 flex items-center gap-1.5">
                <span className="font-bold">Status:</span>
                <span className={`size-2.5 rounded-full inline-block ${
                  selectedKecamatan.status === "Tinggi" ? "bg-rose-500" :
                  selectedKecamatan.status === "Sedang" ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                <span>{selectedKecamatan.status}</span>
              </p>
            </div>
          </div>

          {/* Disease Table */}
          <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] shadow-lg overflow-y-auto h-[294px]">
            <table className="w-full text-left border-collapse font-montserrat">
              <thead>
                <tr className="bg-white border-b border-zinc-200">
                  <th className="px-6 py-4 text-teal-brand font-bold text-[14px] text-center w-1/3">
                    Kode ICD-10
                  </th>
                  <th className="px-6 py-4 text-teal-brand font-bold text-[14px] w-1/3">
                    Nama Medis / Awam
                  </th>
                  <th className="px-6 py-4 text-teal-brand font-bold text-[14px] w-1/3">
                    Jumlah Kasus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-teal-brand">
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">#89094</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Infeksi Saluran Pernafasan</td>
                  <td className="px-6 py-3 font-medium text-[14px]">80</td>
                </tr>
                <tr className="bg-white/40 hover:bg-white/60 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">#85252</td>
                  <td className="px-6 py-3 font-medium text-[14px]">DBD</td>
                  <td className="px-6 py-3 font-medium text-[14px]">60</td>
                </tr>
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">#89094</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Diare</td>
                  <td className="px-6 py-3 font-medium text-[14px]">50</td>
                </tr>
                <tr className="bg-white/40 hover:bg-white/60 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">#85252</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Flue</td>
                  <td className="px-6 py-3 font-medium text-[14px]">32</td>
                </tr>
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">#89094</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Darah Tinggi</td>
                  <td className="px-6 py-3 font-medium text-[14px]">16</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (3 cols in xl, contains widgets) */}
        <div className="xl:col-span-3 flex flex-col gap-[30px] h-full justify-between">
          {/* Active Patients Card */}
          <ActivePatientsCard />

          {/* Disease Composition Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-lg h-[389px] flex flex-col justify-between border border-teal-500/5">
            <div className="flex items-center gap-2 text-teal-brand font-josefin">
              <Activity className="size-[20px]" />
              <span className="font-bold text-[16px]">Komposisi Penyakit</span>
            </div>

            {/* Mini donut display */}
            <div className="flex justify-center items-center relative py-4">
              <svg className="size-[165px]" viewBox="0 0 165 165">
                <circle cx="82.5" cy="82.5" r="60" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="377" strokeDashoffset="100" />
                <circle cx="82.5" cy="82.5" r="60" fill="transparent" stroke="#06b6d4" strokeWidth="15" strokeDasharray="377" strokeDashoffset="220" />
                <circle cx="82.5" cy="82.5" r="60" fill="transparent" stroke="#ec4899" strokeWidth="15" strokeDasharray="377" strokeDashoffset="280" />
                <circle cx="82.5" cy="82.5" r="60" fill="transparent" stroke="#f97316" strokeWidth="15" strokeDasharray="377" strokeDashoffset="320" />
                <circle cx="82.5" cy="82.5" r="60" fill="transparent" stroke="#10b981" strokeWidth="15" strokeDasharray="377" strokeDashoffset="350" />
                <circle cx="82.5" cy="82.5" r="44" fill="#ffffff" />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-[#454459] font-normal font-josefin text-[14px] opacity-75">
                  September
                </span>
              </div>
            </div>

            {/* Colored Heart Legends */}
            <div className="bg-zinc-100/60 rounded-[12px] p-3 flex flex-wrap gap-x-4 gap-y-2 justify-center font-josefin text-[13px] text-zinc-800">
              <div className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-blue-500 text-blue-500" />
                <span>Ispa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-cyan-500 text-cyan-500" />
                <span>DBD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-pink-500 text-pink-500" />
                <span>Diare</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-orange-500 text-orange-500" />
                <span>Flu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-emerald-500 text-emerald-500" />
                <span className="truncate max-w-[80px]">Darah Tinggi</span>
              </div>
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
