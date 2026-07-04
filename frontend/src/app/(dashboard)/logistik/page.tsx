"use client";

import React, { useState, useEffect } from "react";
import { Truck, ArrowLeftRight } from "lucide-react";
import {
  BarChart,
  Bar,
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
import { ContentSkeleton } from "@/components/Skeleton";

// --- Data ---

const stockData = [
  { drug: "Amoks.", sisaStock: 80, kebutuhan: 112 },
  { drug: "Paracet.", sisaStock: 150, kebutuhan: 210 },
  { drug: "Oralit", sisaStock: 230, kebutuhan: 322 },
];

const statCards = [
  { label: "Modal dead-stock", value: "Rp 42,5jt", badges: ["9 item", "17% nilai stok"] },
  { label: "Risiko stockout", value: "Rp 88jt", badges: ["7 item kritis"] },
  { label: "Ketahanan terpendek", value: "2 hari", badges: ["Oralit", "Cabang Sleman"] },
  { label: "Cabang berisiko", value: "3/13", badges: ["Sleman, Bantul, Kota"] },
];

const defektaGroups = [
  {
    supplier: "PBF A",
    type: "SP reguler",
    items: [
      { nama: "Amoksisilin 500mg", jenis: "obat jadi", ketahanan: "3 hari", tren: 80, usulan: "140 unit", status: "Delivered" },
      { nama: "Paracetamol 500mg", jenis: "obat jadi", ketahanan: "5 hari", tren: 65, usulan: "200 unit", status: "Delivered" },
    ],
  },
  {
    supplier: "PBF B",
    type: "SP reguler",
    items: [
      { nama: "Oralit sach.", jenis: "obat jadi", ketahanan: "2 hari", tren: 92, usulan: "320 unit", status: "Delivered" },
      { nama: "Amoksisilin 250mg", jenis: "obat jadi", ketahanan: "4 hari", tren: 71, usulan: "90 unit", status: "Delivered" },
    ],
    locked: true,
  },
];

const nearExpiryItems = [
  { nama: "Cetirizine 10mg", qty: "120 strip", nilai: "Rp 3,2 jt tertahan", expired: "Expired Date 2 bln" },
  { nama: "Cetirizine 10mg", qty: "120 strip", nilai: "Rp 3,2 jt tertahan", expired: "Expired Date 3 bln" },
];

const slowMovingItems = [
  { nama: "Vitamin B kompleks", modal: "Rp 6,2 jt", tertahan: "Rp 3,2 jt tertahan", action: "Sarankan realokasi" },
  { nama: "Antasida tablet", modal: "Rp 2,1 jt", tertahan: "Rp 3,2 jt tertahan", action: "Tanda retur" },
];

const relokasiItems = [
  { drug: "Amoksilin", from: "Bantul", to: "Sleman", desc: "Pindah 90 unit tutup kebutuhan 5 hari" },
  { drug: "Amoksilin", from: "Bantul", to: "Sleman", desc: "Pindah 90 unit tutup kebutuhan 5 hari" },
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

function Tabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
    { key: "pengadaan", label: "Pengadaan" },
    { key: "deadstock", label: "Dead-stock & relokasi" },
  ];

  return (
    <div className="flex gap-[10px] items-center">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="rounded-[12px] px-[18px] py-[10px] font-josefin text-[20px] font-normal text-white cursor-pointer transition-all duration-300 whitespace-nowrap"
            style={
              isActive
                ? {
                    backgroundImage:
                      "linear-gradient(90deg, rgb(12,129,138) 0%, rgb(73,153,159) 28%, rgb(12,129,138) 64%, rgb(73,153,159) 94%)",
                  }
                : { backgroundColor: "rgba(132,198,203,1)" }
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function StockChart() {
  return (
    <div>
      <h2 className="font-josefin font-bold text-[22px] text-black mb-[10px]">
        Stok &amp; Kebutuhan Bulan Depan
      </h2>
      <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-[20px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={stockData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="30%"
            barGap={4}
          >
            <XAxis
              dataKey="drug"
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
                fontSize: 13,
              }}
            />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontFamily: "Josefin Sans, sans-serif", fontSize: 12, fontWeight: 500 }}
            />
            <Bar dataKey="sisaStock" name="Sisa stock" fill="#84C6CB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kebutuhan" name="Kebutuhan bulan depan" fill="#0C818A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DefektaTable() {
  return (
    <div>
      <h2 className="font-josefin font-bold text-[22px] text-black mb-[10px]">
        Defekta by AI
      </h2>
      <div className="rounded-[12px] overflow-hidden shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
        {/* Table header */}
        <div
          className="grid font-josefin font-bold text-[14px] text-white px-[16px] py-[12px]"
          style={{ backgroundColor: "#00454A", gridTemplateColumns: "2fr 1fr 1fr 0.7fr 1fr 1fr" }}
        >
          <span>nama item</span>
          <span>jenis</span>
          <span>ketahanan</span>
          <span>tren</span>
          <span>usulan</span>
          <span>Status</span>
        </div>

        {defektaGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {/* Supplier group header */}
            <div
              className="flex items-center gap-[10px] px-[16px] py-[8px]"
              style={{ backgroundColor: "#00454A" }}
            >
              {group.locked ? (
                <svg className="size-[16px] text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <Truck className="size-[18px] text-white shrink-0" />
              )}
              <span className="font-josefin font-bold text-[14px] text-white">
                {group.type} &nbsp;|&nbsp; {group.supplier}
              </span>
            </div>

            {/* Data rows */}
            {group.items.map((item, ii) => (
              <div
                key={ii}
                className="grid font-josefin text-[14px] px-[16px] py-[14px] items-center"
                style={{
                  backgroundColor: ii % 2 === 0 ? "rgba(222,241,244,1)" : "rgba(255,255,255,1)",
                  gridTemplateColumns: "2fr 1fr 1fr 0.7fr 1fr 1fr",
                }}
              >
                <span className="font-medium text-black">{item.nama}</span>
                <span className="text-black">{item.jenis}</span>
                <span className="text-black">{item.ketahanan}</span>
                <span className="font-bold text-black">{item.tren}</span>
                <span className="text-black">{item.usulan}</span>
                <span>
                  <span
                    className="font-medium text-[12px] px-[8px] py-[4px] rounded-full"
                    style={{ color: "rgb(31,146,84)", backgroundColor: "rgba(31,146,84,0.12)" }}
                  >
                    {item.status}
                  </span>
                </span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center gap-[12px]">
      <h2 className="font-josefin font-bold text-[22px] text-black leading-none">{title}</h2>
      <span
        className="font-josefin font-semibold text-[14px] text-white px-[12px] py-[5px] rounded-full leading-none"
        style={{ backgroundColor: "#0c818a" }}
      >
        {badge}
      </span>
    </div>
  );
}

// --- Main Page ---

export default function LogisticPage() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"pengadaan" | "deadstock">("pengadaan");
  const [modal, setModal] = useState<ModalState>(closedModal);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 700);
    return () => clearTimeout(t);
  }, []);

  const openModal = (config: Omit<ModalState, "open">) =>
    setModal({ open: true, ...config });
  const closeModal = () => setModal(closedModal);

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Logistic" />
      {!loaded && <ContentSkeleton />}
      {loaded && <Tabs active={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)} />}

      {loaded && (activeTab === "pengadaan" ? (
        <>
          <InfoStatCards items={statCards} wrap={false} />
          <AiBanner />
          <StockChart />
          <DefektaTable />
        </>
      ) : (
        <>
          {/* Near-Expiry */}
          <div className="flex flex-col gap-[10px]">
            <SectionHeader title="Near-Expiry" badge="mendekati kedaluwarsa" />
            <div className="flex flex-col gap-[8px]">
              {nearExpiryItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[12px] px-[20px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-josefin font-semibold text-[24px] text-black leading-tight">
                      {item.nama}
                    </span>
                    <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black">
                      <span>{item.qty}</span>
                      <span>|</span>
                      <span>{item.nilai}</span>
                    </div>
                  </div>
                  <button
                    className="font-josefin font-medium text-[14px] text-white rounded-[8px] px-[16px] py-[8px] transition-opacity hover:opacity-80 cursor-pointer shrink-0"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.expired}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Slow-Moving */}
          <div className="flex flex-col gap-[10px]">
            <SectionHeader title="Slow-Moving" badge="modal tertahan" />
            <div className="flex flex-col gap-[8px]">
              {slowMovingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[12px] px-[20px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-josefin font-semibold text-[24px] text-black leading-tight">
                      {item.nama}
                    </span>
                    <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black">
                      <span>{item.modal}</span>
                      <span>|</span>
                      <span>{item.tertahan}</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      openModal(
                        item.action === "Tanda retur"
                          ? {
                              title: "Konfirmasi Retur",
                              description: `Tandai ${item.nama} sebagai retur? Modal ${item.modal} akan diproses kembali.`,
                              confirmLabel: "Tanda Retur",
                              onConfirm: () => closeModal(),
                            }
                          : {
                              title: "Konfirmasi Realokasi",
                              description: `Sarankan realokasi ${item.nama} ke cabang lain? Modal ${item.modal} (${item.tertahan}) akan dipindahkan.`,
                              confirmLabel: "Realokasi",
                              onConfirm: () => closeModal(),
                            }
                      )
                    }
                    className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[20px] py-[10px] transition-opacity hover:opacity-80 cursor-pointer shrink-0"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Relokasi Antar-Cabang */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="font-josefin font-bold text-[22px] text-black leading-none">
              Relokasi Antar-Cabang
            </h2>
            <div className="flex flex-col gap-[8px]">
              {relokasiItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[12px] px-[20px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-[16px]">
                    <ArrowLeftRight className="size-[28px] text-[#0c818a] shrink-0" />
                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center gap-[12px]">
                        <span className="font-josefin font-bold text-[20px] text-[#0c818a] leading-none">
                          {item.drug}
                        </span>
                        <span className="font-josefin text-[20px] text-black leading-none">{item.from}</span>
                        <span className="text-black">→</span>
                        <span className="font-josefin text-[20px] text-black leading-none">{item.to}</span>
                      </div>
                      <span className="font-josefin text-[16px] text-black leading-none">{item.desc}</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      openModal({
                        title: "Konfirmasi Relokasi",
                        description: `Pindahkan 90 unit ${item.drug} dari ${item.from} ke ${item.to}? Stok akan tutup kebutuhan 5 hari.`,
                        confirmLabel: "Pindahkan",
                        onConfirm: () => closeModal(),
                      })
                    }
                    className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[20px] py-[10px] transition-opacity hover:opacity-80 cursor-pointer shrink-0"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    Pindahkan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ))}

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
