import React from "react";
import type { BattleBuff } from "../../state/battle/types";
import { getSkillDef, getSkillDefForBattle } from "../../state/battle/loadout";
import { useHeroStore } from "../../state/heroStore";
import { getCityUiVariant } from "../../utils/cityUiVariant";

type Props = {
  buffs: BattleBuff[];
  now: number;
};

export function BuffBar({ buffs, now }: Props) {
  const isL2 = getCityUiVariant() === "l2";
  const hero = useHeroStore((s) => s.hero);
  // 🔥 useRef має бути ДО будь-якого return — інакше при вимиканні останнього бафа/toggle (buffs → [])
  // змінюється кількість хуків → React падає, чорний екран до F5.
  const totalsRef = React.useRef<Record<string, number>>({});

  if (!Array.isArray(buffs) || buffs.length === 0) return null;

  // Фільтруємо бафи: показуємо тільки активні бафи та toggle скіли
  // Toggle скіли мають expiresAt === Number.MAX_SAFE_INTEGER і відображаються, якщо вони активні
  // Звичайні бафи відображаються, якщо вони не закінчилися
  const activeBuffs = buffs.filter((b) => {
    if (!b || typeof b !== "object") return false;
    const exp = Number(b.expiresAt);
    if (exp === Number.MAX_SAFE_INTEGER) return true;
    return exp > now;
  });
  
  if (activeBuffs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-center gap-[2px]">
        {activeBuffs.map((b, idx) => {
          const rawIcon = typeof b.icon === "string" ? b.icon.trim() : "";
          const sid = b.id;
          const def =
            hero && typeof sid === "number"
              ? getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, sid) ?? getSkillDef(sid)
              : undefined;
          const icon = rawIcon.length > 0 ? rawIcon : def?.icon || "/skills/attack.jpg";
          const title = b.name || "buff";
          const expN = Number(b.expiresAt);
          const isToggle = expN === Number.MAX_SAFE_INTEGER;
          const key = `${b.id ?? idx}-${expN}`;
          const remaining = isToggle ? 0 : Math.max(0, expN - now);
          let total = totalsRef.current[key];

          if (!total || total <= 0) {
            if (b.durationMs && b.durationMs > 0) {
              total = b.durationMs;
            } else if (b.startedAt && expN !== Number.MAX_SAFE_INTEGER) {
              total = Math.max(0, expN - Number(b.startedAt));
            } else {
              total = remaining;
            }
            totalsRef.current[key] = total;
          }

          const percent = !isToggle && total > 0 && Number.isFinite(remaining) && Number.isFinite(total)
            ? Math.min(1, Math.max(0, remaining / total))
            : 0;
          const deg = Number.isFinite(percent) ? Math.round(percent * 360) : 0;
          return (
            <div
              key={`buff-${b.id ?? idx}-${expN}`}
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
              <div
                className={
                  isL2
                    ? "absolute inset-[1px] rounded border border-[#5c4a32]/60 bg-[#14110c] overflow-hidden shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
                    : "absolute inset-[1px] rounded border border-white/30 bg-[#1a1a1a] overflow-hidden"
                }
              >
                <img src={icon} alt={title} className="w-full h-full object-cover" />
              </div>
              {b.stacks && b.stacks > 0 && (
                <div
                  className={
                    isL2
                      ? "absolute bottom-[-2px] right-[-2px] px-1 py-[1px] rounded bg-black/75 text-[9px] leading-none text-[#ffdca8] border border-[#5c4a32]/65"
                      : "absolute bottom-[-2px] right-[-2px] px-1 py-[1px] rounded bg-black/75 text-[9px] leading-none text-[#ffdca8] border border-white/50"
                  }
                >
                  {b.stacks}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className={isL2 ? "h-[1px] w-full bg-[#5c4a32]/35" : "h-[1px] w-full bg-[#1a120c]"} />
    </div>
  );
}
