"use client";

import React from "react";
import { TrendingUp, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/PageHeader";

const chartData = [
  { month: "Jan", ispa: 40, dbd: 85 },
  { month: "Feb", ispa: 55, dbd: 70 },
  { month: "Mar", ispa: 80, dbd: 58 },
  { month: "Apr", ispa: 120, dbd: 50 },
  { month: "May", ispa: 145, dbd: 45 },
  { month: "Jun", ispa: 130, dbd: 52 },
  { month: "Jul", ispa: 160, dbd: 48 },
];

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
  [key: string]: unknown;
}

function CustomXTick({ x = 0, y = 0, payload }: CustomTickProps) {
  const xNum = typeof x === "string" ? parseFloat(x) : x;
  const yNum = typeof y === "string" ? parseFloat(y) : y;
  const isCurrent = payload?.value === "Apr";
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
  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Trend" />

      {/* Stat Cards Row */}
      <div className="flex items-stretch gap-[24px]">
        {/* Peningkatan Tertinggi */}
        <div
          className="flex flex-1 items-center gap-[22px] px-[22px] rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] min-w-0"
          style={{ backgroundColor: "#0c818a", height: 93 }}
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
          className="flex flex-1 items-center gap-[22px] px-[22px] rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] min-w-0"
          style={{ backgroundColor: "#F44444", height: 93 }}
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
        <div
          className="flex flex-1 items-center gap-[12px] px-[22px] rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] bg-white min-w-0"
          style={{ height: 93 }}
        >
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
        <div className="flex items-center justify-between px-[20px] mb-[8px]">
          <h2 className="font-josefin font-semibold text-[24px] text-[#0c818a]">
            Grafik Perbandingan Penyakit
          </h2>
          <div className="flex items-center gap-[15px]">
            <div
              className="flex items-center justify-center rounded-[10px]"
              style={{ backgroundColor: "#F56B3E", width: 87, height: 27, padding: "10px" }}
            >
              <span className="font-josefin font-semibold text-[16px] text-white leading-none">
                Ispa
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-[10px]"
              style={{ backgroundColor: "#A593FC", width: 87, height: 27, padding: "10px" }}
            >
              <span className="font-josefin font-semibold text-[16px] text-white leading-none">
                DBD
              </span>
            </div>
          </div>
        </div>

        {/* Recharts AreaChart */}
        <div className="h-[368px]">
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
                tick={(props) => <CustomXTick {...props} />}
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

              {/* ISPA — gradient area fill + orange stroke */}
              <Area
                type="monotone"
                dataKey="ispa"
                stroke="#FF9364"
                strokeWidth={5}
                fill="url(#ispFill)"
                dot={false}
                activeDot={{ r: 6, fill: "#F56B3E", stroke: "#fff", strokeWidth: 2 }}
                name="ISPA"
              />

              {/* DBD — purple stroke, no fill */}
              <Area
                type="monotone"
                dataKey="dbd"
                stroke="#A593FC"
                strokeWidth={5}
                fillOpacity={0}
                dot={false}
                activeDot={{ r: 6, fill: "#A593FC", stroke: "#fff", strokeWidth: 2 }}
                name="DBD"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="bg-white rounded-[14px] px-[19px] py-[16px] flex items-stretch gap-[32px]">
        {alertData.map((card, i) => (
          <div
            key={i}
            className="flex flex-col gap-[11px] rounded-[30px] flex-1 min-w-0"
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
