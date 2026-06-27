"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Package,
  CheckCircle,
  FileText,
  Bell,
  type LucideIcon,
} from "lucide-react";

// --- Types ---

type NotifType = "kritis" | "waspada" | "stok" | "aksi" | "sistem";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface TypeConfig {
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}

// --- Static data ---

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "kritis",
    title: "Lonjakan diare Kec. Depok",
    description: "Kasus meningkat 247% dalam 3 hari. Threshold kritis terlampaui.",
    time: "2 mnt lalu",
    read: false,
  },
  {
    id: "2",
    type: "stok",
    title: "Stok Oralit Cabang Sleman kritis",
    description: "Ketahanan stok < 48 jam. Segera lakukan relokasi dari Bantul.",
    time: "15 mnt lalu",
    read: false,
  },
  {
    id: "3",
    type: "waspada",
    title: "ISPA Kec. Mlati — Status Waspada",
    description: "Kasus meningkat 247%, mendekati threshold kritis.",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "4",
    type: "aksi",
    title: "Relokasi Amoksilin selesai",
    description: "90 unit berhasil dipindahkan dari Bantul ke Sleman.",
    time: "3 jam lalu",
    read: true,
  },
  {
    id: "5",
    type: "sistem",
    title: "Laporan mingguan tersedia",
    description: "Laporan epidemiologi minggu ini telah diproses dan siap diunduh.",
    time: "5 jam lalu",
    read: true,
  },
];

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  kritis: { Icon: AlertTriangle, color: "#F44444", bgColor: "rgba(244,68,68,0.10)", label: "Kritis" },
  waspada: { Icon: AlertTriangle, color: "#F59E0B", bgColor: "rgba(245,158,11,0.10)", label: "Waspada" },
  stok: { Icon: Package, color: "#F97316", bgColor: "rgba(249,115,22,0.10)", label: "Stok" },
  aksi: { Icon: CheckCircle, color: "#0C818A", bgColor: "rgba(12,129,138,0.10)", label: "Aksi" },
  sistem: { Icon: FileText, color: "#64748B", bgColor: "rgba(100,116,139,0.10)", label: "Sistem" },
};

// --- Main component ---

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationPanel({ open, onClose, onUnreadChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayItems = notifications.slice(0, 3);
  const earlierItems = notifications.slice(3);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  if (!open) return null;

  return (
    <>
      {/* Backdrop — click to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full w-[400px] z-50 flex flex-col bg-white"
        style={{ boxShadow: "-6px 0 40px 0 rgba(0,0,0,0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-josefin font-bold text-[20px] text-black leading-none">
              Notifikasi
            </h2>
            {unreadCount > 0 && (
              <p className="font-josefin text-[13px] text-black/50 leading-none mt-[4px]">
                {unreadCount} belum dibaca
              </p>
            )}
          </div>
          <div className="flex items-center gap-[12px]">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-josefin text-[13px] text-[#0c818a] hover:underline cursor-pointer leading-none"
              >
                Tandai semua
              </button>
            )}
            <button
              onClick={onClose}
              className="size-[32px] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="size-[16px] text-black/60" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-[12px] px-[24px] text-center">
              <Bell className="size-[40px] text-black/20" />
              <p className="font-josefin text-[15px] text-black/40 leading-snug">
                Tidak ada notifikasi
              </p>
            </div>
          ) : (
            <>
              <SectionLabel label="Hari Ini" />
              {todayItems.map((n) => (
                <NotifItem key={n.id} notif={n} onRead={() => markRead(n.id)} />
              ))}

              {earlierItems.length > 0 && (
                <>
                  <SectionLabel label="Lebih Awal" />
                  {earlierItems.map((n) => (
                    <NotifItem key={n.id} notif={n} onRead={() => markRead(n.id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// --- Sub-components ---

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-[24px] pt-[16px] pb-[6px]">
      <span className="font-josefin font-semibold text-[11px] tracking-[0.12em] uppercase text-black/40">
        {label}
      </span>
    </div>
  );
}

function NotifItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: () => void;
}) {
  const { Icon, color, bgColor, label } = TYPE_CONFIG[notif.type];

  return (
    <button
      onClick={onRead}
      className={`flex items-start gap-[14px] w-full px-[24px] py-[14px] text-left transition-colors hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${
        !notif.read ? "bg-[rgba(12,129,138,0.04)]" : ""
      }`}
    >
      {/* Type icon */}
      <div
        className="size-[38px] rounded-full flex items-center justify-center shrink-0 mt-[2px]"
        style={{ backgroundColor: bgColor, color }}
      >
        <Icon className="size-[17px]" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[4px] flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[8px]">
          <span
            className={`font-josefin text-[15px] text-black leading-snug ${
              !notif.read ? "font-semibold" : "font-normal"
            }`}
          >
            {notif.title}
          </span>
          {!notif.read && (
            <span
              className="size-[8px] rounded-full shrink-0 mt-[5px]"
              style={{ backgroundColor: "#0c818a" }}
            />
          )}
        </div>

        <p className="font-josefin text-[13px] text-black/50 leading-snug line-clamp-2">
          {notif.description}
        </p>

        <div className="flex items-center gap-[8px] mt-[2px]">
          <span className="font-josefin text-[12px] text-black/40 leading-none">
            {notif.time}
          </span>
          <span
            className="font-josefin font-semibold text-[11px] px-[8px] py-[3px] rounded-full leading-none"
            style={{ color, backgroundColor: bgColor }}
          >
            {label}
          </span>
        </div>
      </div>
    </button>
  );
}
