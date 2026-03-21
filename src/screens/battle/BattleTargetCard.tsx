import React from "react";

/** Універсальна картка цілі для будь-якого типу бою: моб, гравець (PK), олімпіада, ТВТ, арена */
export interface BattleTargetCardProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  compact?: boolean;
  /** Тепла рамка HP-бару як у L2-екранах */
  isL2?: boolean;
}

export function BattleTargetCard({
  name,
  level,
  currentHp,
  maxHp,
  compact = false,
  isL2 = false,
}: BattleTargetCardProps) {
  const max = Math.round(Math.max(1, maxHp));
  const clamped = Math.round(Math.max(0, Math.min(max, currentHp)));
  const hpPercent = max > 0 ? Math.max(0, Math.min(100, Math.round((clamped / max) * 100))) : 0;

  const nameStyle = isL2 ? { color: "#e8dcc8" } : { color: "#c7ad80" };
  const levelStyle = isL2 ? { color: "#9d8265" } : { color: "#c7ad80" };
  const nameClass = compact ? "text-[10px] font-semibold leading-tight" : "text-xs font-semibold leading-tight";
  const levelClass = compact ? "text-[9px]" : "text-[11px]";
  const barWidth = "w-[140px]";
  const barHeight = compact ? "h-[0.78rem]" : "h-[0.85rem]";
  const barTextSize = compact ? "text-[11px]" : "text-[11px]";

  return (
    <div className="flex flex-col items-start justify-center gap-1 text-left w-fit">
      <div className="flex items-baseline justify-start gap-2 w-full">
        <div className={nameClass} style={nameStyle}>{name}</div>
        <div className={levelClass} style={levelStyle}>Lv {level}</div>
      </div>
      <div className="flex flex-col items-start gap-[4px] text-[11px] text-[#252524] w-full">
        <div className={barWidth}>
          <div
            className={`${barHeight} rounded-[4px] overflow-hidden relative bg-[#14110c] border ${
              isL2 ? "border-[#5c4a32]/60 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]" : "border-white/40"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4b0b0b] via-[#7f1919] to-[#a12a2a]"
              style={{ width: `${hpPercent}%` }}
            />
            <div
              className={`absolute inset-0 flex items-center justify-center ${barTextSize} font-semibold text-[#ffecec]`}
            >
              {clamped} / {max}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
