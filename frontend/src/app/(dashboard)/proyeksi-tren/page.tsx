"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity, ChevronDown } from "lucide-react";
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

interface ProjectionPoint {
  tanggal: string;
  kode_icd10: string;
  kasus_aktual: number | null;
  kasus_prediksi: number | null;
  tipe: "historis" | "proyeksi";
}

interface ChartPoint {
  tanggal: string;
  label: string;
  v1_actual?: number;
  v1_forecast?: number;
  v2_actual?: number;
  v2_forecast?: number;
}

interface DiseaseOption {
  kode_icd10: string;
  nama_penyakit: string;
}

interface ForecastStatEntry {
  nama_penyakit: string;
  kode_icd10: string;
  persen_change: number;
  kasus_prediksi: number;
  label: string;
}

interface ForecastStats {
  peningkatan_tertinggi: ForecastStatEntry | null;
  penurunan_terbesar: ForecastStatEntry | null;
  total_kasus_proyeksi: number;
}

interface ForecastAlert {
  jenis_penyakit: string;
  kode_icd10: string;
  urgensi: "tinggi" | "sedang" | "rendah";
  persen_change: number;
  deskripsi: string;
  rekomendasi_obat: string[];
  rekomendasi_tindakan: string;
}

const URGENSI_STYLE: Record<ForecastAlert["urgensi"], { bg: string; border: string; text: string; label: string }> = {
  tinggi: { bg: "rgba(244,68,68,0.3)", border: "#F44444", text: "#F44444", label: "Urgensi Tinggi" },
  sedang: { bg: "rgba(245,166,35,0.3)", border: "#F5A623", text: "#B8720A", label: "Urgensi Sedang" },
  rendah: { bg: "rgba(12,129,138,0.2)", border: "#0c818a", text: "#0c818a", label: "Urgensi Rendah" },
};

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
  const [stats, setStats] = useState<ForecastStats | null>(null);
  const [alerts, setAlerts] = useState<ForecastAlert[]>([]);

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

  // Load system-wide forecast stats (F22) and rising-trend recommendation cards (F23)
  useEffect(() => {
    const fetchStatsAndAlerts = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          fetch(`${API_BASE}/api/forecasting/stats`, { credentials: "include" }),
          fetch(`${API_BASE}/api/forecasting/alerts`, { credentials: "include" }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch (err) {
        console.error("Error fetching forecasting stats/alerts:", err);
      }
    };
    fetchStatsAndAlerts();
  }, []);

  // Fetch historical + projected weekly case counts for the two selected diseases (F21)
  useEffect(() => {
    const fetchProjection = async () => {
      try {
        const url = `${API_BASE}/api/forecasting/projection?diseases=${disease1},${disease2}&months_back=6&days_ahead=30`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch projection");
        const records: ProjectionPoint[] = await res.json();

        const byDate = new Map<string, ChartPoint>();
        records.forEach((rec) => {
          const prefix = rec.kode_icd10 === disease1 ? "v1" : rec.kode_icd10 === disease2 ? "v2" : null;
          if (!prefix) return;

          const entry = byDate.get(rec.tanggal) ?? {
            tanggal: rec.tanggal,
            label: (() => {
              const d = new Date(rec.tanggal);
              return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
            })(),
          };
          if (rec.tipe === "historis") {
            entry[`${prefix}_actual`] = rec.kasus_aktual ?? undefined;
          } else {
            entry[`${prefix}_forecast`] = rec.kasus_prediksi ?? undefined;
          }
          byDate.set(rec.tanggal, entry);
        });

        const sorted = [...byDate.values()].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        // Bridge the actual→forecast gap so the dashed segment visually continues the solid line.
        (["v1", "v2"] as const).forEach((key) => {
          let lastActualIdx = -1;
          sorted.forEach((row, i) => {
            if (row[`${key}_actual`] !== undefined) lastActualIdx = i;
          });
          if (lastActualIdx >= 0) {
            sorted[lastActualIdx][`${key}_forecast`] = sorted[lastActualIdx][`${key}_actual`];
          }
        });

        setChartData(sorted);
      } catch (err) {
        console.error("Error fetching projection:", err);
      }
    };

    fetchProjection();
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
            <span className="font-josefin font-bold text-[22px] text-white leading-none truncate">
              {stats?.peningkatan_tertinggi
                ? `${stats.peningkatan_tertinggi.nama_penyakit} (+${stats.peningkatan_tertinggi.persen_change}%)`
                : "Memuat..."}
            </span>
            <span className="font-josefin font-normal text-[13px] text-white leading-none truncate">
              {stats?.peningkatan_tertinggi?.label ?? ""}
            </span>
          </div>
        </div>

        {/* Penurunan Terbesar */}
        <div
          className="flex items-center gap-[22px] px-[22px] py-[16px] xl:py-0 rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] min-w-0 xl:h-[93px]"
          style={{ backgroundColor: stats && !stats.penurunan_terbesar ? "#0c818a" : "#F44444" }}
        >
          <TrendingDown className="size-[52px] text-white shrink-0" />
          <div className="flex flex-col gap-[4px] min-w-0">
            <span className="font-josefin font-bold text-[16px] text-white leading-none truncate">
              Penurunan Terbesar
            </span>
            <span className="font-josefin font-bold text-[22px] text-white leading-none truncate">
              {!stats
                ? "Memuat..."
                : stats.penurunan_terbesar
                ? `${stats.penurunan_terbesar.nama_penyakit} (${stats.penurunan_terbesar.persen_change}%)`
                : "Tidak ada"}
            </span>
            <span className="font-josefin font-normal text-[13px] text-white leading-none truncate">
              {stats?.penurunan_terbesar?.label ?? "Semua tren stabil atau naik"}
            </span>
          </div>
        </div>

        {/* Total Proyeksi Kasus */}
        <div className="flex items-center gap-[12px] px-[22px] py-[16px] xl:py-0 rounded-[18px] shadow-[0px_0px_11px_0px_rgba(0,0,0,0.16)] bg-white min-w-0 xl:h-[93px]">
          <Activity className="size-[42px] text-[#0c818a] shrink-0" />
          <div className="flex flex-col gap-[4px] min-w-0">
            <span className="font-josefin font-bold text-[16px] text-[#0c818a] leading-none truncate">
              Total Proyeksi Kasus
            </span>
            <span className="font-josefin font-bold text-[22px] text-[#0c818a] leading-none">
              {stats ? `${stats.total_kasus_proyeksi} Jiwa` : "Memuat..."}
            </span>
            <span className="font-josefin font-normal text-[13px] text-[#0c818a] leading-none truncate">
              Proyeksi 4 minggu ke depan, D.I. Yogyakarta
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
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 7))}
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

              {/* Penyakit 1 — actual (solid, gradient fill) + forecast (dashed) */}
              <Area
                type="monotone"
                dataKey="v1_actual"
                stroke="#FF9364"
                strokeWidth={5}
                fill="url(#ispFill)"
                dot={false}
                activeDot={{ r: 6, fill: "#F56B3E", stroke: "#fff", strokeWidth: 2 }}
                name={disease1Name}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="v1_forecast"
                stroke="#FF9364"
                strokeWidth={5}
                strokeDasharray="6 6"
                fillOpacity={0}
                dot={false}
                activeDot={{ r: 6, fill: "#F56B3E", stroke: "#fff", strokeWidth: 2 }}
                name={`${disease1Name} (proyeksi)`}
                connectNulls
              />

              {/* Penyakit 2 — actual (solid) + forecast (dashed), no fill */}
              <Area
                type="monotone"
                dataKey="v2_actual"
                stroke="#A593FC"
                strokeWidth={5}
                fillOpacity={0}
                dot={false}
                activeDot={{ r: 6, fill: "#A593FC", stroke: "#fff", strokeWidth: 2 }}
                name={disease2Name}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="v2_forecast"
                stroke="#A593FC"
                strokeWidth={5}
                strokeDasharray="6 6"
                fillOpacity={0}
                dot={false}
                activeDot={{ r: 6, fill: "#A593FC", stroke: "#fff", strokeWidth: 2 }}
                name={`${disease2Name} (proyeksi)`}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="bg-white rounded-[14px] px-[19px] py-[16px] grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-[32px]">
        {alerts.length === 0 && (
          <p className="font-josefin text-[14px] text-black/50 col-span-full text-center py-[20px]">
            Tidak ada penyakit dengan tren naik signifikan saat ini.
          </p>
        )}
        {alerts.map((card, i) => {
          const style = URGENSI_STYLE[card.urgensi];
          return (
            <div
              key={i}
              className="flex flex-col gap-[11px] rounded-[30px] min-w-0"
              style={{ backgroundColor: "rgba(243,243,243,0.32)", padding: "25px 24px" }}
            >
              {/* Title + percentage */}
              <div className="flex items-center justify-between gap-[10px]">
                <span className="font-josefin font-bold text-[18px] text-[#0c818a] leading-none">
                  Tren {card.jenis_penyakit} Naik
                </span>
                <span className="font-josefin font-bold text-[18px] text-[#F44444] leading-none shrink-0">
                  +{card.persen_change}%
                </span>
              </div>

              {/* Urgency badge */}
              <div
                className="self-start flex items-center rounded-[8px]"
                style={{
                  backgroundColor: style.bg,
                  border: `1px solid ${style.border}`,
                  opacity: 0.8,
                  padding: "6px 9px",
                }}
              >
                <span className="font-josefin font-bold text-[12px] leading-none" style={{ color: style.text }}>
                  {style.label}
                </span>
              </div>

              {/* Description */}
              <p className="font-josefin font-medium text-[12px] text-[#0c818a] leading-normal">
                {card.deskripsi}
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
                  {card.rekomendasi_tindakan}
                </p>
              </div>

              {/* Item badges */}
              {card.rekomendasi_obat.length > 0 && (
                <div className="flex items-center gap-[11px] flex-wrap">
                  {card.rekomendasi_obat.map((item, j) => (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
