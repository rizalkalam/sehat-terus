"use client";

import React, { useState } from "react";
import { Search, Bell, AlertOctagon, AlertTriangle, CheckCircle, Clock, MapPin, Send, Check } from "lucide-react";

export default function EarlyWarningPage() {
  // Alert logs button send state
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({});
  
  // Mitigation task progress state
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Pantau kualitas udara dan edukasi masker di Bantul (Kasihan)",
      target: "Bantul",
      completed: false,
    },
    {
      id: 2,
      text: "Sosialisasikan Perilaku Hidup Bersih & Sehat (PHBS) air bersih di Kota Yogyakarta",
      target: "Kota Yogyakarta",
      completed: false,
    },
  ]);

  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleSendAlert = (id: string) => {
    setSentAlerts({ ...sentAlerts, [id]: true });
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="p-[40px] flex flex-col gap-[30px] h-full min-h-screen text-black select-none">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full">
        <div>
          <p className="text-[#0c818a] font-semibold text-[20px] font-josefin leading-normal">
            Selamat datang, Carmen
          </p>
          <h1 className="text-black font-normal text-[40px] font-josefin leading-none mt-1">
            Early Warning
          </h1>
        </div>

        <div className="flex items-center gap-[24px]">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-black/10 hover:bg-black/15 text-[12px] font-josefin text-white border border-transparent rounded-[16px] px-4 py-2 w-[195px] transition-all duration-300">
            <Search className="size-[18px] text-teal-brand" />
            <input
              type="text"
              placeholder="Cari wilayah lain"
              className="bg-transparent border-none outline-none placeholder-zinc-500 text-black w-full"
            />
          </div>

          {/* Notification */}
          <button className="text-teal-brand hover:scale-110 transition-transform duration-300 relative cursor-pointer">
            <Bell className="size-[24px]" />
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full animate-ping" />
          </button>

          {/* Profile Avatar */}
          <div className="flex items-center gap-[18px]">
            <div className="border-3 border-teal-brand rounded-full size-[60px] overflow-hidden bg-white/50 flex items-center justify-center">
              <div className="bg-gradient-to-tr from-teal-500 to-[#3f9cab] size-full flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
            </div>
            <span className="text-[20px] font-semibold font-josefin text-black">
              Carmenita
            </span>
          </div>
        </div>
      </header>

      {/* Critical Stock Alert Banner (Top) */}
      <section className="bg-rose-500/20 border border-rose-500/30 backdrop-blur-md rounded-[24px] p-6 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-500 text-white rounded-2xl shadow-md animate-bounce">
              <AlertOctagon className="size-6" />
            </span>
            <div className="flex gap-2">
              <span className="bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider font-montserrat">
                Critical Alert
              </span>
              <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider font-montserrat">
                Stockout Danger!
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-rose-950 font-bold text-[20px] font-josefin leading-normal">
            CRITICAL ALERT: Lonjakan 200% kasus Diare terdeteksi di Kecamatan Mlati
          </h2>
          <p className="text-rose-900/80 text-[14px] leading-relaxed max-w-4xl font-josefin font-medium">
            Stok <span className="font-bold text-rose-950 underline">Zinc/Oralit</span> diprediksi akan <span className="font-bold text-rose-950 underline">HABIS DALAM 48 JAM</span>. Segera lakukan restock darurat! Koordinasi Gudang Farmasi Kab. Sleman untuk pengiriman ekspres.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap pt-2">
          <div className="bg-rose-500/30 text-rose-950 text-xs font-bold rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock className="size-4" />
            <span>48 Jam Tersisa</span>
          </div>
          <div className="bg-rose-500/30 text-rose-950 text-xs font-bold rounded-lg px-3 py-2 flex items-center gap-2">
            <MapPin className="size-4" />
            <span>Kec. Mlati, Sleman</span>
          </div>
          <div className="bg-rose-500/30 text-rose-950 text-xs font-bold rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertOctagon className="size-4" />
            <span>Zinc & Oralit Hampir Habis</span>
          </div>
        </div>
      </section>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[30px] w-full">
        {/* Left Column (8 cols in lg - Feed Peringatan) */}
        <div className="lg:col-span-8 bg-[rgba(195,247,255,0.2)] border border-white/20 backdrop-blur-md rounded-[24px] p-6 shadow-lg flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-teal-brand text-[22px] font-josefin">
              Feed Peringatan Epidemiologi Aktif
            </h3>
            <p className="text-zinc-600 text-[13px] font-josefin leading-normal mt-1">
              Sistem otomatis mendeteksi ancaman penyebaran penyakit lokal berdasarkan laporan data
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {/* Card 1: High Risk */}
            <div className="bg-rose-100/70 border border-rose-200 rounded-[16px] p-5 flex justify-between items-center gap-4 hover:bg-rose-100/90 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-rose-500 text-white rounded-[12px] p-3 w-[75px] shadow-sm">
                  <AlertOctagon className="size-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">High Risk</span>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500 font-semibold font-josefin">
                    Sleman (Ngemplak) • 18 Juni 2026
                  </p>
                  <p className="text-rose-950 font-bold text-[15px] font-josefin mt-1">
                    Penyakit: Demam Berdarah Dengue (DBD)
                  </p>
                  <p className="text-zinc-700 text-[13px] font-josefin mt-1 leading-normal">
                    Terdeteksi kenaikan kasus DBD sebesar 25% dalam 2 minggu terakhir. Melebihi ambang batas normal wilayah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendAlert("dbd")}
                disabled={sentAlerts["dbd"]}
                className={`px-4 py-2 text-xs font-semibold rounded-[8px] flex items-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
                  sentAlerts["dbd"]
                    ? "bg-emerald-600 text-white"
                    : "bg-teal-brand text-white hover:bg-teal-brand-hover"
                }`}
              >
                <span>{sentAlerts["dbd"] ? "Peringatan Dikirim!" : "Kirim Peringatan"}</span>
                {sentAlerts["dbd"] ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
              </button>
            </div>

            {/* Card 2: Medium Risk */}
            <div className="bg-amber-100/70 border border-amber-200 rounded-[16px] p-5 flex justify-between items-center gap-4 hover:bg-amber-100/90 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-amber-400 text-amber-950 rounded-[12px] p-3 w-[84px] shadow-sm">
                  <AlertTriangle className="size-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Medium Risk</span>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500 font-semibold font-josefin">
                    Bantul (Kasihan) • 17 Juni 2026
                  </p>
                  <p className="text-amber-950 font-bold text-[15px] font-josefin mt-1">
                    Penyakit: Saluran Pernapasan (ISPA)
                  </p>
                  <p className="text-zinc-700 text-[13px] font-josefin mt-1 leading-normal">
                    Peningkatan tipis penderita ISPA terpantau seiring perubahan cuaca pancaroba.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendAlert("ispa")}
                disabled={sentAlerts["ispa"]}
                className={`px-4 py-2 text-xs font-semibold rounded-[8px] flex items-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
                  sentAlerts["ispa"]
                    ? "bg-emerald-600 text-white"
                    : "bg-teal-brand text-white hover:bg-teal-brand-hover"
                }`}
              >
                <span>{sentAlerts["ispa"] ? "Peringatan Dikirim!" : "Kirim Peringatan"}</span>
                {sentAlerts["ispa"] ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
              </button>
            </div>

            {/* Card 3: Normal Risk */}
            <div className="bg-emerald-100/70 border border-emerald-200 rounded-[16px] p-5 flex justify-between items-center gap-4 hover:bg-emerald-100/90 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-emerald-500 text-white rounded-[12px] p-3 w-[84px] shadow-sm">
                  <CheckCircle className="size-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Normal Risk</span>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500 font-semibold font-josefin">
                    Gunungkidul (Wonosari) • 16 Juni 2026
                  </p>
                  <p className="text-emerald-950 font-bold text-[15px] font-josefin mt-1">
                    Penyakit: Semua Kategori
                  </p>
                  <p className="text-zinc-700 text-[13px] font-josefin mt-1 leading-normal">
                    Seluruh indikator epidemiologi stabil dan berada dalam batas aman.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendAlert("normal")}
                disabled={sentAlerts["normal"]}
                className={`px-4 py-2 text-xs font-semibold rounded-[8px] flex items-center gap-2 cursor-pointer shadow-md transition-all duration-300 ${
                  sentAlerts["normal"]
                    ? "bg-emerald-600 text-white"
                    : "bg-teal-brand text-white hover:bg-teal-brand-hover"
                }`}
              >
                <span>{sentAlerts["normal"] ? "Peringatan Dikirim!" : "Kirim Peringatan"}</span>
                {sentAlerts["normal"] ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols in lg - Mitigasi & Progres) */}
        <div className="lg:col-span-4 flex flex-col gap-[30px] justify-between h-full">
          {/* Actions & Mitigation Card */}
          <div className="bg-[#e4eff1] border border-teal-500/10 rounded-[24px] p-6 shadow-lg flex-1 flex flex-col justify-between min-h-[480px]">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-teal-brand text-[20px] font-josefin">
                  Rekomendasi Tindakan Cepat
                </h3>
                <p className="text-zinc-600 text-[13px] font-josefin leading-normal mt-0.5">
                  Tindakan operasional lapangan yang disarankan
                </p>
              </div>

              {/* Action checklist list */}
              <div className="flex flex-col gap-3 pt-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-4 rounded-[12px] border transition-all duration-200 cursor-pointer flex gap-3 items-start select-none ${
                      task.completed
                        ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-500"
                        : "bg-white border-zinc-200 text-zinc-800 hover:border-teal-brand/30"
                    }`}
                  >
                    <button
                      className={`size-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 cursor-pointer ${
                        task.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-zinc-300 bg-white"
                      }`}
                    >
                      {task.completed && <Check className="size-3" strokeWidth={3} />}
                    </button>
                    <div>
                      <p className={`text-[13px] font-semibold leading-snug font-josefin ${task.completed ? "line-through" : ""}`}>
                        {task.text}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-semibold font-josefin mt-1">
                        Sasaran: {task.target}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mitigation Progress Card at bottom */}
            <div className="bg-white rounded-[16px] p-5 border border-teal-brand/5 shadow-inner mt-4">
              <h4 className="text-[12px] font-bold text-teal-brand uppercase tracking-wider font-montserrat">
                Progres Mitigasi
              </h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[14px] font-bold text-zinc-700 font-josefin">
                  {completedCount} dari {tasks.length} Selesai
                </span>
                <span className="text-[14px] font-bold text-teal-brand font-josefin">
                  {progressPercent}%
                </span>
              </div>
              {/* Progress bar background */}
              <div className="w-full h-2 bg-zinc-100 rounded-full mt-3 overflow-hidden">
                {/* Progress bar fill */}
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-[#3f9cab] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Card Greeting */}
          <div className="bg-[#0c818a] h-[59px] rounded-[14px] flex items-center justify-center text-white shadow-md">
            <p className="font-josefin text-[22px] whitespace-nowrap">
              <span className="font-normal">Salam </span>
              <span className="font-bold">Sehat</span>
              <span className="font-light opacity-80">Terus</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
