"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[20px] p-[36px] flex flex-col gap-[20px] shadow-[0px_8px_40px_0px_rgba(0,0,0,0.2)] max-w-[420px] w-full mx-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-[8px]">
          <h2 className="font-josefin font-bold text-[22px] text-black leading-tight">
            {title}
          </h2>
          <p className="font-josefin text-[14px] text-black/70 leading-snug">
            {description}
          </p>
        </div>
        <div className="flex gap-[12px] justify-end">
          <button
            onClick={onCancel}
            className="font-josefin font-medium text-[16px] text-[#0c818a] px-[20px] py-[10px] rounded-[8px] border border-[#0c818a] hover:bg-[#0c818a]/5 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="font-josefin font-medium text-[16px] text-white px-[20px] py-[10px] rounded-[8px] hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#0c818a" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
