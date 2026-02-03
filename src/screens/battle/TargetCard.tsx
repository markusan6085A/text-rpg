import React from "react";
import type { City, Zone, Mob } from "../../data/world/types";
import { useBattleStore } from "../../state/battle/store";

interface TargetCardProps {
  zone: Zone;
  city: City;
  mob: Mob;
  compact?: boolean;
}

export function TargetCard({ zone, city, mob, compact = false }: TargetCardProps) {
  const { mobHP } = useBattleStore();
  const maxHP = typeof mob.hp === "number" ? mob.hp : 0;
  const hpValue = Number.isFinite(mobHP) ? mobHP : maxHP;
  const clampedHP = Math.max(0, Math.min(maxHP, hpValue));
  const hpPercent = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((clampedHP / maxHP) * 100))) : 0;

  const nameStyle = { color: "#c7ad80" };
  const nameClass = compact
    ? "text-[10px] font-semibold leading-tight"
    : "text-xs font-semibold leading-tight";
  const levelClass = compact ? "text-[9px]" : "text-[11px]";
  const barWidth = "w-[140px]";
  const barHeight = compact ? "h-[0.78rem]" : "h-[0.85rem]";
  const barTextSize = compact ? "text-[11px]" : "text-[11px]";

  return (
    <div
      className={
        compact
          ? "flex flex-col items-start justify-center gap-1 text-left w-fit"
          : "flex flex-col items-start justify-center gap-1 text-left w-fit"
      }
    >
      <div className="flex items-baseline justify-start gap-2 w-full">
        <div className={nameClass} style={nameStyle}>{mob.name}</div>
        <div className={levelClass} style={nameStyle}>Lv {mob.level}</div>
      </div>
      <div className="flex flex-col items-start gap-[4px] text-[11px] text-[#252524] w-full">
        <div className={`${barWidth}`}>
          <div
            className={`${barHeight} rounded-[4px] overflow-hidden relative bg-[#14110c] border border-[#3b2614]`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4b0b0b] via-[#7f1919] to-[#a12a2a]"
              style={{ width: `${hpPercent}%` }}
            />
            <div
              className={`absolute inset-0 flex items-center justify-center ${barTextSize} font-semibold text-[#ffecec]`}
            >
              {clampedHP} / {mob.hp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
