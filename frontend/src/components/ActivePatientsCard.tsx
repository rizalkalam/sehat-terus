"use client";

import React from "react";
import { Users } from "lucide-react";
import { AreaChart, Area, ReferenceLine, ReferenceDot, ResponsiveContainer } from "recharts";

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
    <div className="bg-[#0c818a] text-white rounded-[24px] px-[17px] py-[15px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] h-[310px] w-full flex flex-col justify-between relative overflow-hidden select-none shrink-0 border border-teal-600/30">
      {/* Header Row */}
      <div className="flex items-center gap-[13px] justify-center z-10 shrink-0">
        <Users className="size-[20px] text-white" />
        <span className="font-josefin font-semibold text-[14px] leading-normal">Total Pasien Aktif</span>
      </div>

      {/* Value Badge */}
      <div className="flex flex-col items-center justify-center z-10 shrink-0">
        <div className="bg-white text-[#0c818a] text-[14px] font-normal font-josefin rounded-[8px] px-3.5 py-0.5 shadow-md">
          {totalPatients} Jiwa
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-[148px] w-full z-10 flex flex-col justify-between shrink-0 relative">
        <div className="h-[125px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 6, bottom: 2, left: 6 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {/* Highlight bar for May */}
              <ReferenceLine 
                x="May" 
                stroke="#3f9cab" 
                strokeWidth={28} 
                strokeOpacity={0.5}
                className="rounded-t-[8px]"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={3.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={false}
              />
              {/* Reference Dot for May */}
              <ReferenceDot
                x="May"
                y={142}
                r={5.5}
                fill="#ffffff"
                stroke="#0c818a"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* X-Axis labels matching Figma typography */}
        <div className="flex justify-between text-[12px] font-josefin font-normal px-1 mt-0.5">
          {data.map((item, index) => (
            <span 
              key={index} 
              className={item.name === "May" ? "text-white font-semibold" : "text-white/50 font-medium"}
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* Trend Percentage Badge */}
      <div className="bg-[#3f9cab] hover:bg-[#46a7b7] transition-colors duration-200 rounded-[11px] h-[37px] flex items-center justify-center z-10 shadow-sm w-full shrink-0 select-none">
        <span className="text-[14px] font-semibold font-josefin text-white">
          Naik {percentageChange} dari {timeframeLabel}
        </span>
      </div>
    </div>
  );
}

