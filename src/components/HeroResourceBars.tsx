import React from "react";

/** Єдині градієнти HUD HP/MP/CP/EXP (як у профілі персонажа L2). */
export const HERO_BAR_FILLS = {
  hp: "linear-gradient(180deg,#d05050,#801c1c)",
  mp: "linear-gradient(180deg,#5c9fd8,#284a78)",
  cp: "linear-gradient(180deg,#e0bc68,#7a5a28)",
  exp: "linear-gradient(90deg,#5c1919,#c9a44c,#fce9a8)",
  /** Смуга EXP у стрічці під ніком (як CP/HP/MP, але нейтрально-сіра заливка). */
  expGray: "linear-gradient(180deg,#c4c4c4,#6b6b6b)",
} as const;

/** Холодна палітра для теми «Тест» (профіль). */
export const HERO_BAR_FILLS_PROFILE_TEST = {
  cp: "linear-gradient(180deg,#5eead4,#0f766e)",
  hp: "linear-gradient(180deg,#fb7185,#9f1239)",
  mp: "linear-gradient(180deg,#93c5fd,#1d4ed8)",
  exp: "linear-gradient(90deg,#a78bfa,#6366f1,#c4b5fd)",
  expGray: "linear-gradient(180deg,#94a3b8,#475569)",
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
  /** Сірий EXP-бар (теплий HUD у куті лишається золотим). */
  expGray?: boolean;
  /** Вужчі рядки для закріпленого HUD у куті */
  compact?: boolean;
  /** Легкий «глянець» і зовнішнє світіння заливки (L2-профіль). */
  premiumShine?: boolean;
  /** Тема «Тест» — бірюзово-індіго смуги (інша палітра). */
  profileTest?: boolean;
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
  premiumShine,
  thin,
  profileTest,
}: {
  label: string;
  cur: number;
  max: number;
  fill: string;
  compact?: boolean;
  pulse?: boolean;
  premiumShine?: boolean;
  thin?: boolean;
  profileTest?: boolean;
}) {
  const cap = Math.max(1, Math.round(max));
  const v = Math.max(0, Math.round(cur));
  const p = Math.min(100, Math.round((v / cap) * 100));
  const h = thin ? "h-1" : compact ? "h-1.5" : premiumShine || profileTest ? "h-2.5" : "h-2";
  const labelCls = compact ? "text-[8px] w-[26px]" : "text-[9px] w-5";
  const trackRing = profileTest
    ? "border-cyan-500/45 shadow-[inset_0_1px_3px_rgba(0,0,0,0.75),0_0_14px_rgba(34,211,238,0.18)]"
    : premiumShine
      ? "border-[#6b5344]/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.75),0_0_10px_rgba(212,175,55,0.12)]"
      : "border-[#2a241c] shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)]";
  const fillExtra = profileTest
    ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_10px_rgba(34,211,238,0.35)]"
    : premiumShine
      ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_8px_rgba(255,200,120,0.25)]"
      : "";
  const labelColor = profileTest ? "text-cyan-100/90" : "text-[#b59a72]";
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      <span className={`shrink-0 font-semibold ${labelColor} ${labelCls} tabular-nums`}>
        {label}
      </span>
      <div
        className={`${h} flex-1 min-w-0 rounded-[3px] bg-black/55 overflow-hidden border ${trackRing}`}
      >
        <div
          className={`h-full transition-[width] duration-300 ${pulse ? "animate-pulse" : ""} ${fillExtra}`}
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
  expGray = false,
  compact = false,
  premiumShine = false,
  profileTest = false,
  lowHpPulse = false,
  className = "",
}: HeroResourceBarsProps) {
  const expCap = Math.max(1, Math.round(expMax));
  const F = profileTest ? HERO_BAR_FILLS_PROFILE_TEST : HERO_BAR_FILLS;
  const gapCls =
    compact && !premiumShine && !profileTest
      ? "gap-0.5"
      : premiumShine || profileTest
        ? "gap-1.5"
        : "gap-1";
  const expCompact = compact && !premiumShine && !profileTest;
  const expThin = !!(premiumShine || profileTest);
  return (
    <div className={`flex flex-col ${gapCls} ${className}`}>
      <ResourceTrack
        label="CP"
        cur={cp}
        max={maxCp}
        fill={F.cp}
        compact={compact}
        premiumShine={premiumShine && !profileTest}
        profileTest={profileTest}
      />
      <ResourceTrack
        label="HP"
        cur={hp}
        max={maxHp}
        fill={F.hp}
        compact={compact}
        pulse={lowHpPulse}
        premiumShine={premiumShine && !profileTest}
        profileTest={profileTest}
      />
      <ResourceTrack
        label="MP"
        cur={mp}
        max={maxMp}
        fill={F.mp}
        compact={compact}
        premiumShine={premiumShine && !profileTest}
        profileTest={profileTest}
      />
      {showExp && (
        <ResourceTrack
          label="EXP"
          cur={expCurrent}
          max={expCap}
          fill={expGray ? F.expGray : F.exp}
          compact={expCompact}
          premiumShine={premiumShine && !profileTest}
          profileTest={profileTest}
          thin={expThin}
        />
      )}
    </div>
  );
}
