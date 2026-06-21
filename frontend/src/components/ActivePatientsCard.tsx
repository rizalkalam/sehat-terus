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
    <div className="bg-[#0c818a] text-white rounded-[24px] p-6 shadow-lg h-[310px] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Header Row */}
      <div className="flex items-center gap-2.5 z-10">
        <Users className="size-[20px] text-teal-200" />
        <span className="font-josefin font-semibold text-[14px]">Total Pasien Aktif</span>
      </div>

      {/* Value Badge */}
      <div className="flex flex-col items-center justify-center my-2 z-10">
        <div className="bg-white text-teal-brand text-[14px] font-semibold font-josefin rounded-[8px] px-4 py-1 shadow-md">
          {totalPatients} Jiwa
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-[120px] w-full z-10 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#0c818a", strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[10px] opacity-60 font-semibold px-2 mt-1">
          {data.map((item, index) => (
            <span key={index}>{item.name}</span>
          ))}
        </div>
      </div>

      {/* Trend Percentage Badge */}
      <div className="bg-[#3f9cab] rounded-[11px] py-2 text-center text-[14px] font-semibold font-josefin z-10 shadow-inner">
        Naik {percentageChange} dari {timeframeLabel}
      </div>
    </div>
  );
}
