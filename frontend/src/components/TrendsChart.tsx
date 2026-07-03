/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface RawTemporalData {
  visit_date: string;
  kode_icd10: string;
  nama_penyakit: string;
  total_cases: number;
}

interface TrendsChartProps {
  rawData: RawTemporalData[];
  activeDiseases: string[]; // list of active friendly names (e.g., ["Ispa", "DBD"])
}

const DISEASE_MAPPING: Record<string, { code: string; label: string; color: string }> = {
  "J06.9": { code: "J06.9", label: "Ispa", color: "#3b82f6" },
  "A90": { code: "A90", label: "DBD", color: "#06b6d4" },
  "A09": { code: "A09", label: "Diare", color: "#ec4899" },
  "J11": { code: "J11", label: "Flu", color: "#f97316" },
  "I10": { code: "I10", label: "Darah Tinggi", color: "#10b981" }
};

export default function TrendsChart({ rawData, activeDiseases }: TrendsChartProps) {
  // 1. Transform rawData: group by visit_date
  // Since visit_date might contain time, normalize to date string YYYY-MM-DD
  const dateGroups: Record<string, Record<string, number>> = {};

  rawData.forEach((item) => {
    if (!item.visit_date) return;
    const dateStr = item.visit_date.split("T")[0]; // YYYY-MM-DD
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = {};
    }
    
    // Find friendly label
    const mapped = DISEASE_MAPPING[item.kode_icd10];
    const label = mapped ? mapped.label : item.nama_penyakit;
    
    if (label) {
      dateGroups[dateStr][label] = (dateGroups[dateStr][label] || 0) + item.total_cases;
    }
  });

  // 2. Convert to sorted array for Recharts
  const chartData = Object.keys(dateGroups)
    .sort()
    .map((date) => {
      const dataPoint: any = { date };
      // Format date for display, e.g. DD/MM
      const parts = date.split("-");
      dataPoint.displayDate = `${parts[2]}/${parts[1]}`;
      
      // Populate values for all active diseases
      activeDiseases.forEach((d) => {
        dataPoint[d] = dateGroups[date][d] || 0;
      });
      return dataPoint;
    });

  // Combined Tooltip displaying all active disease counts for the hovered date
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-white/20 backdrop-blur-md rounded-[12px] p-4 shadow-xl font-josefin text-zinc-800 text-[14px]">
          <p className="font-bold border-b border-zinc-200 pb-1 mb-2 text-[#0c818a]">
            Tanggal: {label}
          </p>
          <div className="flex flex-col gap-1.5">
            {payload.map((p: any) => (
              <div key={p.name} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}:</span>
                </div>
                <span className="font-bold text-black">{p.value} kasus</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.5} />
          <XAxis
            dataKey="displayDate"
            stroke="#71717a"
            fontSize={12}
            fontFamily="Josefin Sans"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            fontFamily="Josefin Sans"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontFamily: "Josefin Sans",
              fontSize: "14px",
              paddingBottom: "10px",
            }}
          />
          
          {/* Dynamically render lines for active diseases */}
          {activeDiseases.map((disease) => {
            // Find config for line styling
            const config = Object.values(DISEASE_MAPPING).find(
              (m) => m.label === disease
            );
            const color = config ? config.color : "#6b7280";
            return (
              <Line
                key={disease}
                type="monotone"
                dataKey={disease}
                name={disease}
                stroke={color}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
