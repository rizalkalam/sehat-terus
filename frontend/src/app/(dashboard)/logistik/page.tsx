"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Truck, ArrowLeftRight, Lock } from "lucide-react";
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
import InfoStatCards, { StatCardItem } from "@/components/InfoStatCards";
import ConfirmModal from "@/components/ConfirmModal";
import { ContentSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { postJson } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- API response types ---

interface ChartPoint {
  drug: string;
  sisaStock: number;
  kebutuhan: number;
}

interface StatsResponse {
  deadStock: { modal: number; count: number };
  stockout: { risiko: number; count: number };
  ketahanan: { hari: number; item: string; faskes: string };
  cabangBerisiko: { count: number; total: number };
}

interface DefektaItem {
  obat_id: string;
  nama: string;
  jenis: string;
  satuan: string;
  ketahanan_hari: number | null;
  tren_harian: number;
  jumlah_tersedia: number;
  stok_minimum: number;
  jumlah_kekurangan: number;
  usulan_pesanan: number;
  harga_satuan: number;
}

interface DefektaGroup {
  pbf: { id: string | null; nama: string };
  tipe: "reguler" | "npp";
  locked: boolean;
  items: DefektaItem[];
}

interface NearExpiryItem {
  nama: string;
  qty: string;
  nilai: string;
  expired: string;
}

interface SlowMovingItem {
  stok_id: string;
  obat: { id: string; nama: string };
  faskes: { id: string; nama: string } | null;
  jumlah_tersedia: number;
  hari_tidak_bergerak: number | null;
  nilai_modal_rp: number;
  saran: "realokasi" | "retur";
  faskes_tujuan_realokasi: { id: string; nama: string } | null;
}

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

const rupiah = (n: number) => `Rp ${(n / 1000000).toFixed(1)}jt`;

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

function StockChart({ data }: { data: ChartPoint[] }) {
  return (
    <div>
      <h2 className="font-josefin font-bold text-[22px] text-black mb-[10px]">
        Stok &amp; Kebutuhan Bulan Depan
      </h2>
      <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[16px] p-[20px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-[#0c818a]/60 font-josefin text-[14px]">
            Memuat data stok...
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
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
        )}
      </div>
    </div>
  );
}

function DefektaTable({ groups, onBuatPesanan }: { groups: DefektaGroup[]; onBuatPesanan: (g: DefektaGroup) => void }) {
  return (
    <div>
      <h2 className="font-josefin font-bold text-[22px] text-black mb-[10px]">
        Defekta — Obat di Bawah Stok Minimum
      </h2>
      {groups.length === 0 ? (
        <p className="font-josefin text-[14px] text-black/50 px-[16px] py-[20px]">
          Tidak ada obat di bawah stok minimum saat ini.
        </p>
      ) : (
      <div className="rounded-[12px] overflow-hidden shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
        <div
          className="grid font-josefin font-bold text-[14px] text-white px-[16px] py-[12px]"
          style={{ backgroundColor: "#00454A", gridTemplateColumns: "2fr 1fr 1fr 0.7fr 1fr" }}
        >
          <span>nama item</span>
          <span>jenis</span>
          <span>ketahanan</span>
          <span>tren</span>
          <span>usulan</span>
        </div>

        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            <div
              className="flex items-center justify-between gap-[10px] px-[16px] py-[8px]"
              style={{ backgroundColor: "#00454A" }}
            >
              <div className="flex items-center gap-[10px]">
                {group.locked ? (
                  <Lock className="size-[16px] text-white shrink-0" />
                ) : (
                  <Truck className="size-[18px] text-white shrink-0" />
                )}
                <span className="font-josefin font-bold text-[14px] text-white">
                  SP {group.tipe} &nbsp;|&nbsp; {group.pbf.nama}
                </span>
              </div>
              <button
                onClick={() => onBuatPesanan(group)}
                disabled={group.locked}
                className="font-josefin font-medium text-[12px] text-white rounded-[6px] px-[12px] py-[6px] transition-opacity hover:opacity-80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "#0c818a" }}
              >
                {group.locked ? "SP Aktif Berjalan" : "Buat Pesanan"}
              </button>
            </div>

            {group.items.map((item, ii) => (
              <div
                key={ii}
                className="grid font-josefin text-[14px] px-[16px] py-[14px] items-center"
                style={{
                  backgroundColor: ii % 2 === 0 ? "rgba(222,241,244,1)" : "rgba(255,255,255,1)",
                  gridTemplateColumns: "2fr 1fr 1fr 0.7fr 1fr",
                }}
              >
                <span className="font-medium text-black">{item.nama}</span>
                <span className="text-black">{item.jenis === "obat_jadi" ? "obat jadi" : "bahan baku"}</span>
                <span className="text-black">{item.ketahanan_hari !== null ? `${item.ketahanan_hari} hari` : "—"}</span>
                <span className="font-bold text-black">{item.tren_harian}</span>
                <span className="text-black">{item.usulan_pesanan} {item.satuan}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      )}
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
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"pengadaan" | "deadstock">("pengadaan");
  const [modal, setModal] = useState<ModalState>(closedModal);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [defektaGroups, setDefektaGroups] = useState<DefektaGroup[]>([]);
  const [nearExpiryItems, setNearExpiryItems] = useState<NearExpiryItem[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingItem[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, chartRes, defektaRes, nearExpiryRes, slowMovingRes] = await Promise.all([
        fetch(`${API_BASE}/api/logistic/stats`, { credentials: "include" }),
        fetch(`${API_BASE}/api/logistic/stok/chart`, { credentials: "include" }),
        fetch(`${API_BASE}/api/logistic/defekta`, { credentials: "include" }),
        fetch(`${API_BASE}/api/logistic/near-expiry`, { credentials: "include" }),
        fetch(`${API_BASE}/api/logistic/slow-moving`, { credentials: "include" }),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).data);
      if (chartRes.ok) setChartData((await chartRes.json()).data);
      if (defektaRes.ok) setDefektaGroups((await defektaRes.json()).data);
      if (nearExpiryRes.ok) setNearExpiryItems((await nearExpiryRes.json()).data);
      if (slowMovingRes.ok) setSlowMovingItems((await slowMovingRes.json()).data);
    } catch (err) {
      console.error("Error fetching logistik data:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const closeModal = () => setModal(closedModal);

  const statCards: StatCardItem[] = stats
    ? [
        { label: "Modal dead-stock", value: rupiah(stats.deadStock.modal), badges: [`${stats.deadStock.count} item`] },
        { label: "Risiko stockout", value: rupiah(stats.stockout.risiko), badges: [`${stats.stockout.count} item kritis`] },
        {
          label: "Ketahanan terpendek",
          value: stats.ketahanan.hari > 0 ? `${stats.ketahanan.hari} hari` : "—",
          badges: [stats.ketahanan.item, stats.ketahanan.faskes].filter(Boolean),
        },
        { label: "Cabang berisiko", value: `${stats.cabangBerisiko.count}/${stats.cabangBerisiko.total}`, badges: [] },
      ]
    : [];

  async function handleBuatPesanan(group: DefektaGroup) {
    if (!user?.faskes_id || !group.pbf.id) return;
    setModal({
      open: true,
      title: "Konfirmasi Buat Pesanan",
      description: `Buat SP ${group.tipe} ke ${group.pbf.nama} untuk ${group.items.length} item (total usulan ${group.items.reduce((s, i) => s + i.usulan_pesanan, 0)} unit)?`,
      confirmLabel: "Buat Pesanan",
      onConfirm: async () => {
        const result = await postJson("/api/logistic/surat-pesanan", {
          faskes_id: user.faskes_id,
          pbf_id: group.pbf.id,
          tipe: group.tipe,
          items: group.items.map((i) => ({ obat_id: i.obat_id, jumlah_usulan: i.usulan_pesanan })),
        });
        if (!result.ok) alert(result.error);
        else await fetchAll();
        closeModal();
      },
    });
  }

  async function handleRealokasi(item: SlowMovingItem) {
    if (!item.faskes || !item.faskes_tujuan_realokasi) return;
    setModal({
      open: true,
      title: "Konfirmasi Realokasi",
      description: `Pindahkan seluruh sisa stok ${item.obat.nama} (${item.jumlah_tersedia} unit) dari ${item.faskes.nama} ke ${item.faskes_tujuan_realokasi.nama}?`,
      confirmLabel: "Pindahkan",
      onConfirm: async () => {
        const result = await postJson("/api/stok/realokasi", {
          obat_id: item.obat.id,
          faskes_asal_id: item.faskes!.id,
          faskes_tujuan_id: item.faskes_tujuan_realokasi!.id,
          jumlah: item.jumlah_tersedia,
        });
        if (!result.ok) alert(result.error);
        else await fetchAll();
        closeModal();
      },
    });
  }

  async function handleRetur(item: SlowMovingItem) {
    if (!item.faskes) return;
    setModal({
      open: true,
      title: "Konfirmasi Retur",
      description: `Tandai ${item.obat.nama} (${item.jumlah_tersedia} unit) sebagai retur slow-moving di ${item.faskes.nama}? Modal ${rupiah(item.nilai_modal_rp)} akan diproses kembali.`,
      confirmLabel: "Tanda Retur",
      onConfirm: async () => {
        const result = await postJson("/api/stok/retur", {
          obat_id: item.obat.id,
          faskes_id: item.faskes!.id,
          jumlah: item.jumlah_tersedia,
          alasan: "slow_moving",
        });
        if (!result.ok) alert(result.error);
        else await fetchAll();
        closeModal();
      },
    });
  }

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Logistic" />
      {!loaded && <ContentSkeleton />}
      {loaded && <Tabs active={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)} />}

      {loaded && (activeTab === "pengadaan" ? (
        <>
          <InfoStatCards items={statCards} wrap={false} />
          <AiBanner />
          <StockChart data={chartData} />
          <DefektaTable groups={defektaGroups} onBuatPesanan={handleBuatPesanan} />
        </>
      ) : (
        <>
          {/* Near-Expiry */}
          <div className="flex flex-col gap-[10px]">
            <SectionHeader title="Near-Expiry" badge="mendekati kedaluwarsa" />
            {nearExpiryItems.length === 0 && (
              <p className="font-josefin text-[14px] text-black/50 px-[4px]">Tidak ada obat mendekati kedaluwarsa.</p>
            )}
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
                  <span
                    className="font-josefin font-medium text-[14px] text-white rounded-[8px] px-[16px] py-[8px] shrink-0"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.expired}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slow-Moving */}
          <div className="flex flex-col gap-[10px]">
            <SectionHeader title="Slow-Moving" badge="modal tertahan" />
            {slowMovingItems.length === 0 && (
              <p className="font-josefin text-[14px] text-black/50 px-[4px]">Tidak ada obat slow-moving saat ini.</p>
            )}
            <div className="flex flex-col gap-[8px]">
              {slowMovingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[12px] px-[20px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-josefin font-semibold text-[24px] text-black leading-tight">
                      {item.obat.nama}
                    </span>
                    <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black">
                      <span>{item.faskes?.nama ?? "—"}</span>
                      <span>|</span>
                      <span>{rupiah(item.nilai_modal_rp)} tertahan</span>
                    </div>
                  </div>
                  <button
                    onClick={() => (item.saran === "realokasi" ? handleRealokasi(item) : handleRetur(item))}
                    className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[20px] py-[10px] transition-opacity hover:opacity-80 cursor-pointer shrink-0"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.saran === "realokasi" ? "Sarankan realokasi" : "Tanda retur"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Relokasi Antar-Cabang — turunan dari slow-moving yang punya saran realokasi */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="font-josefin font-bold text-[22px] text-black leading-none">
              Relokasi Antar-Cabang
            </h2>
            {slowMovingItems.filter((i) => i.saran === "realokasi").length === 0 && (
              <p className="font-josefin text-[14px] text-black/50 px-[4px]">Tidak ada saran realokasi saat ini.</p>
            )}
            <div className="flex flex-col gap-[8px]">
              {slowMovingItems.filter((i) => i.saran === "realokasi").map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[12px] px-[20px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-[16px]">
                    <ArrowLeftRight className="size-[28px] text-[#0c818a] shrink-0" />
                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center gap-[12px]">
                        <span className="font-josefin font-bold text-[20px] text-[#0c818a] leading-none">
                          {item.obat.nama}
                        </span>
                        <span className="font-josefin text-[20px] text-black leading-none">{item.faskes?.nama}</span>
                        <span className="text-black">→</span>
                        <span className="font-josefin text-[20px] text-black leading-none">{item.faskes_tujuan_realokasi?.nama}</span>
                      </div>
                      <span className="font-josefin text-[16px] text-black leading-none">
                        Pindah {item.jumlah_tersedia} unit dari stok yang tidak bergerak
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRealokasi(item)}
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
