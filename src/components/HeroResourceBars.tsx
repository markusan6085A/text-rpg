import React from "react";

/** Єдині градієнти HUD HP/MP/CP/EXP (як у профілі персонажа L2). */
export const HERO_BAR_FILLS = {
  hp: "linear-gradient(180deg,#d05050,#801c1c)",
  mp: "linear-gradient(180deg,#5c9fd8,#284a78)",
  cp: "linear-gradient(180deg,#e0bc68,#7a5a28)",
  exp: "linear-gradient(90deg,#5c4018,#c9a44c,#fce9a8)",
} as const;

export interface HeroResourceBarsProps {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  cp: number;
  maxCp: number;
  expCurrent?: number;
  expMax?: number;
  showExp?: boolean;
  /** Вужчі рядки для закріпленого HUD у куті */
  compact?: boolean;
  lowHpPulse?: boolean;
  className?: string;
}

function ResourceTrack({
  label,
  cur,
  max,
  fill,
  compact,
  pulse,
}: {
  label: string;
  cur: number;
  max: number;
  fill: string;
  compact?: boolean;
  pulse?: boolean;
}) {
  const cap = Math.max(1, Math.round(max));
  const v = Math.max(0, Math.round(cur));
  const p = Math.min(100, Math.round((v / cap) * 100));
  const h = compact ? "h-1.5" : "h-2";
  const labelCls = compact ? "text-[8px] w-[26px]" : "text-[9px] w-5";
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      <span className={`shrink-0 font-semibold text-[#b59a72] ${labelCls} tabular-nums`}>
        {label}
      </span>
      <div
        className={`${h} flex-1 min-w-0 rounded-[3px] bg-black/55 overflow-hidden border border-[#2a241c] shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)]`}
      >
        <div
          className={`h-full transition-[width] duration-300 ${pulse ? "animate-pulse" : ""}`}
          style={{ width: `${p}%`, background: fill }}
        />
      </div>
    </div>
  );
}

/**
 * Універсальні смуги HP / MP / CP (+ опційно EXP). Той самий вигляд усюди: City, GK, бій, арена, PK тощо
 * через StatusBars у Layout.
 */
export default function HeroResourceBars({
  hp,
  maxHp,
  mp,
  maxMp,
  cp,
  maxCp,
  expCurrent = 0,
  expMax = 1,
  showExp = false,
  compact = false,
  lowHpPulse = false,
  className = "",
}: HeroResourceBarsProps) {
  const expCap = Math.max(1, Math.round(expMax));
  return (
    <div className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"} ${className}`}>
      <ResourceTrack label="CP" cur={cp} max={maxCp} fill={HERO_BAR_FILLS.cp} compact={compact} />
      <ResourceTrack
        label="HP"
        cur={hp}
        max={maxHp}
        fill={HERO_BAR_FILLS.hp}
        compact={compact}
        pulse={lowHpPulse}
      />
      <ResourceTrack label="MP" cur={mp} max={maxMp} fill={HERO_BAR_FILLS.mp} compact={compact} />
      {showExp && (
        <ResourceTrack
          label="XP"
          cur={expCurrent}
          max={expCap}
          fill={HERO_BAR_FILLS.exp}
          compact={compact}
        />
      )}
    </div>
  );
}
