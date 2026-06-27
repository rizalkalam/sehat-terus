export interface StatCardItem {
  label: string;
  value: string;
  badges: string[];
}

export default function InfoStatCards({ items }: { items: StatCardItem[] }) {
  return (
    <div className="flex gap-[18px]">
      {items.map((card, i) => (
        <div
          key={i}
          className="flex-1 bg-white rounded-[12px] p-[22px] flex flex-col gap-[8px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)] min-w-0"
        >
          <span className="font-josefin text-[20px] text-black leading-tight">
            {card.label}
          </span>
          <span className="font-josefin font-bold text-[34px] text-black leading-none">
            {card.value}
          </span>
          <div className="flex flex-wrap gap-[6px] mt-[2px]">
            {card.badges.map((b, j) => (
              <span key={j} className="font-josefin text-[16px] text-black leading-none">
                {b}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
