"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Activity, CheckCircle } from "lucide-react";
import Link from "next/link";
import { loginWithApi } from "@/lib/auth.client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") setJustRegistered(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginWithApi(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Cookie st_auth & st_user sudah disetel oleh backend via Set-Cookie.
    const from = new URLSearchParams(window.location.search).get("from") || "/";
    router.replace(from);
  };

  return (
    <div
      className="w-full max-w-[900px] rounded-[28px] overflow-hidden shadow-[0px_16px_60px_0px_rgba(0,0,0,0.18)] flex"
      style={{ minHeight: 520 }}
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
            Radar Kesehatan Publik D.I. Yogyakarta
          </p>
          <p className="font-josefin text-white/60 text-[13px] leading-relaxed">
            Pantau tren penyakit, stok obat, dan peringatan dini wilayah Sleman secara real-time.
          </p>
        </div>

        {/* Demo credentials hint */}
        <div
          className="z-10 rounded-[12px] px-[16px] py-[12px] flex flex-col gap-[4px] text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <p className="font-josefin font-bold text-white/90 text-[12px] leading-none mb-[4px]">
            Akun Demo
          </p>
          <p className="font-josefin text-white/70 text-[12px] leading-snug">
            carmen@sehatterus.id
          </p>
          <p className="font-josefin text-white/70 text-[12px] leading-snug">
            sehat123
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="bg-white flex flex-col justify-center p-[52px] w-[420px] shrink-0">
        <div className="flex flex-col gap-[8px] mb-[36px]">
          <h1 className="font-josefin font-bold text-[32px] text-black leading-none">
            Masuk
          </h1>
          <p className="font-josefin text-[14px] text-black/50 leading-none">
            Masukkan kredensial akun Anda
          </p>
        </div>

        {/* Success banner after register */}
        {justRegistered && (
          <div
            className="flex items-center gap-[10px] rounded-[8px] px-[14px] py-[10px] mb-[20px]"
            style={{ backgroundColor: "rgba(31,146,84,0.1)", border: "1px solid rgba(31,146,84,0.3)" }}
          >
            <CheckCircle className="size-[16px] text-[#1f9254] shrink-0" />
            <p className="font-josefin text-[13px] text-[#1f9254] leading-snug">
              Akun berhasil dibuat. Silakan masuk.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="h-[44px] rounded-[8px] border border-[#0c818a]/30 bg-[#f8fdfd] px-[14px] font-josefin text-[15px] text-black placeholder-black/30 outline-none focus:border-[#0c818a] focus:ring-2 focus:ring-[#0c818a]/15 transition-all"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-josefin font-medium text-[14px] text-black leading-none"
              >
                Kata Sandi
              </label>
              <button
                type="button"
                className="font-josefin text-[13px] text-[#0c818a] hover:underline cursor-pointer leading-none"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          {/* Error */}
          {error && (
            <p className="font-josefin text-[13px] text-[#F44444] leading-none -mt-[6px]">
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
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-[28px] font-josefin text-[14px] text-black/50 text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#0c818a] font-medium hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
