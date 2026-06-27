"use client";

import type { ReactNode } from "react";
import { X, AlertTriangle, MapPin, Pill, TrendingUp, Clock } from "lucide-react";

export interface AlertDetailData {
  kasusAktif: number;
  tren: string;
  penyebab: string;
  wilayah: string[];
  obatKritis: string[];
  estimasiPuncak: string;
}

interface AlertDetailModalProps {
  open: boolean;
  title: string;
  badge: string;
  badgeColor: string;
  stats: string[];
  detail: AlertDetailData | null;
  onClose: () => void;
}

export default function AlertDetailModal({
  open,
  title,
  badge,
  badgeColor,
  stats,
  detail,
  onClose,
}: AlertDetailModalProps) {
  if (!open || !detail) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-[36px] flex flex-col gap-[22px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)] w-full max-w-[520px] mx-[16px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex items-center gap-[10px] flex-wrap">
            <AlertTriangle className="size-[20px] text-[#0c818a] shrink-0" />
            <h2 className="font-josefin font-bold text-[20px] text-black leading-none">
              {title}
            </h2>
            <span
              className="font-josefin font-medium text-[13px] text-white px-[10px] py-[5px] rounded-full"
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="size-[32px] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="size-[18px] text-black/60" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-[10px]">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex-1 rounded-[10px] py-[12px] flex items-center justify-center"
              style={{ backgroundColor: "rgba(12,129,138,0.08)" }}
            >
              <span className="font-josefin font-bold text-[18px] text-[#0c818a] leading-none">
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Kasus aktif + estimasi puncak */}
        <div className="flex gap-[10px]">
          <div
            className="flex-1 rounded-[12px] p-[16px] flex flex-col gap-[6px]"
            style={{ backgroundColor: "rgba(244,68,68,0.07)", border: "1px solid rgba(244,68,68,0.2)" }}
          >
            <span className="font-josefin text-[12px] text-[#F44444]/80 leading-none">
              Kasus Aktif
            </span>
            <span className="font-josefin font-bold text-[28px] text-[#F44444] leading-none">
              {detail.kasusAktif}
            </span>
          </div>
          <div
            className="flex-1 rounded-[12px] p-[16px] flex flex-col gap-[6px]"
            style={{ backgroundColor: "rgba(12,129,138,0.07)", border: "1px solid rgba(12,129,138,0.2)" }}
          >
            <span className="font-josefin text-[12px] text-[#0c818a]/80 leading-none">
              Estimasi Puncak
            </span>
            <span className="font-josefin font-bold text-[15px] text-[#0c818a] leading-tight mt-1">
              {detail.estimasiPuncak}
            </span>
          </div>
        </div>

        {/* Detail rows */}
        <div className="flex flex-col gap-[16px]">
          <DetailRow icon={<TrendingUp className="size-[15px]" />} label="Tren">
            <p className="font-josefin text-[14px] text-black leading-snug">{detail.tren}</p>
          </DetailRow>

          <DetailRow icon={<Clock className="size-[15px]" />} label="Penyebab Dugaan">
            <p className="font-josefin text-[14px] text-black leading-snug">{detail.penyebab}</p>
          </DetailRow>

          <DetailRow icon={<MapPin className="size-[15px]" />} label="Wilayah Terdampak">
            <div className="flex flex-wrap gap-[6px]">
              {detail.wilayah.map((w, i) => (
                <span
                  key={i}
                  className="font-josefin text-[13px] text-[#0c818a] px-[10px] py-[4px] rounded-full border border-[#0c818a]/30"
                  style={{ backgroundColor: "rgba(12,129,138,0.07)" }}
                >
                  {w}
                </span>
              ))}
            </div>
          </DetailRow>

          <DetailRow icon={<Pill className="size-[15px]" />} label="Obat Perlu Segera">
            <div className="flex flex-wrap gap-[6px]">
              {detail.obatKritis.map((o, i) => (
                <span
                  key={i}
                  className="font-josefin text-[13px] text-[#F44444] px-[10px] py-[4px] rounded-full border border-[#F44444]/30"
                  style={{ backgroundColor: "rgba(244,68,68,0.07)" }}
                >
                  {o}
                </span>
              ))}
            </div>
          </DetailRow>
        </div>

        <button
          onClick={onClose}
          className="w-full font-josefin font-medium text-[16px] text-white py-[12px] rounded-[10px] hover:opacity-80 transition-opacity cursor-pointer"
          style={{ backgroundColor: "#0c818a" }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center gap-[6px] text-black/50">
        {icon}
        <span className="font-josefin font-medium text-[13px] leading-none">{label}</span>
      </div>
      {children}
    </div>
  );
}
