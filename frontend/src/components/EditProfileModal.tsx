"use client";

import { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, login } = useAuth();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setDisplayName(user.displayName);
    }
  }, [open, user]);

  if (!open) return null;

  const avatarSrc = user?.avatarSrc ?? DEFAULT_AVATAR;
  const canSave = name.trim().length > 0 && displayName.trim().length > 0;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    login({ ...user, name: name.trim(), displayName: displayName.trim() });
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-[36px] flex flex-col gap-[24px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)] w-full max-w-[440px] mx-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-josefin font-bold text-[22px] text-black leading-none">
            Edit Profil
          </h2>
          <button
            onClick={onClose}
            className="size-[32px] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="size-[18px] text-black/60" />
          </button>
        </div>

        <div className="flex items-center gap-[20px]">
          <div className="relative shrink-0">
            <div className="size-[80px] rounded-full overflow-hidden border-[3px] border-[#0c818a]">
              <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
            </div>
            <button
              title="Ganti foto (fitur mendatang)"
              className="absolute bottom-0 right-0 size-[28px] rounded-full bg-[#0c818a] flex items-center justify-center border-2 border-white hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Camera className="size-[13px] text-white" strokeWidth={2} />
            </button>
          </div>
          <div className="flex flex-col gap-[4px]">
            <span className="font-josefin font-semibold text-[18px] text-black leading-none">
              {displayName || "—"}
            </span>
            <span className="font-josefin text-[13px] text-black/40 leading-none">
              {user?.email ?? ""}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col gap-[6px]">
            <label className="font-josefin font-medium text-[14px] text-black leading-none">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="cth: Nyoman Ayu Carmenita"
              className="h-[42px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[12px] font-josefin text-[15px] text-black outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all placeholder-black/30"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-josefin font-medium text-[14px] text-black leading-none">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Carmen"
              className="h-[42px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[12px] font-josefin text-[15px] text-black outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all placeholder-black/30"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-josefin font-medium text-[14px] text-black leading-none">
              Email
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="h-[42px] rounded-[8px] border border-gray-200 bg-gray-50 px-[12px] font-josefin text-[15px] text-black/40 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex gap-[12px] justify-end">
          <button
            onClick={onClose}
            className="font-josefin font-medium text-[16px] text-[#0c818a] px-[20px] py-[10px] rounded-[8px] border border-[#0c818a] hover:bg-[#0c818a]/5 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="font-josefin font-medium text-[16px] text-white px-[20px] py-[10px] rounded-[8px] hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "#0c818a" }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
