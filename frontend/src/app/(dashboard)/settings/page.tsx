"use client";

import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { putJson } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Faskes {
  nama: string;
  tipe: string;
  alamat: string | null;
}

interface Profile {
  nama: string;
  email: string;
  peran: string;
  nomor_sipa: string | null;
  telepon: string | null;
  alamat: string | null;
  faskes: Faskes | null;
}

interface FormData {
  nama: string;
  telepon: string;
  alamat: string;
}

function FieldGroup({
  label,
  id,
  value,
  onChange,
  type = "text",
  readOnly = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={id}
        className="font-josefin font-medium text-[15px] text-black leading-none"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`h-[40px] rounded-[5px] border px-[12px] font-josefin font-semibold text-[16px] outline-none transition-all ${
          readOnly
            ? "border-[#d9d9d9] bg-[#f5f5f5] text-black/60 cursor-not-allowed"
            : "border-[#0c818a] bg-white text-black focus:ring-2 focus:ring-[#0c818a]/30"
        }`}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormData>({ nama: "", telepon: "", alamat: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          setProfile(u);
          setForm({
            nama: u.nama ?? "",
            telepon: u.telepon ?? "",
            alamat: u.alamat ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key: keyof FormData) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    const result = await putJson("/api/pengguna/profile", {
      nama: form.nama,
      telepon: form.telepon || null,
      alamat: form.alamat || null,
    });
    setSaving(false);
    if (!result.ok) {
      alert(result.error || "Gagal menyimpan perubahan.");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, nama: form.nama, telepon: form.telepon, alamat: form.alamat } : prev));
    alert("Perubahan disimpan!");
  };

  if (loading) {
    return (
      <div className="px-[41px] py-[29px] w-full max-w-[1163px] mx-auto text-black">
        <PageHeader title="Settings" />
        <p className="font-josefin text-[16px] text-black/60 mt-[20px]">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto text-black select-none z-10 relative">
      <PageHeader title="Settings" />

      {/* ─── Profile Card ─── */}
      <div className="bg-white rounded-[16px] p-[40px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.08)]">
        <div className="flex gap-[56px] items-start">
          {/* Avatar column */}
          <div className="flex flex-col items-center gap-[12px] shrink-0">
            <div className="relative">
              <div className="size-[156px] rounded-full border-[3px] border-[#0c818a] overflow-hidden bg-white/50">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Avatar"
                  className="size-full object-cover"
                />
              </div>
              <button
                className="absolute bottom-0 right-0 size-[44px] rounded-full bg-[#0c818a] border-[3px] border-[#0c818a] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                aria-label="Ganti foto"
                title="Belum tersedia"
              >
                <Camera className="size-[18px] text-white" strokeWidth={1.6} />
              </button>
            </div>
            <span className="font-josefin font-semibold text-[30px] text-black leading-none">
              {form.nama || "-"}
            </span>
            <span className="font-josefin font-medium text-[14px] text-black/50 capitalize leading-none">
              {profile?.peran}
            </span>
          </div>

          {/* Form column */}
          <div className="flex flex-col gap-[20px] flex-1 min-w-0">
            <div className="self-start">
              <span
                className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
                style={{ backgroundColor: "#0c818a" }}
              >
                Profile
              </span>
            </div>

            <div className="grid grid-cols-2 gap-[14px]">
              <FieldGroup label="Nama" id="nama" value={form.nama} onChange={set("nama")} />
              <FieldGroup label="Email" id="email" value={profile?.email ?? ""} readOnly />
            </div>
            {profile?.nomor_sipa && (
              <div className="grid grid-cols-2 gap-[14px]">
                <FieldGroup label="Nomor SIPA" id="nomor_sipa" value={profile.nomor_sipa} readOnly />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Contact & Faskes Card ─── */}
      <div className="bg-white rounded-[16px] p-[40px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.08)] flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[14px]">
          <div className="self-start">
            <span
              className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
              style={{ backgroundColor: "#0c818a" }}
            >
              Contact
            </span>
          </div>
          <div className="grid grid-cols-2 gap-[14px]">
            <FieldGroup
              label="Nomor Telepon"
              id="phone"
              value={form.telepon}
              onChange={set("telepon")}
              type="tel"
            />
            <FieldGroup label="Alamat" id="alamat" value={form.alamat} onChange={set("alamat")} />
          </div>
        </div>

        {profile?.faskes && (
          <div className="flex flex-col gap-[14px]">
            <div className="self-start">
              <span
                className="font-josefin font-bold text-[18px] text-white px-[22px] py-[8px] rounded-[5px] leading-none"
                style={{ backgroundColor: "#0c818a" }}
              >
                Fasilitas Kesehatan
              </span>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <FieldGroup label="Nama Faskes" id="faskes_nama" value={profile.faskes.nama} readOnly />
              <FieldGroup label="Tipe" id="faskes_tipe" value={profile.faskes.tipe} readOnly />
            </div>
            {profile.faskes.alamat && (
              <FieldGroup label="Alamat Faskes" id="faskes_alamat" value={profile.faskes.alamat} readOnly />
            )}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            disabled={saving}
            className="font-josefin font-medium text-[18px] text-white rounded-[8px] px-[14px] py-[10px] hover:opacity-80 transition-opacity cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0c818a" }}
            onClick={handleSave}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
