/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, MapPin, ChevronDown, Activity, Heart } from "lucide-react";
import ActivePatientsCard from "@/components/ActivePatientsCard";
import dynamic from "next/dynamic";
import RegionDetailPanel from "@/components/RegionDetailPanel";
import TrendsChart from "@/components/TrendsChart";

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

const DISEASE_TO_CODE: Record<string, string> = {
  "Ispa": "J06.9",
  "Flu": "J11",
  "Diare": "A09",
  "DBD": "A90",
  "Darah Tinggi": "I10",
};

export default function Dashboard() {
  const [selectedKecamatan, setSelectedKecamatan] = useState({
    name: "Ngemplak",
    cases: 0,
    status: "Rendah",
  });
  
  const [spatialData, setSpatialData] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<"30" | "90" | "365">("90");
  const [selectedDisease, setSelectedDisease] = useState<string>("all");

  const [temporalData, setTemporalData] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(true);
  const [activeDiseases, setActiveDiseases] = useState<string[]>([
    "Ispa",
    "DBD",
    "Diare",
    "Flu",
    "Darah Tinggi",
  ]);
  const [trendsDateRange, setTrendsDateRange] = useState<"30" | "90" | "365">("90");

  // Fetch Spatial Data for the Map
  useEffect(() => {
    const fetchSpatialData = async () => {
      setLoadingMap(true);
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
      } finally {
        setLoadingMap(false);
      }
    };

    fetchSpatialData();
  }, [dateRange, selectedDisease]);

  // Fetch Temporal Data for Trends Chart
  useEffect(() => {
    const fetchTemporalData = async () => {
      setLoadingTrends(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(trendsDateRange, 10));

        const activeCodes = activeDiseases
          .map((d) => DISEASE_TO_CODE[d])
          .filter(Boolean)
          .join(",");

        let url = `${API_BASE}/api/cases/temporal?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
        if (activeCodes) {
          url += `&diseases=${activeCodes}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch temporal data");
        const data = await res.json();
        setTemporalData(data);
      } catch (err) {
        console.error("Error fetching temporal data:", err);
      } finally {
        setLoadingTrends(false);
      }
    };

    fetchTemporalData();
  }, [trendsDateRange, activeDiseases]);

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

  const handleToggleDisease = (disease: string) => {
    setActiveDiseases((prev) => {
      if (prev.includes(disease)) {
        if (prev.length === 1) return prev; // Keep at least one disease active
        return prev.filter((d) => d !== disease);
      } else {
        return [...prev, disease];
      }
    });
  };

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
          <button className="text-teal-brand hover:scale-110 transition-transform duration-300 relative cursor-pointer" aria-label="Notifikasi">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-[30px] w-full">
        {/* Left Column (9 cols in xl, contains Map, Trends, & Table) */}
        <div className="xl:col-span-9 flex flex-col gap-[30px]">
          
          {/* Map Card */}
          <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-6 shadow-lg h-[486px] relative overflow-hidden flex flex-col justify-between">
            {/* Top row actions on Map */}
            <div className="flex justify-between items-start z-10">
              {/* Location Badge */}
              <div className="bg-[rgba(105,126,128,0.2)] backdrop-blur-sm rounded-[8px] px-4 py-2 flex items-center gap-2 text-white font-josefin">
                <MapPin className="size-[18px] text-teal-300" />
                <span className="text-[14px]">Kabupaten Sleman</span>
              </div>

              {/* Filters & Legend */}
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="appearance-none bg-teal-brand text-white text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-1.5 hover:bg-teal-brand-hover transition-colors duration-200 cursor-pointer shadow-md outline-none border-none"
                    >
                      <option value="30" className="bg-[#0c818a] text-white">30 Hari Terakhir</option>
                      <option value="90" className="bg-[#0c818a] text-white">3 Bulan Terakhir</option>
                      <option value="365" className="bg-[#0c818a] text-white">1 Tahun Terakhir</option>
                    </select>
                    <ChevronDown className="size-[16px] text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedDisease}
                      onChange={(e) => setSelectedDisease(e.target.value)}
                      className="appearance-none bg-teal-brand text-white text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-1.5 hover:bg-teal-brand-hover transition-colors duration-200 cursor-pointer shadow-md outline-none border-none"
                    >
                      <option value="all" className="bg-[#0c818a] text-white">Semua Penyakit</option>
                      <option value="J06.9" className="bg-[#0c818a] text-white">ISPA</option>
                      <option value="J11" className="bg-[#0c818a] text-white">Flu / Influenza</option>
                      <option value="A09" className="bg-[#0c818a] text-white">Diare</option>
                      <option value="A90" className="bg-[#0c818a] text-white">DBD</option>
                      <option value="I10" className="bg-[#0c818a] text-white">Darah Tinggi</option>
                    </select>
                    <ChevronDown className="size-[16px] text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
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

            {/* Map component */}
            <div className="absolute inset-0 size-full z-0">
              <MapComponent
                spatialData={spatialData}
                selectedKecamatanName={selectedKecamatan.name}
                onSelectKecamatan={handleSelectKecamatan}
              />
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

          {/* Trends & Detail Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[30px] w-full">
            {/* Trends Chart (8 cols in lg) */}
            <div className="lg:col-span-8 bg-white border border-teal-500/5 rounded-[16px] p-6 shadow-lg flex flex-col justify-between relative min-h-[400px]">
              {loadingTrends && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="size-6 border-2 border-teal-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-[#0c818a] font-bold text-[18px] font-josefin">Grafik Tren Penyakit</h3>
                  <p className="text-zinc-500 text-[13px] font-josefin mt-0.5">Perbandingan jumlah kasus rekam medis historical</p>
                </div>
                
                {/* Time filter */}
                <div className="relative">
                  <select
                    value={trendsDateRange}
                    onChange={(e) => setTrendsDateRange(e.target.value as any)}
                    className="appearance-none bg-teal-brand text-white text-[14px] font-josefin rounded-[8px] pl-4 pr-10 py-1.5 hover:bg-teal-brand-hover transition-colors duration-200 cursor-pointer shadow-md outline-none border-none"
                  >
                    <option value="30" className="bg-[#0c818a] text-white">30 Hari Terakhir</option>
                    <option value="90" className="bg-[#0c818a] text-white">3 Bulan Terakhir</option>
                    <option value="365" className="bg-[#0c818a] text-white">1 Tahun Terakhir</option>
                  </select>
                  <ChevronDown className="size-[16px] text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Disease Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(DISEASE_TO_CODE).map((disease) => {
                  const isActive = activeDiseases.includes(disease);
                  const colors: Record<string, string> = {
                    "Ispa": "bg-blue-500 text-white border-blue-500",
                    "DBD": "bg-cyan-500 text-white border-cyan-500",
                    "Diare": "bg-pink-500 text-white border-pink-500",
                    "Flu": "bg-orange-500 text-white border-orange-500",
                    "Darah Tinggi": "bg-emerald-500 text-white border-emerald-500",
                  };
                  const inactiveColors: Record<string, string> = {
                    "Ispa": "border-blue-500/30 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10",
                    "DBD": "border-cyan-500/30 text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10",
                    "Diare": "border-pink-500/30 text-pink-500 bg-pink-500/5 hover:bg-pink-500/10",
                    "Flu": "border-orange-500/30 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10",
                    "Darah Tinggi": "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10",
                  };
                  return (
                    <button
                      key={disease}
                      onClick={() => handleToggleDisease(disease)}
                      className={`text-[12px] font-semibold font-josefin rounded-full px-3 py-1 border transition-all duration-200 cursor-pointer ${
                        isActive ? colors[disease] : inactiveColors[disease]
                      }`}
                    >
                      {disease}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 w-full h-[280px]">
                {temporalData.length > 0 ? (
                  <TrendsChart rawData={temporalData} activeDiseases={activeDiseases} />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center py-10 font-josefin text-zinc-500 text-[14px]">
                    <p className="font-bold text-zinc-700 text-[16px]">Tidak ada data penyakit</p>
                    <p className="mt-1">Data rekam medis belum tersedia untuk wilayah dan filter waktu terpilih.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Region Detail Panel (4 cols in lg) */}
            <div className="lg:col-span-4 h-full">
              <RegionDetailPanel kecamatanName={selectedKecamatan.name} />
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
                    Jumlah Kasus (Sleman)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-teal-brand">
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">J06.9</td>
                  <td className="px-6 py-3 font-medium text-[14px]">ISPA (Infeksi Saluran Pernafasan)</td>
                  <td className="px-6 py-3 font-medium text-[14px]">
                    {spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) > 0 
                      ? Math.round(spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) * 0.40)
                      : 80}
                  </td>
                </tr>
                <tr className="bg-white/40 hover:bg-white/60 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">A90</td>
                  <td className="px-6 py-3 font-medium text-[14px]">DBD</td>
                  <td className="px-6 py-3 font-medium text-[14px]">
                    {spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) > 0 
                      ? Math.round(spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) * 0.13)
                      : 60}
                  </td>
                </tr>
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">A09</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Diare</td>
                  <td className="px-6 py-3 font-medium text-[14px]">
                    {spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) > 0 
                      ? Math.round(spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) * 0.15)
                      : 50}
                  </td>
                </tr>
                <tr className="bg-white/40 hover:bg-white/60 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">J11</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Flu / Influenza</td>
                  <td className="px-6 py-3 font-medium text-[14px]">
                    {spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) > 0 
                      ? Math.round(spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) * 0.25)
                      : 32}
                  </td>
                </tr>
                <tr className="bg-[#f7f6fe]/60 hover:bg-[#f7f6fe]/85 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-[14px] text-center">I10</td>
                  <td className="px-6 py-3 font-medium text-[14px]">Hipertensi / Darah Tinggi</td>
                  <td className="px-6 py-3 font-medium text-[14px]">
                    {spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) > 0 
                      ? Math.round(spatialData.reduce((acc, curr) => acc + (curr.total_cases || 0), 0) * 0.07)
                      : 16}
                  </td>
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
