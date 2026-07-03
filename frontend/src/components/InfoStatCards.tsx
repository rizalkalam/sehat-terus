export interface StatCardItem {
  label: string;
  value: string;
  badges: string[];
}

interface InfoStatCardsProps {
  items: StatCardItem[];
  /** false = always one static row, never wraps (e.g. Logistik's 4 cards by design). Default true (responsive grid). */
  wrap?: boolean;
}

export default function InfoStatCards({ items, wrap = true }: InfoStatCardsProps) {
  return (
    <div
      className={
        wrap
          ? "grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-[18px]"
          : "flex gap-[18px]"
      }
    >
      {items.map((card, i) => (
        <div
          key={i}
          className={`bg-white rounded-[12px] px-[22px] py-[20px] flex flex-col justify-between gap-[14px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)] min-w-0 min-h-[124px] ${wrap ? "" : "flex-1"}`}
        >
          <div className="flex flex-col gap-[6px] min-w-0">
            <span className="font-josefin text-[16px] text-black/60 leading-tight truncate">
              {card.label}
            </span>
            <span className="font-josefin font-bold text-[30px] text-black leading-none truncate">
              {card.value}
            </span>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {card.badges.map((b, j) => (
              <span
                key={j}
                className="font-josefin font-medium text-[12px] text-[#0c818a] leading-none px-[8px] py-[4px] rounded-[6px] bg-[#0c818a]/8"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
