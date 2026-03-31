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
  /** Показати темно-червоний суфікс (агр) після імені */
  isAggressivePatrol?: boolean;
}

export function BattleTargetCard({
  name,
  level,
  currentHp,
  maxHp,
  compact = false,
  isL2 = false,
  isAggressivePatrol = false,
}: BattleTargetCardProps) {
  const maxRaw = Number.isFinite(maxHp) ? maxHp : 1;
  const curRaw = Number.isFinite(currentHp) ? currentHp : 0;
  const max = Math.round(Math.max(1, maxRaw));
  const clamped = Math.round(Math.max(0, Math.min(max, curRaw)));
  const hpPercent = max > 0 ? Math.max(0, Math.min(100, Math.round((clamped / max) * 100))) : 0;

  const nameStyle = isL2 ? { color: "#e8dcc8" } : { color: "#c7ad80" };
  const levelStyle = isL2 ? { color: "#9d8265" } : { color: "#c7ad80" };
  const nameClass = compact ? "text-[10px] font-semibold leading-tight" : "text-xs font-semibold leading-tight";
  const levelClass = compact ? "text-[9px]" : "text-[11px]";
  const barHeight = compact ? "h-[1.05rem]" : "h-[1.15rem]";
  const barTextSize = compact ? "text-[10px]" : "text-[11px]";

  const barShell = isL2
    ? "rounded-md overflow-hidden relative bg-[#0a0806] border border-[#6b5a3e]/75 shadow-[inset_0_2px_6px_rgba(0,0,0,0.65),inset_0_-1px_0_rgba(199,173,128,0.12),0_0_0_1px_rgba(0,0,0,0.4)]"
    : "rounded-md overflow-hidden relative bg-[#14110c] border border-white/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]";

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-center w-full max-w-[260px] mx-auto">
      <div className="flex flex-col items-center gap-0.5 w-full px-1">
        <div className={nameClass} style={nameStyle}>
          {name}
          {isAggressivePatrol ? (
            <span className="text-[#5c0a0a]"> (агр)</span>
          ) : null}
        </div>
        <div className={levelClass} style={levelStyle}>
          Lv {level}
        </div>
      </div>
      <div className="w-full max-w-[240px] px-0.5">
        <div className={`${barHeight} ${barShell}`}>
          <div
            className={`absolute left-0 top-0 bottom-0 z-0 rounded-[5px] overflow-hidden ${
              isL2
                ? "bg-gradient-to-b from-[#2a1212] via-[#1a0a0a] to-[#0d0606]"
                : "bg-[#1a0a0a]"
            }`}
            aria-hidden
          />
          <div
            className="absolute left-0 top-0 bottom-0 z-[1] rounded-[4px] overflow-hidden transition-[width] duration-200 ease-out"
            style={{
              width: `${hpPercent}%`,
              background: isL2
                ? "linear-gradient(180deg, #c43c3c 0%, #8f1c1c 45%, #5c1010 100%)"
                : "linear-gradient(90deg, #4b0b0b, #7f1919 50%, #a12a2a)",
              boxShadow: isL2
                ? "inset 0 1px 0 rgba(255,200,180,0.35), inset 0 -2px 6px rgba(0,0,0,0.45)"
                : undefined,
            }}
          />
          <div
            className={`absolute inset-0 z-[2] flex items-center justify-center ${barTextSize} font-semibold tabular-nums tracking-tight ${
              isL2 ? "text-[#fff5f0]" : "text-[#ffecec]"
            }`}
            style={{
              textShadow: "0 0 4px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9)",
            }}
          >
            {clamped} / {max}
          </div>
        </div>
      </div>
    </div>
  );
}
