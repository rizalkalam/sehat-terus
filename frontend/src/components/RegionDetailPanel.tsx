/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";

interface RegionDetail {
  name: string;
  population: number;
  cases: number;
}

interface RegionDetailPanelProps {
  kecamatanName: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegionDetailPanel({ kecamatanName }: RegionDetailPanelProps) {
  const [detail, setDetail] = useState<RegionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kecamatanName) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/cases/region/${kecamatanName}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil detail wilayah");
        }
        const data = await res.json();
        setDetail(data);
      } catch (err: any) {
        console.error(err);
        setError("Koneksi ke server terputus.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [kecamatanName]);

  if (error) {
    return (
      <div className="bg-red-50/10 border border-red-500/20 backdrop-blur-md rounded-[16px] p-6 text-red-500 font-josefin text-center text-[14px]">
        {error}
      </div>
    );
  }

  // Calculate incidence rate per 10,000 residents
  const incidenceRate = detail && detail.population > 0
    ? ((detail.cases / detail.population) * 10000).toFixed(2)
    : "0.00";

  return (
    <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-full min-h-[180px] font-josefin text-black">
      {loading && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="size-6 border-2 border-teal-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div>
        <h3 className="text-[#0c818a] font-bold text-[18px] mb-4">Detail Wilayah</h3>
        
        {detail ? (
          <div className="flex flex-col gap-3 text-[15px]">
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="font-semibold text-zinc-700">Kecamatan:</span>
              <span className="text-black font-bold">{detail.name}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="font-semibold text-zinc-700">Total Kasus:</span>
              <span className="text-black font-bold">{detail.cases}</span>
            </div>

            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="font-semibold text-zinc-700">Populasi:</span>
              <span className="text-black font-bold">{detail.population.toLocaleString("id-ID")} jiwa</span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="font-semibold text-zinc-700">Angka Insidensi:</span>
              <span className="text-[#0c818a] font-bold">{incidenceRate} <span className="text-[12px] font-normal text-zinc-500">/10k pend.</span></span>
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-4">Pilih kecamatan di peta untuk melihat detail.</div>
        )}
      </div>
    </div>
  );
}
