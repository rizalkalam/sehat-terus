/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, MapPin, ChevronDown, Activity, Heart } from "lucide-react";
import ActivePatientsCard from "@/components/ActivePatientsCard";
import dynamic from "next/dynamic";

// Dynamic import MapComponent with ssr: false to avoid window is not defined error on server side
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="size-full flex items-center justify-center bg-black/5 rounded-[16px] backdrop-blur-sm border border-white/15">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 border-3 border-teal-brand border-t-transparent rounded-full animate-spin" />
        <span className="font-josefin text-[15px] text-[#0c818a]">Memuat Peta...</span>
      </div>
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface SpatialCase {
  kecamatan_domisili: string;
  total_cases: number;
  population: number;
}

// Helpers matching Figma design
const HealthHeart = ({ className, fill = "currentColor" }: { className?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path d="M12 7v6M9.5 10.5h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SortIcon = () => (
  <svg className="size-[16px] text-[#0c818a] shrink-0 opacity-80 cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3.5L6.5 9h11L12 3.5zm0 17l5.5-5.5h-11l5.5 5.5z" />
  </svg>
);

const getIndonesianMonth = () => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months[new Date().getMonth()];
};

export default function Dashboard() {
  const [selectedKecamatan, setSelectedKecamatan] = useState({
    name: "Ngemplak",
    cases: 216,
    status: "Tinggi",
  });
  
  const [spatialData, setSpatialData] = useState<SpatialCase[]>([]);
  const [dateRange, setDateRange] = useState<"30" | "90" | "365">("90");
  const [selectedDisease, setSelectedDisease] = useState<string>("all");

  const [selectedDetail, setSelectedDetail] = useState<{
    name: string;
    population: number;
    cases: number;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Spatial Data for the Map
  useEffect(() => {
    const fetchSpatialData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange, 10));

        let url = `${API_BASE}/api/cases/spatial?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
        if (selectedDisease !== "all") {
          url += `&diseases=${selectedDisease}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch spatial data");
        const data = await res.json();
        setSpatialData(data);

        // Update selected kecamatan cases/status if it exists in data
        const currentKec = selectedKecamatan.name;
        const matching = data.find(
          (item: any) =>
            item.kecamatan_domisili.toLowerCase() === currentKec.toLowerCase()
        );
        if (matching) {
          const cases = matching.total_cases;
          const status = cases > 150 ? "Tinggi" : cases >= 50 ? "Sedang" : "Rendah";
          setSelectedKecamatan({
            name: matching.kecamatan_domisili,
            cases,
            status,
          });
        } else {
          setSelectedKecamatan({
            name: currentKec,
            cases: 0,
            status: "Rendah",
          });
        }
      } catch (err) {
        console.error("Error fetching spatial cases:", err);
      }
    };

    fetchSpatialData();
  }, [dateRange, selectedDisease]);

  // Fetch details for the popover panel
  useEffect(() => {
    if (!selectedKecamatan.name) return;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`${API_BASE}/api/cases/region/${selectedKecamatan.name}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedDetail(data);
        }
      } catch (err) {
        console.error("Error fetching region detail:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedKecamatan.name]);

  const handleSelectKecamatan = (name: string) => {
    const item = spatialData.find(
      (d) => d.kecamatan_domisili.toLowerCase() === name.toLowerCase()
    );
    const cases = item ? item.total_cases : 0;
    const status = cases > 150 ? "Tinggi" : cases >= 50 ? "Sedang" : "Rendah";
    setSelectedKecamatan({
      name,
      cases,
      status
    });
  };

  // Math-scaled proportional cases based on Figma's proportions (Total 238)
  const totalCases = spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0);
  const ispaCases = totalCases > 0 ? Math.round(totalCases * (80 / 238)) : 80;
  const dbdCases = totalCases > 0 ? Math.round(totalCases * (60 / 238)) : 60;
  const diareCases = totalCases > 0 ? Math.round(totalCases * (50 / 238)) : 50;
  const fluCases = totalCases > 0 ? Math.round(totalCases * (32 / 238)) : 32;
  const darahTinggiCases = totalCases > 0 ? Math.round(totalCases * (16 / 238)) : 16;

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      {/* Top Header */}
      <header className="flex justify-between items-start w-full">
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
          <div className="flex items-center gap-2 bg-[rgba(105,126,128,0.2)] hover:bg-[rgba(105,126,128,0.3)] text-[12px] font-josefin text-white border border-transparent rounded-[16px] px-[18px] py-[8px] w-[196px] transition-all duration-300">
            <Search className="size-[18px] text-white" />
            <input
              type="text"
              placeholder="Cari wilayah lain"
              className="bg-transparent border-none outline-none placeholder-white/70 text-white font-light text-[12px] w-full"
            />
          </div>

          {/* Notification */}
          <button className="text-[#0c818a] hover:scale-110 transition-transform duration-300 relative cursor-pointer" aria-label="Notifikasi">
            <Bell className="size-[24px] fill-[#0c818a]" />
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full animate-ping" />
          </button>

          {/* Profile Avatar */}
          <div className="flex items-center gap-[18px]">
            <div className="border-3 border-[#0c818a] rounded-full size-[60px] overflow-hidden bg-white/50 flex items-center justify-center relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Carmenita"
                className="size-full object-cover"
              />
            </div>
            <span className="text-[20px] font-semibold font-josefin text-black whitespace-nowrap">
              Carmenita
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex flex-row gap-[25px] w-full items-start">
        {/* Left Column (holds Map and Table) */}
        <div className="flex-1 min-w-0 flex flex-col gap-[25px]">
          
          {/* Map Card */}
          <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] h-[486px] relative overflow-hidden flex flex-col justify-between shrink-0">
            {/* Map component */}
            <div className="absolute inset-0 size-full z-0">
              <MapComponent
                spatialData={spatialData}
                selectedKecamatanName={selectedKecamatan.name}
                onSelectKecamatan={handleSelectKecamatan}
              />
            </div>

            {/* Overlays inside Map Card */}
            {/* Bottom Left: Location & Kecamatan Detail popover */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2.5 z-10 items-start">
              {/* Location Badge */}
              <div className="bg-[rgba(105,126,128,0.3)] backdrop-blur-md border border-white/10 rounded-[8px] px-[17px] py-[8px] flex items-center gap-3 text-white w-[194px] shadow-md">
                <MapPin className="size-[18px] text-white fill-white/20" />
                <span className="text-[14px] font-josefin font-normal">D.I. Yogyakarta</span>
              </div>

              {/* Kecamatan Detail Popover */}
              <div className="bg-[rgba(105,126,128,0.3)] backdrop-blur-md border border-white/10 rounded-[8px] px-[12px] py-[11px] text-white w-[173px] shadow-md flex flex-col gap-1 relative min-h-[64px]">
                {loadingDetail && (
                  <div className="absolute inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center rounded-[8px]">
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <p className="text-[14px] font-josefin leading-normal">
                  <span className="font-bold">Kecamatan:</span> {selectedKecamatan.name}
                </p>
                <p className="text-[14px] font-josefin leading-normal">
                  <span className="font-bold">Total Kasus:</span> {selectedKecamatan.cases}
                </p>
                {selectedDetail && (
                  <>
                    <p className="text-[14px] font-josefin leading-normal">
                      <span className="font-bold">Populasi:</span> {selectedDetail.population.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[14px] font-josefin leading-normal">
                      <span className="font-bold">Insidensi:</span> {((selectedDetail.cases / selectedDetail.population) * 10000).toFixed(1)} /10k
                    </p>
                  </>
                )}
                <p className="text-[14px] font-josefin leading-normal flex items-center gap-1.5">
                  <span className="font-bold">Status:</span>
                  <span className={`size-2.5 rounded-full inline-block ${
                    selectedKecamatan.status === "Tinggi" ? "bg-rose-500" :
                    selectedKecamatan.status === "Sedang" ? "bg-amber-400" : "bg-emerald-400"
                  }`} />
                  <span>{selectedKecamatan.status}</span>
                </p>
              </div>
            </div>

            {/* Top Right: Filters & Legend */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 items-end">
              {/* Date Range Selector */}
              <div className="relative w-[152px]">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="appearance-none w-full bg-[#0c818a] hover:bg-[#0a6d75] transition-colors duration-200 text-white text-[14px] font-josefin rounded-[8px] pl-4 pr-8 py-1 cursor-pointer shadow-md border-none focus:outline-none"
                >
                  <option value="30" className="bg-[#0c818a] text-white">30 Hari Terakhir</option>
                  <option value="90" className="bg-[#0c818a] text-white">3 Bulan Terakhir</option>
                  <option value="365" className="bg-[#0c818a] text-white">1 Tahun Terakhir</option>
                </select>
                <ChevronDown className="size-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Disease Selector */}
              <div className="relative w-[152px]">
                <select
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                  className="appearance-none w-full bg-[#0c818a] hover:bg-[#0a6d75] transition-colors duration-200 text-white text-[14px] font-josefin rounded-[8px] pl-4 pr-8 py-1 cursor-pointer shadow-md border-none focus:outline-none"
                >
                  <option value="all" className="bg-[#0c818a] text-white">Semua Penyakit</option>
                  <option value="J06.9" className="bg-[#0c818a] text-white">ISPA</option>
                  <option value="J11" className="bg-[#0c818a] text-white">Flu / Influenza</option>
                  <option value="A09" className="bg-[#0c818a] text-white">Diare</option>
                  <option value="A90" className="bg-[#0c818a] text-white">DBD</option>
                  <option value="I10" className="bg-[#0c818a] text-white">Darah Tinggi</option>
                </select>
                <ChevronDown className="size-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Legend Card */}
              <div className="bg-[rgba(105,126,128,0.3)] backdrop-blur-md border border-white/10 rounded-[8px] p-3 flex flex-col gap-1.5 text-white font-josefin text-[14px] w-[105px] shadow-md">
                <div className="flex items-center gap-2">
                  <span className="size-3 bg-[#34d399] rounded-full border border-white/20" />
                  <span>Rendah</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 bg-[#fbbf24] rounded-full border border-white/20" />
                  <span>Sedang</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 bg-[#f43f5e] rounded-full border border-white/20" />
                  <span>Tinggi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disease Table */}
          <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] overflow-y-auto h-[294px] shrink-0">
            <table className="w-full border-collapse font-montserrat">
              <thead>
                <tr className="bg-white">
                  <th className="p-4 text-[#0c818a] font-bold text-[14px] text-center">
                    Kode IDC-10
                  </th>
                  <th className="p-4 text-[#0c818a] font-bold text-[14px] text-left">
                    <div className="flex items-center gap-1">
                      <span>Nama Medis / Awam</span>
                      <SortIcon />
                    </div>
                  </th>
                  <th className="p-4 text-[#0c818a] font-bold text-[14px] text-left">
                    <div className="flex items-center gap-2">
                      <span>Jumlah Kasus</span>
                      <SortIcon />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#0c818a]">
                <tr className="bg-[#f7f6fe]">
                  <td className="p-4 font-medium text-[14px] text-center">#89094</td>
                  <td className="p-4 font-medium text-[14px]">Infeksi Saluran Pernafasan</td>
                  <td className="p-4 font-medium text-[14px]">{ispaCases}</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-medium text-[14px] text-center">#85252</td>
                  <td className="p-4 font-medium text-[14px]">DBD</td>
                  <td className="p-4 font-medium text-[14px]">{dbdCases}</td>
                </tr>
                <tr className="bg-[#f7f6fe]">
                  <td className="p-4 font-medium text-[14px] text-center">#89094</td>
                  <td className="p-4 font-medium text-[14px]">Diare</td>
                  <td className="p-4 font-medium text-[14px]">{diareCases}</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-medium text-[14px] text-center">#85252</td>
                  <td className="p-4 font-medium text-[14px]">Flu</td>
                  <td className="p-4 font-medium text-[14px]">{fluCases}</td>
                </tr>
                <tr className="bg-[#f7f6fe]">
                  <td className="p-4 font-medium text-[14px] text-center">#89094</td>
                  <td className="p-4 font-medium text-[14px]">Darah Tinggi</td>
                  <td className="p-4 font-medium text-[14px]">{darahTinggiCases}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (holds widgets) */}
        <div className="w-[226px] flex flex-col gap-[25px] shrink-0">
          {/* Active Patients Card */}
          <ActivePatientsCard />

          {/* Disease Composition Card */}
          <div className="bg-white rounded-[24px] px-[17px] py-[15px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] h-[389px] w-full flex flex-col justify-between border border-teal-500/5 select-none shrink-0">
            <div className="flex items-center gap-2 text-[#0c818a] font-josefin justify-center">
              <HealthHeart className="size-[20px] fill-[#0c818a]" />
              <span className="font-bold text-[16px] leading-normal">Komposisi Penyakit</span>
            </div>

            {/* Premium SVG donut display */}
            <div className="flex justify-center items-center relative py-1 shrink-0">
              <svg className="size-[165px] rotate-[-90deg]" viewBox="0 0 165 165">
                {/* Circumference C = 2 * PI * 52.5 = 329.87 */}
                {/* 15px stroke width. Outer radius 60, Inner radius 45 */}
                {/* Segments: Darah Tinggi(6.7%), DBD(25.2%), Diare(21%), Flu(13.5%), ISPA(33.6%) */}
                <circle
                  cx="82.5"
                  cy="82.5"
                  r="52.5"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="15"
                  strokeDasharray="22.1 329.87"
                  strokeDashoffset="0"
                />
                <circle
                  cx="82.5"
                  cy="82.5"
                  r="52.5"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="15"
                  strokeDasharray="83.1 329.87"
                  strokeDashoffset="-22.1"
                />
                <circle
                  cx="82.5"
                  cy="82.5"
                  r="52.5"
                  fill="transparent"
                  stroke="#ec4899"
                  strokeWidth="15"
                  strokeDasharray="69.3 329.87"
                  strokeDashoffset="-105.2"
                />
                <circle
                  cx="82.5"
                  cy="82.5"
                  r="52.5"
                  fill="transparent"
                  stroke="#34d399"
                  strokeWidth="15"
                  strokeDasharray="44.5 329.87"
                  strokeDashoffset="-174.5"
                />
                <circle
                  cx="82.5"
                  cy="82.5"
                  r="52.5"
                  fill="transparent"
                  stroke="#fbbf24"
                  strokeWidth="15"
                  strokeDasharray="110.8 329.87"
                  strokeDashoffset="-219.0"
                />
              </svg>
              {/* Inner Circle content */}
              <div className="absolute text-center flex flex-col items-center justify-center inset-0">
                <span className="text-[#454459]/70 font-josefin text-[14px] font-normal leading-normal">
                  {getIndonesianMonth()}
                </span>
              </div>
            </div>

            {/* Colored HealthHeart Legends */}
            <div className="bg-[rgba(196,196,196,0.2)] rounded-[12px] px-[16px] py-[12px] flex flex-col gap-2 font-josefin text-[14px] text-black w-full h-[144px] shrink-0 justify-center">
              <div className="flex items-center gap-2.5">
                <HealthHeart className="size-[16px] fill-[#fbbf24]" />
                <span>Ispa</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HealthHeart className="size-[16px] fill-[#38bdf8]" />
                <span>DBD</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HealthHeart className="size-[16px] fill-[#ec4899]" />
                <span>Diare</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HealthHeart className="size-[16px] fill-[#34d399]" />
                <span>Flu</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HealthHeart className="size-[16px] fill-[#ef4444]" />
                <span>Darah Tinggi</span>
              </div>
            </div>
          </div>

          {/* Bottom Card Greeting */}
          <div className="bg-[#0c818a] h-[59px] w-full rounded-[14px] flex items-center justify-center text-white shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] shrink-0 select-none">
            <p className="font-josefin text-[24px] whitespace-nowrap leading-none flex items-center justify-center">
              <span className="font-normal">Salam&nbsp;</span>
              <span className="font-bold">Sehat</span>
              <span className="font-light opacity-80">Terus</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
