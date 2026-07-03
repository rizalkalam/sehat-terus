"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowLeftRight, Package } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import AiBanner from "@/components/AiBanner";
import InfoStatCards from "@/components/InfoStatCards";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDetailModal, { type AlertDetailData } from "@/components/AlertDetailModal";
import { ContentSkeleton } from "@/components/Skeleton";

// --- Data ---

const statCards = [
  { label: "Stok kritis darurat", value: "<48 jam", badges: ["Oralit", "Cabang Sleman"] },
  { label: "Lonjakan tertinggi", value: "+247%", badges: ["Diare", "3 Hari"] },
  { label: "Wilayah terdampak", value: "5 Kec.", badges: ["Dari 78 kecamatan"] },
];

interface AlertItem {
  title: string;
  stats: string[];
  badge: string;
  badgeColor: string;
  detail: AlertDetailData;
}

const alertItems: AlertItem[] = [
  {
    title: "Diare - Kec. Depok",
    stats: ["+247%", "3 hari", "stok < 48jam"],
    badge: "Kritis",
    badgeColor: "#F44444",
    detail: {
      kasusAktif: 143,
      tren: "Meningkat 247% dalam 3 hari terakhir, melebihi threshold waspada puskesmas",
      penyebab: "Perubahan musim dan sanitasi yang buruk di kelurahan padat penduduk",
      wilayah: ["Kel. Maguwoharjo", "Kel. Condongcatur", "Kel. Caturtunggal"],
      obatKritis: ["Oralit 500ml", "Zinc 20mg", "Kotrimoksazol"],
      estimasiPuncak: "2–3 hari mendatang",
    },
  },
  {
    title: "ISPA - Kec. Mlati",
    stats: ["+247%", "3 hari", "stok < 48jam"],
    badge: "Waspada",
    badgeColor: "#F59E0B",
    detail: {
      kasusAktif: 97,
      tren: "Meningkat 247% dalam 3 hari terakhir, mendekati threshold kritis",
      penyebab: "Musim kemarau menyebabkan kualitas udara menurun di wilayah padat",
      wilayah: ["Kel. Sinduadi", "Kel. Sendangadi"],
      obatKritis: ["Amoksisilin 500mg", "Masker Medis N95", "Paracetamol 500mg"],
      estimasiPuncak: "4–5 hari mendatang",
    },
  },
];

const chartData = [
  { month: "Jan", sisaStock: 300, kebutuhan: 95 },
  { month: "Feb", sisaStock: 270, kebutuhan: 120 },
  { month: "Mar", sisaStock: 230, kebutuhan: 145 },
  { month: "Apr", sisaStock: 185, kebutuhan: 180 },
  { month: "May", sisaStock: 140, kebutuhan: 220 },
  { month: "Jun", sisaStock: 90, kebutuhan: 270 },
  { month: "Jul", sisaStock: 50, kebutuhan: 310 },
];

const tindakanItems = [
  {
    type: "relokasi",
    drug: "Amoksilin",
    from: "Bantul",
    to: "Sleman",
    desc: "Pindah 90 unit tutup kebutuhan 5 hari",
    action: "Pindahkan",
  },
  {
    type: "retur",
    drug: "Antasida tablet",
    detail1: "Rp 2,1 jt",
    detail2: "Rp 3,2 jt tertahan",
    action: "Tanda retur",
  },
];

// --- Modal state type ---

interface ModalState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const closedModal: ModalState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Konfirmasi",
  onConfirm: () => {},
};

// --- Sub-components ---

function AlertAndChart({ onAlertClick }: { onAlertClick: (item: AlertItem) => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <h2 className="font-josefin font-bold text-[22px] text-black">
        Daftar Alert &amp; Lonjakan Kasus
      </h2>
      <div className="flex gap-[16px]">
        {/* Alert cards — left column */}
        <div className="flex flex-col gap-[10px] flex-1">
          {alertItems.map((item, i) => (
            <button
              key={i}
              onClick={() => onAlertClick(item)}
              className="flex items-center justify-between rounded-[18px] px-[14px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)] text-left hover:bg-[rgba(195,247,255,0.35)] hover:border-[#0c818a]/30 transition-all duration-200 cursor-pointer w-full"
            >
              <div className="flex items-center gap-[12px] min-w-0">
                <AlertTriangle className="size-[28px] text-[#0c818a] shrink-0" />
                <div className="flex flex-col gap-[4px] min-w-0">
                  <span className="font-josefin font-semibold text-[24px] text-black leading-tight truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black flex-wrap">
                    {item.stats.map((s, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <span className="text-black/40">|</span>}
                        <span>{s}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <span
                className="font-josefin font-medium text-[14px] text-white px-[12px] py-[8px] rounded-full shrink-0 ml-[12px]"
                style={{ backgroundColor: item.badgeColor }}
              >
                {item.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Line chart — right column */}
        <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[18px] p-[24px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)] shrink-0 w-[460px]">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontFamily: "Josefin Sans, sans-serif", fontSize: 12, fontWeight: 500, fill: "#454459" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(12,129,138,0.2)",
                  borderRadius: "10px",
                  fontFamily: "Josefin Sans, sans-serif",
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontFamily: "Josefin Sans, sans-serif", fontSize: 12, fontWeight: 500 }}
              />
              <Line
                type="monotone"
                dataKey="sisaStock"
                name="Sisa stock"
                stroke="#0C818A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#0C818A", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="kebutuhan"
                name="Kebutuhan bulan depan"
                stroke="#84C6CB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#84C6CB", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function EarlyWarningPage() {
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalState>(closedModal);
  const [detailItem, setDetailItem] = useState<AlertItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 700);
    return () => clearTimeout(t);
  }, []);

  const openModal = (config: Omit<ModalState, "open">) =>
    setModal({ open: true, ...config });
  const closeModal = () => setModal(closedModal);

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Early Warning" />

      {!loaded ? (
        <ContentSkeleton />
      ) : (
        <>
          <InfoStatCards items={statCards} />
          <AiBanner />
          <AlertAndChart onAlertClick={(item) => setDetailItem(item)} />

          {/* Tindakan Darurat */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="font-josefin font-bold text-[22px] text-black">
              Tindakan Darurat
            </h2>
            <div className="flex flex-col gap-[10px]">
              {tindakanItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[18px] px-[14px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-[16px] min-w-0">
                    {item.type === "relokasi" ? (
                      <ArrowLeftRight className="size-[28px] text-[#0c818a] shrink-0" />
                    ) : (
                      <Package className="size-[32px] text-[#0c818a] shrink-0" />
                    )}
                    <div className="flex flex-col gap-[4px] min-w-0">
                      {item.type === "relokasi" ? (
                        <>
                          <div className="flex items-center gap-[12px]">
                            <span className="font-josefin font-bold text-[20px] text-[#0c818a] leading-none">
                              {item.drug}
                            </span>
                            <span className="font-josefin text-[20px] text-black leading-none">{item.from}</span>
                            <span className="text-black">→</span>
                            <span className="font-josefin text-[20px] text-black leading-none">{item.to}</span>
                          </div>
                          <span className="font-josefin text-[16px] text-black leading-none">{item.desc}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-josefin font-semibold text-[24px] text-black leading-tight">
                            {item.drug}
                          </span>
                          <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black">
                            <span>{item.detail1}</span>
                            <span className="text-black/40">|</span>
                            <span>{item.detail2}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      openModal(
                        item.type === "relokasi"
                          ? {
                              title: "Konfirmasi Relokasi",
                              description: `Pindahkan 90 unit ${item.drug} dari ${item.from} ke ${item.to}? Stok akan tutup kebutuhan 5 hari.`,
                              confirmLabel: "Pindahkan",
                              onConfirm: () => closeModal(),
                            }
                          : {
                              title: "Konfirmasi Retur",
                              description: `Tandai ${item.drug} sebagai retur? Nilai ${item.detail2} akan diproses.`,
                              confirmLabel: "Tanda Retur",
                              onConfirm: () => closeModal(),
                            }
                      )
                    }
                    className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[14px] py-[10px] transition-opacity hover:opacity-80 cursor-pointer shrink-0 ml-[16px]"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <AlertDetailModal
        open={detailItem !== null}
        title={detailItem?.title ?? ""}
        badge={detailItem?.badge ?? ""}
        badgeColor={detailItem?.badgeColor ?? "#0c818a"}
        stats={detailItem?.stats ?? []}
        detail={detailItem?.detail ?? null}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}
