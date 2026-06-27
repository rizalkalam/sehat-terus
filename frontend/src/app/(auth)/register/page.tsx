"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Activity } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/lib/auth.client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = registerUser({
      email: form.email,
      password: form.password,
      name: form.name.trim() || form.displayName.trim(),
      displayName: form.displayName.trim(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Pendaftaran gagal.");
      return;
    }

    router.push("/login?registered=1");
  };

  return (
    <div
      className="w-full max-w-[900px] rounded-[28px] overflow-hidden shadow-[0px_16px_60px_0px_rgba(0,0,0,0.18)] flex"
      style={{ minHeight: 560 }}
    >
      {/* Left: Brand panel */}
      <div
        className="flex flex-col items-center justify-center gap-[24px] p-[52px] flex-1 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(147deg, #0C818A 0%, #2A9DA6 40%, #49999F 80%, #6EC4CC 100%)",
        }}
      >
        <div className="absolute top-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-40px] w-[300px] h-[300px] rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center gap-[14px] z-10">
          <div className="size-[56px] rounded-[14px] bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
            <Activity className="size-[30px] text-white" />
          </div>
          <div>
            <p className="font-josefin font-bold text-white text-[28px] leading-none">
              Sehat Terus
            </p>
            <p className="font-josefin text-white/70 text-[14px] leading-none mt-1">
              Sistem Epidemiologi
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-[10px] z-10 text-center max-w-[260px]">
          <p className="font-josefin font-medium text-white text-[16px] leading-snug">
            Bergabung dengan SehatTerus
          </p>
          <p className="font-josefin text-white/60 text-[13px] leading-relaxed">
            Buat akun untuk mengakses dashboard epidemiologi dan sistem peringatan dini Sleman.
          </p>
        </div>
      </div>

      {/* Right: Register form */}
      <div className="bg-white flex flex-col justify-center p-[52px] w-[420px] shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-[8px] mb-[28px]">
          <h1 className="font-josefin font-bold text-[32px] text-black leading-none">
            Daftar
          </h1>
          <p className="font-josefin text-[14px] text-black/50 leading-none">
            Buat akun baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
          {/* Display name */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="displayName"
              className="font-josefin font-medium text-[14px] text-black leading-none"
            >
              Nama Lengkap
            </label>
            <input
              id="displayName"
              type="text"
              value={form.displayName}
              onChange={set("displayName")}
              placeholder="cth: Nyoman Ayu Carmenita"
              required
              autoComplete="name"
              className="h-[44px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
            />
          </div>

          {/* Greeting name */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="name"
              className="font-josefin font-medium text-[14px] text-black leading-none"
            >
              Nama Panggilan
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="cth: Carmen"
              required
              autoComplete="nickname"
              className="h-[44px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="email"
              className="font-josefin font-medium text-[14px] text-black leading-none"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="h-[44px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="password"
              className="font-josefin font-medium text-[14px] text-black leading-none"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="min. 6 karakter"
                required
                autoComplete="new-password"
                className="h-[44px] w-full rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] pr-[42px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 text-black/40 hover:text-[#0c818a] transition-colors cursor-pointer"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" />
                ) : (
                  <Eye className="size-[18px]" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="confirmPassword"
              className="font-josefin font-medium text-[14px] text-black leading-none"
            >
              Konfirmasi Kata Sandi
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="ulangi kata sandi"
              required
              autoComplete="new-password"
              className="h-[44px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="font-josefin text-[13px] text-[#F44444] leading-none -mt-[4px]">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-[4px] h-[48px] rounded-[10px] font-josefin font-semibold text-[17px] text-white transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: "#0c818a" }}
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        <p className="mt-[24px] font-josefin text-[14px] text-black/50 text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#0c818a] font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
