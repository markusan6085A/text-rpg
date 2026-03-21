import { getCityUiVariant } from "../../../utils/cityUiVariant";

export function clanModalIsL2(): boolean {
  return getCityUiVariant() === "l2";
}

const L2_FRAME =
  "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(120,90,45,0.22)_0%,transparent_45%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

export function clanModalBackdropClass(): string {
  return "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4";
}

export function clanModalPanelClass(extra?: string): string {
  const l2 = clanModalIsL2();
  const e = extra ? ` ${extra}` : "";
  return l2
    ? `${L2_FRAME} p-4 sm:p-5 w-full${e}`
    : `bg-[#1a1a1a] border border-white/50 rounded p-4 w-full${e}`;
}

export function clanModalTitleClass(): string {
  return clanModalIsL2()
    ? "text-[14px] font-semibold text-[#e8c56e] mb-3 border-b border-[#5c4a32]/45 pb-2"
    : "text-[14px] text-[#f4e2b8] mb-3";
}

export function clanModalMutedClass(): string {
  return clanModalIsL2() ? "text-[#8a7a60]" : "text-[#9f8d73]";
}

export function clanModalInnerListClass(): string {
  return clanModalIsL2()
    ? "rounded-md border border-[#5c4a32]/50 bg-black/25 p-2 max-h-64 overflow-y-auto space-y-1 shadow-[inset_0_1px_0_rgba(199,173,128,0.05)]"
    : "bg-[#2a2a2a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";
}

export function clanModalChipClass(selected: boolean): string {
  if (clanModalIsL2()) {
    return selected
      ? "px-3 py-1 text-[11px] rounded-md border border-[#c7ad80]/45 bg-gradient-to-b from-[#3a3224] to-[#1c1810] text-[#e8dcc8]"
      : "px-3 py-1 text-[11px] rounded-md border border-[#5c4a32]/50 bg-black/20 text-[#a89470] hover:border-[#5c4a32]/70 hover:text-[#d4c4a8]";
  }
  return selected
    ? "px-3 py-1 text-[11px] rounded transition-colors bg-[#5a4424] text-[#f4e2b8]"
    : "px-3 py-1 text-[11px] rounded transition-colors bg-[#2a2a2a] text-[#c7ad80] hover:bg-[#3a3a3a]";
}

export function clanModalItemRowClass(): string {
  return clanModalIsL2()
    ? "flex items-center gap-2 text-[11px] text-[#d4c4a8] border-b border-[#5c4a32]/35 pb-1 cursor-pointer hover:bg-black/20 p-1 rounded-md"
    : "flex items-center gap-2 text-[11px] text-[#c7ad80] border-b border-solid border-white/40 pb-1 cursor-pointer hover:bg-[#3a3a3a] p-1 rounded";
}

export function clanModalApplicationCardClass(): string {
  return clanModalIsL2()
    ? "p-2 rounded-md border border-[#5c4a32]/45 bg-black/20 flex justify-between items-center gap-2"
    : "p-2 bg-[#2a2a2a] border border-white/30 rounded flex justify-between items-center";
}

export function clanModalBtnPrimaryClass(): string {
  return clanModalIsL2()
    ? "px-3 py-1.5 rounded-md text-[12px] font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/50 disabled:opacity-50"
    : "px-3 py-1 bg-[#5a4424] text-white text-[12px] rounded hover:bg-[#6a5434] disabled:opacity-50";
}

export function clanModalBtnSecondaryClass(): string {
  return clanModalIsL2()
    ? "px-3 py-1.5 rounded-md text-[12px] border border-[#5c4a32]/50 bg-black/25 text-[#d4c4a8] hover:border-[#5c4a32]/70"
    : "px-3 py-1 bg-[#3a3a3a] text-white text-[12px] rounded hover:bg-[#4a4a4a]";
}

export function clanModalBtnAcceptClass(): string {
  return clanModalIsL2()
    ? "px-2 py-0.5 text-[11px] rounded-md border border-[#4a6b48]/70 bg-gradient-to-b from-[#1e2a1c] to-[#101810] text-[#a8c4a4] hover:border-[#7d9b7a]/55"
    : "px-2 py-0.5 text-[11px] bg-green-700 text-white rounded hover:bg-green-600";
}

export function clanModalCancelLinkClass(): string {
  return clanModalIsL2()
    ? "w-full text-[12px] text-[#c9a44c] hover:text-[#e8c56e] transition-colors py-2"
    : "w-full text-[12px] text-red-600 hover:text-red-500 transition-colors";
}

export function clanModalTextareaClass(): string {
  return clanModalIsL2()
    ? "w-full h-24 px-2 py-1.5 bg-[#0f0a06] border border-[#5c4a32]/60 text-[#e8dcc8] text-[12px] rounded-md resize-none placeholder:text-[#6a6048]"
    : "w-full h-24 px-2 py-1 bg-[#2a2a2a] border border-white/40 text-white text-[12px] rounded resize-none";
}

export function clanModalEmblemCellClass(isSelected: boolean): string {
  const base =
    "relative cursor-pointer border-2 rounded-md p-1 transition-all flex items-center justify-center";
  if (clanModalIsL2()) {
    return `${base} ${
      isSelected
        ? "border-[#c9a44c] bg-[#2a2419]/80 shadow-[inset_0_1px_0_rgba(232,197,110,0.15)]"
        : "border-[#5c4a32]/50 bg-[#1a1610] hover:border-[#c7ad80]/35"
    }`;
  }
  return `${base} ${
    isSelected ? "border-yellow-500 bg-yellow-500/20" : "border-white/40 hover:border-white/50"
  }`;
}

export function clanModalEmblemCellBackground(): string {
  return clanModalIsL2() ? "#14110c" : "#252422";
}

export function clanModalEnchantClass(): string {
  return clanModalIsL2() ? "text-[#e8c56e]" : "text-[#b8860b]";
}

export function clanModalPaginationBtnClass(disabled: boolean): string {
  if (clanModalIsL2()) {
    return disabled
      ? "px-2 py-1 text-[#5c4a32] cursor-not-allowed"
      : "px-2 py-1 text-[#c9a44c] hover:text-[#e8c56e]";
  }
  return disabled
    ? "px-2 py-1 text-gray-500 cursor-not-allowed"
    : "px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8]";
}

export function clanModalPaginationPageClass(): string {
  return clanModalIsL2() ? "text-[#d4c4a8]" : "text-white";
}
