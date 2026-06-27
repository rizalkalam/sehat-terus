import { Sparkles } from "lucide-react";

interface AiBannerProps {
  text?: string;
  updatedAt?: string;
}

export default function AiBanner({
  text = "3 obat kritis di Cab. Sleman. Stok Oralit & Amoksisilin diproyeksikan habis <3 hari, seiring tren ISPA & diare yang menanjak. Rekomendasi: amankan 140 unit sebelum 28 Jun.",
  updatedAt = "diperbarui 5 menit lalu",
}: AiBannerProps) {
  return (
    <div className="bg-white rounded-[12px] px-[20px] py-[16px] flex items-start gap-[16px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
      <div
        className="shrink-0 size-[37px] rounded-full flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgb(12,129,138) 0%, rgb(73,153,159) 100%)",
        }}
      >
        <Sparkles className="size-[18px] text-white" />
      </div>
      <div className="flex flex-col gap-[6px] min-w-0">
        <div className="flex items-center gap-[10px]">
          <span className="font-josefin font-bold text-[16px] text-[#0c818a] leading-none">
            Ringkasan AI
          </span>
          <span
            className="font-josefin text-[12px] text-white px-[8px] py-[3px] rounded-full leading-none"
            style={{ backgroundColor: "#0c818a" }}
          >
            {updatedAt}
          </span>
        </div>
        <p className="font-josefin text-[14px] text-black leading-snug">{text}</p>
      </div>
    </div>
  );
}
