import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

export function isCharacterModalL2(): boolean {
  return isWarmCityUi(getCityUiVariant());
}

/** Зовнішня панель модалок інвентаря / персонажа */
export function characterModalPanelClass(extra?: string): string {
  const l2 = isCharacterModalL2();
  const tail = extra ? ` ${extra}` : "";
  return l2
    ? `bg-[#14110c] border border-[#c7ad80]/35 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]${tail}`
    : `bg-[#14110c] border border-white/40 rounded-lg p-4${tail}`;
}

export const characterModalBorderT = (): string =>
  isCharacterModalL2() ? "border-t border-[#5c4a32]/50" : "border-t border-white/50";

export const characterModalMuted = (): string =>
  isCharacterModalL2() ? "text-[#8a7a60]" : "text-gray-400";

export const characterModalInputClass = (): string =>
  isCharacterModalL2()
    ? "flex-1 px-2 py-1 bg-[#0d0a06] border border-[#5c4a32]/60 text-[#d4c4a8] rounded text-xs"
    : "flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded text-xs";
