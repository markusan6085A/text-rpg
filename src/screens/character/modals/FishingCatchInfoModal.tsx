import React from "react";
import { FISH_BY_ROD_ENCHANT } from "../../../data/fishing/fishingCatchInfo";
import {
  characterModalBorderT,
  characterModalPanelClass,
  isCharacterModalL2,
} from "../characterModalL2";

interface FishingCatchInfoModalProps {
  onClose: () => void;
}

export default function FishingCatchInfoModal({ onClose }: FishingCatchInfoModalProps) {
  const bt = characterModalBorderT();
  const l2 = isCharacterModalL2();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={characterModalPanelClass("max-w-md w-full max-h-[85vh] overflow-y-auto")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            Информация об улове
          </h2>
          <button
            className={l2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Заточка удочки → Диапазон улова</div>
            <div
              className={
                l2
                  ? "border border-[#5c4a32]/55 rounded-md overflow-hidden shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "border border-white/30 rounded overflow-hidden"
              }
            >
              <table className="w-full text-left">
                <thead>
                  <tr className={l2 ? "bg-[#1a1610] text-[#e8c56e]" : "bg-[#1a1a1a] text-[#c7ad80]"}>
                    <th className="px-3 py-2 font-semibold">Заточка</th>
                    <th className="px-3 py-2 font-semibold">Диапазон</th>
                  </tr>
                </thead>
                <tbody className={l2 ? "text-[#d4c4a8]" : "text-gray-300"}>
                  {FISH_BY_ROD_ENCHANT.map((row) => (
                    <tr
                      key={row.enchant}
                      className={l2 ? "border-t border-[#5c4a32]/35" : "border-t border-white/20"}
                    >
                      <td className="px-3 py-2">+{row.enchant}</td>
                      <td className="px-3 py-2">{row.min}–{row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">При забиранні улову</div>
            <div
              className={
                l2
                  ? "border border-[#5c4a32]/50 rounded-md p-3 bg-[#14110c] space-y-2 text-[#d4c4a8] mb-3"
                  : "border border-white/30 rounded p-3 bg-[#1a1a1a] space-y-2 text-gray-300 mb-3"
              }
            >
              <div>• <span className="text-green-400">Риба</span> (fish_seawater) — кількість залежить від заточки удочки</div>
              <div>• <span className="text-yellow-400">Опит</span> — 100k–1M випадково (20% шанс 600k–1M, 40% — 400k–600k, 40% — 100k–400k)</div>
            </div>
          </div>
        </div>

        <div className={`flex justify-center pt-4 mt-4 ${bt}`}>
          <button
            onClick={onClose}
            className={
              l2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            }
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
