import React from "react";
import type { BattleBuff } from "../../state/battle/types";

type Props = {
  buffs: BattleBuff[];
  now: number;
};

export function BuffBar({ buffs, now }: Props) {
  if (!buffs || buffs.length === 0) return null;

  const totalsRef = React.useRef<Record<string, number>>({});

  // Фільтруємо бафи: показуємо тільки активні бафи та toggle скіли
  // Toggle скіли мають expiresAt === Number.MAX_SAFE_INTEGER і відображаються, якщо вони активні
  // Звичайні бафи відображаються, якщо вони не закінчилися
  const activeBuffs = buffs.filter((b) => {
    // Toggle скіли (expiresAt === Number.MAX_SAFE_INTEGER) - завжди показуємо, якщо вони є в списку
    if (b.expiresAt === Number.MAX_SAFE_INTEGER) {
      return true;
    }
    // Звичайні бафи - показуємо тільки якщо вони не закінчилися
    return b.expiresAt > now;
  });
  
  if (activeBuffs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-center gap-[2px]">
        {activeBuffs.map((b, idx) => {
          const icon = b.icon || "/skills/attack.jpg";
          const title = b.name || "buff";
          const isToggle = b.expiresAt === Number.MAX_SAFE_INTEGER;
          const key = `${b.id ?? idx}-${b.expiresAt}`;
          const remaining = isToggle ? 0 : Math.max(0, b.expiresAt - now);
          let total = totalsRef.current[key];

          if (!total || total <= 0) {
            if (b.durationMs && b.durationMs > 0) {
              total = b.durationMs;
            } else if (b.startedAt && b.expiresAt !== Number.MAX_SAFE_INTEGER) {
              total = Math.max(0, b.expiresAt - b.startedAt);
            } else {
              total = remaining;
            }
            totalsRef.current[key] = total;
          }

          const percent = !isToggle && total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
          const deg = Math.round(percent * 360);
          return (
            <div
              key={`buff-${b.id ?? idx}-${b.expiresAt}`}
              className="w-6 h-6 relative shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              title={title}
            >
              {!isToggle && (
                <div
                  className="absolute inset-0 rounded bg-transparent pointer-events-none"
                  style={{
                    background: `conic-gradient(#d94f4f ${deg}deg, rgba(217,79,79,0.12) ${deg}deg 360deg)`,
                  }}
                />
              )}
              <div className="absolute inset-[1px] rounded border border-white/30 bg-[#1a1a1a] overflow-hidden">
                <img src={icon} alt={title} className="w-full h-full object-cover" />
              </div>
              {b.stacks && b.stacks > 0 && (
                <div className="absolute bottom-[-2px] right-[-2px] px-1 py-[1px] rounded bg-black/75 text-[9px] leading-none text-[#ffdca8] border border-white/50">
                  {b.stacks}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-[1px] w-full bg-[#1a120c]" />
    </div>
  );
}
