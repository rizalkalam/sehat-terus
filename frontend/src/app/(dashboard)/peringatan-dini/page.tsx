"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import InfoStatCards, { type StatCardItem } from "@/components/InfoStatCards";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDetailModal, { type AlertDetailData } from "@/components/AlertDetailModal";
import { ContentSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { postJson } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- API response shapes ---

interface AlertsStatsResponse {
  stok_kritis: { jumlah: number; label: string; badges: string[] };
  total_lonjakan: { jumlah: number; label: string; badges: string[] };
  wilayah_terdampak: { jumlah: number; label: string; badges: string[] };
}

interface AlertsSummaryResponse {
  teks: string;
  generated_at: string;
}

interface AlertRecord {
  id: string;
  kecamatan: string;
  jenis_penyakit: string;
  kode_icd10: string;
  persen_lonjakan: number;
  laju_harian: number | null;
  jumlah_kasus: number;
  status: "aktif" | "ditangani" | "selesai";
  level: "kritis" | "waspada";
  ketahanan_stok_jam: number | null;
  terdeteksi_pada: string;
}

interface AlertDetailResponse {
  id: string;
  kecamatan: string;
  jenis_penyakit: string;
  kode_icd10: string;
  persen_lonjakan: number;
  laju_harian: number | null;
  jumlah_kasus: number;
  status: string;
  level: "kritis" | "waspada";
  terdeteksi_pada: string;
  estimasi_puncak: string;
  obat_kritis: { obat_id: string; nama: string; stok_tersedia: number; ketahanan_jam: number | null }[];
}

// --- Data ---

interface AlertItem {
  id: string;
  title: string;
  stats: string[];
  badge: string;
  badgeColor: string;
  status: AlertRecord["status"];
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "diperbarui baru saja";
  if (minutes < 60) return `diperbarui ${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `diperbarui ${hours} jam lalu`;
  return `diperbarui ${Math.floor(hours / 24)} hari lalu`;
}

function toAlertItem(a: AlertRecord): AlertItem {
  const stats = [`+${Math.round(a.persen_lonjakan)}%`];
  stats.push(`${a.jumlah_kasus} kasus`);
  if (a.ketahanan_stok_jam !== null) stats.push(`stok <${a.ketahanan_stok_jam}jam`);

  return {
    id: a.id,
    title: `${a.jenis_penyakit} - Kec. ${a.kecamatan}`,
    stats,
    badge: a.level === "kritis" ? "Kritis" : "Waspada",
    badgeColor: a.level === "kritis" ? "#F44444" : "#F59E0B",
    status: a.status,
  };
}

function toDetailData(d: AlertDetailResponse): AlertDetailData {
  return {
    kasusAktif: d.jumlah_kasus,
    tren:
      d.laju_harian !== null
        ? `Meningkat ${Math.round(d.persen_lonjakan)}% dibanding baseline, laju ${d.laju_harian.toFixed(1)}%/hari.`
        : `Meningkat ${Math.round(d.persen_lonjakan)}% dibanding baseline.`,
    // No cause-analysis data source exists yet — honest placeholder instead of a fabricated reason.
    penyebab: "Belum dianalisis otomatis — perlu investigasi epidemiologi lanjutan di lapangan.",
    // `wilayah` schema only tracks kecamatan-level granularity (see TPS-API-SPEC.md), not kelurahan.
    wilayah: [d.kecamatan],
    obatKritis:
      d.obat_kritis.length > 0
        ? d.obat_kritis.map((o) => `${o.nama} (${o.stok_tersedia} tersisa)`)
        : ["Tidak ada obat kritis tercatat untuk alert ini"],
    estimasiPuncak: d.estimasi_puncak,
  };
}

interface ChartPoint {
  bulan: string;
  jumlah_tersedia: number;
  kebutuhan_prediksi: number;
}

interface SlowMovingItem {
  stok_id: string;
  obat: { id: string; nama: string };
  faskes: { id: string; nama: string; tipe: string; kecamatan: string | null; alamat: string | null } | null;
  jumlah_tersedia: number;
  nilai_modal_rp: number;
  saran: "realokasi" | "retur";
  faskes_tujuan_realokasi: {
    id: string;
    nama: string;
    tipe: string | null;
    kecamatan: string | null;
    alamat: string | null;
    stok_tersedia: number;
    stok_minimum: number;
    kekurangan: number;
  } | null;
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

// --- Sub-components ---

function AlertAndChart({
  alerts,
  chartData,
  chartTitle,
  onAlertClick,
  onAction,
}: {
  alerts: AlertItem[];
  chartData: ChartPoint[];
  chartTitle: string | null;
  onAlertClick: (item: AlertItem) => void;
  onAction: (id: string, status: "ditangani" | "selesai") => void;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      <h2 className="font-josefin font-bold text-[22px] text-black">
        Daftar Alert &amp; Lonjakan Kasus
      </h2>
      <div className="flex flex-col xl:flex-row gap-[16px]">
        {/* Alert cards — left column. Height matches the chart card beside it
            (240px chart + 24px*2 padding = 288px) so the two sections line up;
            excess alerts scroll internally instead of stretching the row. */}
        <div className="flex flex-col gap-[10px] flex-1 min-w-0 xl:h-[288px] xl:overflow-y-auto xl:pr-[6px]">
          {alerts.length === 0 && (
            <div className="rounded-[18px] px-[14px] py-[24px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md text-center text-black/50 font-josefin">
              Tidak ada alert aktif saat ini.
            </div>
          )}
          {alerts.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onAlertClick(item)}
              onKeyDown={(e) => e.key === "Enter" && onAlertClick(item)}
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
              <div className="flex items-center gap-[8px] shrink-0 ml-[12px]" onClick={(e) => e.stopPropagation()}>
                {item.status !== "selesai" && (
                  <>
                    {item.status === "aktif" && (
                      <button
                        onClick={() => onAction(item.id, "ditangani")}
                        className="font-josefin text-[12px] text-[#0c818a] px-[10px] py-[6px] rounded-[8px] border border-[#0c818a] hover:bg-[#0c818a]/10 transition-colors cursor-pointer"
                      >
                        Tangani
                      </button>
                    )}
                    <button
                      onClick={() => onAction(item.id, "selesai")}
                      className="font-josefin text-[12px] text-white px-[10px] py-[6px] rounded-[8px] bg-[#0c818a] hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      Selesai
                    </button>
                  </>
                )}
                <span
                  className="font-josefin font-medium text-[14px] text-white px-[12px] py-[8px] rounded-full"
                  style={{ backgroundColor: item.badgeColor }}
                >
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Line chart — right column */}
        <div className="bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[18px] p-[24px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)] w-full xl:w-[460px] xl:shrink-0 flex flex-col gap-[8px]">
          {chartTitle && (
            <span className="font-josefin font-semibold text-[13px] text-[#0c818a] truncate">
              Stok vs Kebutuhan: {chartTitle}
            </span>
          )}
          {chartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-[#0c818a]/60 font-josefin text-[13px] text-center px-[10px]">
              Tidak ada obat kritis untuk ditampilkan saat ini.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="bulan"
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
                dataKey="jumlah_tersedia"
                name="Sisa stock"
                stroke="#0C818A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#0C818A", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="kebutuhan_prediksi"
                name="Kebutuhan bulan depan"
                stroke="#84C6CB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#84C6CB", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function EarlyWarningPage() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalState>(closedModal);
  const [detailItem, setDetailItem] = useState<AlertItem | null>(null);
  const [detailData, setDetailData] = useState<AlertDetailData | null>(null);

  const [statsData, setStatsData] = useState<AlertsStatsResponse | null>(null);
  const [summaryData, setSummaryData] = useState<AlertsSummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartTitle, setChartTitle] = useState<string | null>(null);
  const [tindakanItems, setTindakanItems] = useState<SlowMovingItem[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, summaryRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/api/alerts/stats`, { credentials: "include" }),
        fetch(`${API_BASE}/api/alerts/summary`, { credentials: "include" }),
        fetch(`${API_BASE}/api/alerts`, { credentials: "include" }),
      ]);
      if (statsRes.ok) setStatsData(await statsRes.json());
      if (summaryRes.ok) setSummaryData(await summaryRes.json());
      if (alertsRes.ok) {
        const raw: AlertRecord[] = await alertsRes.json();
        setAlerts(raw.map(toAlertItem));
      }

      // Tindakan Darurat (F17) — obat slow-moving nyata di faskes user, dengan saran
      // realokasi (kalau ada faskes lain yang benar-benar defisit) atau retur.
      if (user?.faskes_id) {
        const slowMovingRes = await fetch(
          `${API_BASE}/api/logistic/slow-moving?faskes_id=${user.faskes_id}`,
          { credentials: "include" }
        );
        if (slowMovingRes.ok) {
          const items: SlowMovingItem[] = (await slowMovingRes.json()).data;
          setTindakanItems(items.slice(0, 3));
        }

        // Line chart (F19) — obat paling kritis (defekta pertama) di faskes user.
        const defektaRes = await fetch(
          `${API_BASE}/api/logistic/defekta?faskes_id=${user.faskes_id}`,
          { credentials: "include" }
        );
        if (defektaRes.ok) {
          const groups: { items: { obat_id: string; nama: string }[] }[] = (await defektaRes.json()).data;
          const firstItem = groups[0]?.items[0];
          if (firstItem) {
            setChartTitle(firstItem.nama);
            const chartRes = await fetch(
              `${API_BASE}/api/logistic/stok/chart?mode=line&faskes_id=${user.faskes_id}&obat_id=${firstItem.obat_id}`,
              { credentials: "include" }
            );
            if (chartRes.ok) setChartData((await chartRes.json()).data);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching EWS data:", err);
    } finally {
      setLoaded(true);
    }
  }, [user?.faskes_id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleTindakanRealokasi(item: SlowMovingItem) {
    if (!item.faskes || !item.faskes_tujuan_realokasi) return;
    openModal({
      title: "Konfirmasi Relokasi",
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
        closeModal();
        fetchAll();
      },
    });
  }

  async function handleTindakanRetur(item: SlowMovingItem) {
    if (!item.faskes) return;
    openModal({
      title: "Konfirmasi Retur",
      description: `Tandai ${item.obat.nama} (${item.jumlah_tersedia} unit) sebagai retur slow-moving? Modal Rp ${(item.nilai_modal_rp / 1000000).toFixed(1)}jt akan diproses kembali.`,
      confirmLabel: "Tanda Retur",
      onConfirm: async () => {
        const result = await postJson("/api/stok/retur", {
          obat_id: item.obat.id,
          faskes_id: item.faskes!.id,
          jumlah: item.jumlah_tersedia,
          alasan: "slow_moving",
        });
        if (!result.ok) alert(result.error);
        closeModal();
        fetchAll();
      },
    });
  }

  const openModal = (config: Omit<ModalState, "open">) =>
    setModal({ open: true, ...config });
  const closeModal = () => setModal(closedModal);

  const handleAlertClick = async (item: AlertItem) => {
    setDetailItem(item);
    setDetailData(null);
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${item.id}`, { credentials: "include" });
      if (res.ok) setDetailData(toDetailData(await res.json()));
    } catch (err) {
      console.error("Error fetching alert detail:", err);
    }
  };

  const handleAction = (id: string, status: "ditangani" | "selesai") => {
    openModal({
      title: status === "ditangani" ? "Tandai Ditangani?" : "Tandai Selesai?",
      description:
        status === "ditangani"
          ? "Alert ini akan ditandai sedang ditangani oleh tim Anda."
          : "Alert ini akan ditandai selesai dan tidak lagi muncul di daftar aktif.",
      confirmLabel: "Konfirmasi",
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE}/api/alerts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status }),
          });
        } catch (err) {
          console.error("Error updating alert status:", err);
        } finally {
          closeModal();
          fetchAll();
        }
      },
    });
  };

  // Stat card labels/badges come straight from the API response — only the
  // `value` field's unit suffix is chosen here for display purposes.
  const statCards: StatCardItem[] = statsData
    ? [
        { label: statsData.stok_kritis.label, value: `${statsData.stok_kritis.jumlah} Obat`, badges: statsData.stok_kritis.badges },
        { label: statsData.total_lonjakan.label, value: `${statsData.total_lonjakan.jumlah} Alert`, badges: statsData.total_lonjakan.badges },
        { label: statsData.wilayah_terdampak.label, value: `${statsData.wilayah_terdampak.jumlah} Kec.`, badges: statsData.wilayah_terdampak.badges },
      ]
    : [];

  return (
    <div className="px-4 sm:px-6 xl:px-[41px] py-4 xl:py-[29px] flex flex-col gap-4 xl:gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Early Warning" />

      {!loaded ? (
        <ContentSkeleton />
      ) : (
        <>
          <InfoStatCards items={statCards} />
          <AiBanner text={summaryData?.teks} updatedAt={summaryData ? timeAgo(summaryData.generated_at) : undefined} />
          <AlertAndChart alerts={alerts} chartData={chartData} chartTitle={chartTitle} onAlertClick={handleAlertClick} onAction={handleAction} />

          {/* Tindakan Darurat */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="font-josefin font-bold text-[22px] text-black">
              Tindakan Darurat
            </h2>
            {tindakanItems.length === 0 && (
              <div className="rounded-[18px] px-[14px] py-[20px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md text-center text-black/50 font-josefin">
                Tidak ada obat slow-moving yang butuh tindakan saat ini.
              </div>
            )}
            <div className="flex flex-col gap-[10px]">
              {tindakanItems.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] rounded-[18px] px-[14px] py-[14px] bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-[16px] min-w-0">
                    {item.saran === "realokasi" ? (
                      <ArrowLeftRight className="size-[28px] text-[#0c818a] shrink-0" />
                    ) : (
                      <Package className="size-[32px] text-[#0c818a] shrink-0" />
                    )}
                    <div className="flex flex-col gap-[4px] min-w-0">
                      {item.saran === "realokasi" ? (
                        <>
                          <span className="font-josefin font-bold text-[18px] text-[#0c818a] leading-tight">
                            {item.obat.nama}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-[6px] gap-y-[2px] font-josefin text-[15px] text-black leading-tight">
                            <span>{item.faskes?.nama}</span>
                            {item.faskes?.kecamatan && <span className="text-black/50">({item.faskes.kecamatan})</span>}
                            <span className="text-black/60">→</span>
                            <span>{item.faskes_tujuan_realokasi?.nama}</span>
                            {item.faskes_tujuan_realokasi?.kecamatan && (
                              <span className="text-black/50">({item.faskes_tujuan_realokasi.kecamatan})</span>
                            )}
                          </div>
                          <span className="font-josefin text-[14px] text-black/70 leading-tight">
                            Pindah {item.jumlah_tersedia} unit stok tak bergerak — tujuan kekurangan{" "}
                            {item.faskes_tujuan_realokasi?.kekurangan} unit ({item.faskes_tujuan_realokasi?.stok_tersedia}/
                            {item.faskes_tujuan_realokasi?.stok_minimum})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-josefin font-semibold text-[24px] text-black leading-tight">
                            {item.obat.nama}
                          </span>
                          <div className="flex items-center gap-[8px] font-josefin text-[16px] text-black">
                            <span>{item.jumlah_tersedia} unit</span>
                            <span className="text-black/40">|</span>
                            <span>Rp {(item.nilai_modal_rp / 1000000).toFixed(1)}jt tertahan</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => (item.saran === "realokasi" ? handleTindakanRealokasi(item) : handleTindakanRetur(item))}
                    className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[14px] py-[10px] transition-opacity hover:opacity-80 cursor-pointer shrink-0 self-start sm:self-auto sm:ml-[16px]"
                    style={{ backgroundColor: "#0c818a" }}
                  >
                    {item.saran === "realokasi" ? "Pindahkan" : "Tanda retur"}
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
        detail={detailData}
        onClose={() => {
          setDetailItem(null);
          setDetailData(null);
        }}
      />
    </div>
  );
}
