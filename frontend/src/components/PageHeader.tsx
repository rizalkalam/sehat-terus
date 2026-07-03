"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EditProfileModal from "@/components/EditProfileModal";
import NotificationPanel from "@/components/NotificationPanel";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const greetingName = user?.name ?? "Carmen";
  const displayName = user?.displayName ?? "Carmenita";
  const avatarSrc = user?.avatarSrc ?? DEFAULT_AVATAR;

  return (
    <>
      <header className="flex justify-between items-start w-full">
        <div>
          <p className="text-[#0c818a] font-semibold text-[20px] font-josefin leading-normal">
            Selamat datang, {greetingName}
          </p>
          <h1 className="text-black font-normal text-[40px] font-josefin leading-none mt-1">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-[16px]">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="text-[#0c818a] hover:scale-110 transition-transform duration-300 relative cursor-pointer"
            aria-label="Notifikasi"
          >
            <Bell className="size-[24px] fill-[#0c818a]" />
            {unreadCount > 0 && (
              <span className="absolute -top-[5px] -right-[5px] min-w-[18px] h-[18px] rounded-full bg-[#F44444] flex items-center justify-center px-[3px]">
                <span className="font-josefin font-bold text-[10px] text-white leading-none">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-[18px] hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Edit profil"
          >
            <div className="border-3 border-[#0c818a] rounded-full size-[60px] overflow-hidden bg-white/50 shrink-0">
              <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
            </div>
            <span className="text-[20px] font-semibold font-josefin text-black whitespace-nowrap">
              {displayName}
            </span>
          </button>
        </div>
      </header>

      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
