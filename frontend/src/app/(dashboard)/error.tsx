"use client";

import { useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-[41px] py-[29px] flex flex-col items-center justify-center min-h-[60vh] gap-[20px] text-center">
      <div
        className="size-[64px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(244,68,68,0.1)" }}
      >
        <AlertCircle className="size-[32px] text-[#F44444]" />
      </div>
      <div className="flex flex-col gap-[8px]">
        <h2 className="font-josefin font-bold text-[24px] text-black leading-none">
          Terjadi Kesalahan
        </h2>
        <p className="font-josefin text-[14px] text-black/60 leading-snug max-w-[320px]">
          Halaman tidak dapat dimuat. Periksa koneksi Anda dan coba lagi.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-[10px] font-josefin font-medium text-[16px] text-white px-[24px] py-[12px] rounded-[10px] hover:opacity-80 transition-opacity cursor-pointer"
        style={{ backgroundColor: "#0c818a" }}
      >
        <RefreshCw className="size-[16px]" />
        Coba Lagi
      </button>
    </div>
  );
}
