import { getCityUiVariant } from "../../utils/cityUiVariant";
import type { Character } from "../../utils/api";

export function arenaOuterFrame(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2
    ? "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
    : "w-full rounded-lg border border-amber-900/40 bg-black/40";
}

export function arenaPanel(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2
    ? "rounded-lg border border-[#5c4a32]/55 bg-black/30 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "rounded border border-amber-800/30 bg-black/30";
}

export function arenaTitle(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2
    ? "text-center text-[15px] font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_20px_rgba(184,134,11,0.35)]"
    : "text-center text-lg font-semibold text-amber-200";
}

export function arenaSub(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2 ? "text-[11px] text-[#8a7a60] text-center mt-1" : "text-xs text-gray-400 text-center mt-1";
}

export function arenaPrimaryBtn(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2
    ? "w-full py-3 rounded-lg font-semibold text-[13px] text-[#1a1510] bg-gradient-to-b from-[#e8c56e] to-[#9a7020] border border-[#c7ad80]/60 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:brightness-110 active:scale-[0.99] transition-transform"
    : "w-full py-3 rounded-lg font-semibold bg-amber-600 hover:bg-amber-500 text-black";
}

export function arenaGhostBtn(): string {
  const isL2 = getCityUiVariant() === "l2";
  return isL2
    ? "w-full py-2 rounded-lg text-[12px] text-[#c9a44c] border border-[#5c4a32]/70 bg-gradient-to-b from-[#2a2318] to-[#14110c] hover:border-[#c7ad80]/40"
    : "w-full py-2 rounded-lg text-amber-200 border border-amber-800/50 hover:bg-amber-900/20";
}

/** Мінімальний Character для PkProfileView (рівень / ім'я суперника) */
export function minimalOpponentCharacter(opp: { id: string; name: string; level: number }): Character {
  const now = new Date().toISOString();
  return {
    id: opp.id,
    name: opp.name,
    race: "",
    classId: "duelist",
    sex: "",
    level: opp.level,
    exp: 0,
    sp: 0,
    adena: 0,
    aa: 0,
    coinLuck: 0,
    heroJson: { profession: "duelist", level: opp.level },
    createdAt: now,
    lastActivityAt: now,
  };
}
