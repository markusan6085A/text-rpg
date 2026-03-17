import React from "react";
import { FISH_BY_ROD_ENCHANT } from "../../../data/fishing/fishingCatchInfo";

interface FishingCatchInfoModalProps {
  onClose: () => void;
}

export default function FishingCatchInfoModal({ onClose }: FishingCatchInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">Информация об улове</h2>
          <button className="text-gray-400 hover:text-white text-xl" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Заточка удочки → Диапазон улова</div>
            <div className="border border-white/30 rounded overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#1a1a1a] text-[#c7ad80]">
                    <th className="px-3 py-2 font-semibold">Заточка</th>
                    <th className="px-3 py-2 font-semibold">Диапазон</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {FISH_BY_ROD_ENCHANT.map((row) => (
                    <tr key={row.enchant} className="border-t border-white/20">
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
            <div className="border border-white/30 rounded p-3 bg-[#1a1a1a] space-y-2 text-gray-300 mb-3">
              <div>• <span className="text-green-400">Риба</span> (fish_seawater) — кількість залежить від заточки удочки</div>
              <div>• <span className="text-yellow-400">Опит</span> — 100k–1M випадково (20% шанс 600k–1M, 40% — 400k–600k, 40% — 100k–400k)</div>
            </div>
            <div className="text-sm font-semibold text-[#b8860b] mb-2">Що випадає з риби (при розділці)</div>
            <div className="border border-white/30 rounded p-3 bg-[#1a1a1a] space-y-2 text-gray-300">
              <div>• <span className="text-yellow-300">Зброя/Броня</span> — шанс за 10 риб: D/C 0.7%, B/A/S 0.1%</div>
              <div>• <span className="text-yellow-300">Бижутерія</span> — шанс за 10 риб: D/C 0.7%, B/A/S 0.1%</div>
              <div>• <span className="text-green-400">Ресурси</span>: 0.8% кожен тип (за 1 рибу)</div>
              <div>• <span className="text-amber-400">Скарбничка</span>: 0.3% (за 1 рибу)</div>
              <div>• <span className="text-purple-300">Заточки</span>: 0.4% (за 1 рибу, D/C) — категорія «Заточки»</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4 mt-4 border-t border-white/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
