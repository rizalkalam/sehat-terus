"use client";

import React from "react";
import { Users } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ActivePatientsCardProps {
  totalPatients?: number;
  percentageChange?: string | number;
  data?: { name: string; value: number }[];
  timeframeLabel?: string;
}

const defaultTrendData = [
  { name: "Jan", value: 110 },
  { name: "Feb", value: 95 },
  { name: "Mar", value: 130 },
  { name: "Apr", value: 115 },
  { name: "May", value: 142 },
  { name: "Jun", value: 125 },
  { name: "Jul", value: 135 },
];

export default function ActivePatientsCard({
  totalPatients = 142,
  percentageChange = "+12%",
  data = defaultTrendData,
  timeframeLabel = "minggu lalu",
}: ActivePatientsCardProps) {
  return (
    <div className="bg-[#0c818a] text-white rounded-[24px] p-5 shadow-lg h-[310px] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Header Row */}
      <div className="flex items-center gap-2 z-10">
        <Users className="size-[18px] text-teal-200" />
        <span className="font-josefin font-semibold text-[13px]">Total Pasien Aktif</span>
      </div>

      {/* Value Badge */}
      <div className="flex flex-col items-center justify-center my-1.5 z-10 shrink-0">
        <div className="bg-white text-teal-brand text-[13px] font-semibold font-josefin rounded-[8px] px-3.5 py-1 shadow-md">
          {totalPatients} Jiwa
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-[120px] w-full z-10 mt-1 flex flex-col justify-between shrink-0">
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 10 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 3, stroke: "#0c818a", strokeWidth: 1.5, fill: "#ffffff" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[9px] opacity-60 font-semibold px-2 mt-1">
          {data.map((item, index) => (
            <span key={index} className="w-6 text-center truncate">{item.name}</span>
          ))}
        </div>
      </div>

      {/* Trend Percentage Badge */}
      <div 
        className="bg-[#3f9cab]/80 hover:bg-[#3f9cab] transition-colors duration-200 rounded-[12px] py-2 px-3 text-center z-10 shadow-inner w-full flex flex-col justify-center gap-0.5 select-none" 
        title={`Naik ${percentageChange} dari ${timeframeLabel}`}
      >
        <span className="text-[13px] font-bold font-josefin leading-tight text-white">Naik {percentageChange}</span>
        <span className="text-[10px] font-medium font-josefin leading-none text-white/80">dari {timeframeLabel}</span>
      </div>
    </div>
  );
}
