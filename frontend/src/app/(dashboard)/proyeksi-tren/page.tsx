"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Activity, ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/PageHeader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TemporalRecord {
  visit_date: string;
  kode_icd10: string;
  nama_penyakit: string;
  total_cases: number;
}

interface ChartPoint {
  month: string;
  v1: number;
  v2: number;
}

interface DiseaseOption {
  kode_icd10: string;
  nama_penyakit: string;
}

const alertData = [
  {
    title: "Tren ISPA Menanjak",
    change: "+45%",
    description:
      "Sistem memprediksi kenaikan kasus 45% dalam 2 minggu mendatang berdasarkan analisis pola musiman dan data historis.",
    recommendation:
      "Amankan stok Ibuprofen dan Masker Medis minimal 300 unit sebelum tanggal 15.",
    items: ["Ibu Profen", "Masker Medis"],
  },
  {
    title: "Tren DBD Meningkat",
    change: "+32%",
    description:
      "Kasus DBD menunjukkan pola kenaikan di wilayah Sleman bagian utara sejalan dengan peningkatan curah hujan.",
    recommendation:
      "Tingkatkan fogging dan distribusi abate di Kecamatan Ngemplak dan Pakem minimal 500 titik.",
    items: ["Abate", "Fogging Kit"],
  },
  {
    title: "Puncak Diare Musiman",
    change: "+28%",
    description:
      "Pola historis menunjukkan lonjakan kasus diare setiap pergantian musim. Wilayah Depok paling rentan.",
    recommendation:
      "Pastikan ketersediaan oralit dan zinc tablet di puskesmas Depok dan Gamping sebelum tanggal 20.",
    items: ["Oralit", "Zinc Tablet"],
  },
];

interface CustomTickProps {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
  index?: number;
  isLast?: boolean;
  [key: string]: unknown;
}

function CustomXTick({ x = 0, y = 0, payload, isLast = false }: CustomTickProps) {
  const xNum = typeof x === "string" ? parseFloat(x) : x;
  const yNum = typeof y === "string" ? parseFloat(y) : y;
  const isCurrent = isLast;
  return (
    <text
      x={xNum}
      y={yNum + 10}
      textAnchor="middle"
      fill="#454459"
      opacity={isCurrent ? 1 : 0.5}
      fontFamily="sans-serif"
      fontWeight={isCurrent ? 600 : 500}
      fontSize={12}
    >
      {payload?.value}
    </text>
  );
}

export default function TrendPage() {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [disease1, setDisease1] = useState("J06.9");
  const [disease2, setDisease2] = useState("A90");

  // Load selectable disease list for the two comparison dropdowns
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tps/referensi/penyakit`, { credentials: "include" });
        if (res.ok) setDiseases(await res.json());
      } catch (err) {
        console.error("Error fetching disease list:", err);
      }
    };
    fetchDiseases();
  }, []);

  // Fetch historical case counts for the two selected diseases
  useEffect(() => {
    const fetchTemporal = async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);

        const url = `${API_BASE}/api/cases/temporal?start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&diseases=${disease1},${disease2}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch temporal cases");
        const records: TemporalRecord[] = await res.json();

        const byMonth = new Map<string, { v1: number; v2: number }>();
        records.forEach((rec) => {
          const d = new Date(rec.visit_date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const entry = byMonth.get(key) ?? { v1: 0, v2: 0 };
          if (rec.kode_icd10 === disease1) entry.v1 += rec.total_cases;
          if (rec.kode_icd10 === disease2) entry.v2 += rec.total_cases;
          byMonth.set(key, entry);
        });

        const points: ChartPoint[] = [];
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= endCursor) {
          const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
          const entry = byMonth.get(key) ?? { v1: 0, v2: 0 };
          points.push({ month: MONTH_LABELS[cursor.getMonth()], ...entry });
          cursor.setMonth(cursor.getMonth() + 1);
        }
        setChartData(points);
      } catch (err) {
        console.error("Error fetching temporal cases:", err);
      }
    };

    fetchTemporal();
  }, [disease1, disease2]);

  const disease1Name = diseases.find((d) => d.kode_icd10 === disease1)?.nama_penyakit ?? disease1;
  const disease2Name = diseases.find((d) => d.kode_icd10 === disease2)?.nama_penyakit ?? disease2;

  return (
    <div className="px-4 sm:px-6 lg:px-[41px] py-4 lg:py-[29px] flex flex-col gap-4 lg:gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Trend" />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-[24px]">
        {/* Peningkatan Tertinggi */}
        <div
          className="flex items-center gap-[22px] px-[22px] py-[16px] xl:py-0 rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] min-w-0 xl:h-[93px]"
          style={{ backgroundColor: "#0c818a" }}
        >
          <TrendingUp className="size-[52px] text-white shrink-0" />
          <div className="flex flex-col gap-[4px] min-w-0">
            <span className="font-josefin font-bold text-[16px] text-white leading-none truncate">
              Peningkatan Tertinggi
            </span>
            <span className="font-josefin font-bold text-[22px] text-white leading-none">
              DBD (+18%)
            </span>
            <span className="font-josefin font-normal text-[13px] text-white leading-none truncate">
              Terbanyak di Sleman
            </span>
          </div>
        </div>

        {/* Penurunan Terbesar */}
        <div
          className="flex items-center gap-[22px] px-[22px] py-[16px] xl:py-0 rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] min-w-0 xl:h-[93px]"
          style={{ backgroundColor: "#F44444" }}
        >
          <TrendingUp className="size-[52px] text-white shrink-0 rotate-180" />
          <div className="flex flex-col gap-[4px] min-w-0">
            <span className="font-josefin font-bold text-[16px] text-white leading-none truncate">
              Penurunan Terbesar
            </span>
            <span className="font-josefin font-bold text-[22px] text-white leading-none">
              DBD (-18%)
            </span>
            <span className="font-josefin font-normal text-[13px] text-white leading-none truncate">
              Kampanye Sanitasi Berhasil
            </span>
          </div>
        </div>

        {/* Total Kasus Aktif */}
        <div className="flex items-center gap-[12px] px-[22px] py-[16px] xl:py-0 rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] bg-white min-w-0 xl:h-[93px]">
          <Activity className="size-[42px] text-[#0c818a] shrink-0" />
          <div className="flex flex-col gap-[4px] min-w-0">
            <span className="font-josefin font-bold text-[16px] text-[#0c818a] leading-none truncate">
              Total Kasus Aktif
            </span>
            <span className="font-josefin font-bold text-[22px] text-[#0c818a] leading-none">
              605 Jiwa
            </span>
            <span className="font-josefin font-normal text-[13px] text-[#0c818a] leading-none truncate">
              Total D.I. Yogyakarta
            </span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div
        className="rounded-[24px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.16)] py-[18px] overflow-hidden"
        style={{
          background: "rgba(195,247,255,0.2)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* Chart Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 px-[20px] mb-[8px]">
          <h2 className="font-josefin font-semibold text-[20px] sm:text-[24px] text-[#0c818a]">
            Grafik Perbandingan Penyakit
          </h2>
          <div className="flex items-center gap-[15px] flex-wrap">
            <div className="relative min-w-0">
              <select
                value={disease1}
                onChange={(e) => setDisease1(e.target.value)}
                className="appearance-none max-w-[140px] sm:max-w-[180px] xl:max-w-[230px] truncate rounded-[10px] font-josefin font-semibold text-[14px] text-white pl-[14px] pr-[26px] cursor-pointer border-none focus:outline-none"
                style={{ backgroundColor: "#F56B3E", height: 27 }}
              >
                {diseases.map((d) => (
                  <option key={d.kode_icd10} value={d.kode_icd10} disabled={d.kode_icd10 === disease2} className="bg-white text-black">
                    {d.nama_penyakit}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-[13px] text-white absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative min-w-0">
              <select
                value={disease2}
                onChange={(e) => setDisease2(e.target.value)}
                className="appearance-none max-w-[140px] sm:max-w-[180px] xl:max-w-[230px] truncate rounded-[10px] font-josefin font-semibold text-[14px] text-white pl-[14px] pr-[26px] cursor-pointer border-none focus:outline-none"
                style={{ backgroundColor: "#A593FC", height: 27 }}
              >
                {diseases.map((d) => (
                  <option key={d.kode_icd10} value={d.kode_icd10} disabled={d.kode_icd10 === disease1} className="bg-white text-black">
                    {d.nama_penyakit}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-[13px] text-white absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recharts AreaChart */}
        <div className="h-[260px] sm:h-[320px] lg:h-[368px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#0c818a]/60 font-josefin text-[14px]">
              Memuat data tren...
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="ispFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,147,100,0.3)" />
                  <stop offset="100%" stopColor="rgba(242,95,51,0)" />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={true}
                horizontal={false}
                strokeDasharray="5 14"
                stroke="rgba(23,23,36,0.3)"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={(props) => <CustomXTick {...props} isLast={props.index === chartData.length - 1} />}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(12,129,138,0.2)",
                  borderRadius: "12px",
                  fontFamily: "Josefin Sans, sans-serif",
                  color: "#0c818a",
                  fontSize: 13,
                }}
                itemStyle={{ color: "#0c818a" }}
              />

              {/* Penyakit 1 — gradient area fill + orange stroke */}
              <Area
                type="monotone"
                dataKey="v1"
                stroke="#FF9364"
                strokeWidth={5}
                fill="url(#ispFill)"
                dot={false}
                activeDot={{ r: 6, fill: "#F56B3E", stroke: "#fff", strokeWidth: 2 }}
                name={disease1Name}
              />

              {/* Penyakit 2 — purple stroke, no fill */}
              <Area
                type="monotone"
                dataKey="v2"
                stroke="#A593FC"
                strokeWidth={5}
                fillOpacity={0}
                dot={false}
                activeDot={{ r: 6, fill: "#A593FC", stroke: "#fff", strokeWidth: 2 }}
                name={disease2Name}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="bg-white rounded-[14px] px-[19px] py-[16px] grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-[32px]">
        {alertData.map((card, i) => (
          <div
            key={i}
            className="flex flex-col gap-[11px] rounded-[30px] min-w-0"
            style={{ backgroundColor: "rgba(243,243,243,0.32)", padding: "25px 24px" }}
          >
            {/* Title + percentage */}
            <div className="flex items-center justify-between gap-[10px]">
              <span className="font-josefin font-bold text-[18px] text-[#0c818a] leading-none">
                {card.title}
              </span>
              <span className="font-josefin font-bold text-[18px] text-[#F44444] leading-none shrink-0">
                {card.change}
              </span>
            </div>

            {/* Urgency badge */}
            <div
              className="self-start flex items-center rounded-[8px]"
              style={{
                backgroundColor: "rgba(244,68,68,0.3)",
                border: "1px solid #F44444",
                opacity: 0.8,
                padding: "6px 9px",
              }}
            >
              <span className="font-josefin font-bold text-[12px] text-[#F44444] leading-none">
                Urgensi Tinggi
              </span>
            </div>

            {/* Description */}
            <p className="font-josefin font-medium text-[12px] text-[#0c818a] leading-normal">
              {card.description}
            </p>

            {/* Recommendation box */}
            <div
              className="rounded-[4px] flex flex-col gap-[4px]"
              style={{ backgroundColor: "rgba(0,82,96,0.24)", padding: "12px", minHeight: 67 }}
            >
              <span className="font-josefin font-bold text-[12px] text-white leading-none">
                Rekomendasi
              </span>
              <p className="font-josefin font-medium text-[12px] text-white leading-normal">
                {card.recommendation}
              </p>
            </div>

            {/* Item badges */}
            <div className="flex items-center gap-[11px] flex-wrap">
              {card.items.map((item, j) => (
                <div
                  key={j}
                  className="flex items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: "#0c818a", opacity: 0.8, padding: "6px 9px" }}
                >
                  <span className="font-josefin font-medium text-[12px] text-white leading-none">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
