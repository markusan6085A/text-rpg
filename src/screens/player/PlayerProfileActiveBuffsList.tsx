import React from "react";
import type { Character } from "../../utils/api";
import { cleanupBuffs } from "../../state/battle/helpers";
import { getMergedHeroJsonFromCharacter, prepareBuffsForStatsView } from "./playerProfileUtils";

/** Активні бафи з heroJson.heroBuffs або character.heroBuffs; `now` для expiresAt. */
export function PlayerProfileActiveBuffsList(props: {
  isL2: boolean;
  character: Character;
  now: number;
}) {
  const { isL2, character, now } = props;
  const mergedHj = getMergedHeroJsonFromCharacter(character);
  const hjBuffs = mergedHj.heroBuffs;
  const rawBuffs = Array.isArray(hjBuffs)
    ? hjBuffs
    : Array.isArray((character as any).heroBuffs)
      ? (character as any).heroBuffs
      : [];
  const allBuffs = cleanupBuffs(prepareBuffsForStatsView(rawBuffs), now);

  const getExpiresAt = (b: any): number => {
    const v = b.expiresAt;
    if (v == null) return Number.MAX_SAFE_INTEGER;
    if (typeof v === "number") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
  };

  const activeBuffs = allBuffs.filter((b: any) => {
    const exp = getExpiresAt(b);
    if (exp >= Number.MAX_SAFE_INTEGER - 1) return true;
    return exp > now;
  });

  return (
    <div
      className={
        isL2
          ? "mb-4 border-t border-solid border-[#5c4a32]/45 pt-3"
          : "mb-4 border-t border-solid border-white/50 pt-3"
      }
    >
      <div
        className={
          isL2
            ? "text-[#e8c56e] text-sm font-semibold mb-2 border-b border-solid border-[#5c4a32]/45 pb-1"
            : "text-[#dec28e] text-sm font-semibold mb-2 border-b border-solid border-white/50 pb-1"
        }
      >
        Активні бафи {activeBuffs.length > 0 && `(${activeBuffs.length})`}
      </div>
      {activeBuffs.length === 0 && allBuffs.length > 0 && (
        <div className="text-xs text-gray-500 py-2">Всі бафи закінчились</div>
      )}
      {activeBuffs.length === 0 && allBuffs.length === 0 && (
        <div className="text-xs text-gray-500 py-2">Немає активних бафів</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {activeBuffs.map((buff: any, idx: number) => {
          const iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
          return (
            <img
              key={idx}
              src={iconSrc}
              alt={buff.name || "Buff"}
              className="w-5 h-5 object-contain"
              title={buff.name || "Buff"}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
