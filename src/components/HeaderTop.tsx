export default function HeaderTop({
  name,
  level,
  hp,
  mp,
  gold,
  expPct,
  location,
}: {
  name: string;
  level: number;
  hp: [number, number];
  mp: [number, number];
  gold: number;
  expPct: number;
  location?: string;
}) {
  return (
    <div className="rounded-2xl border border-yellow-900/40 bg-[#1b1b1b] text-[#f6e5b3] p-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="font-bold">{name || "Герой"}</div>
        <div className="text-xs opacity-90">{level} ур.</div>
      </div>
      <div className="text-[11px] flex gap-3 mt-1 opacity-90">
        <div>HP {hp[0]}/{hp[1]}</div>
        <div>MP {mp[0]}/{mp[1]}</div>
        <div>💰 {gold}</div>
        <div>{expPct}%</div>
      </div>
      {location && (
        <div className="mt-2 font-semibold text-[14px]">🏰 {location}</div>
      )}
    </div>
  );
}
