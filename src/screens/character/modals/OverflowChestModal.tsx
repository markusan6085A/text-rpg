import React from "react";
import type { Hero } from "../../../types/Hero";
import { useHeroStore } from "../../../state/heroStore";
import { unloadOverflowChest } from "../../../state/heroStore/inventoryOverflow";
import { getEffectiveMaxNormal } from "../../../state/heroStore/inventoryOverflow";
import { itemsDB } from "../../../data/items/itemsDB";
import {
  characterModalBorderT,
  characterModalPanelClass,
  isCharacterModalL2,
} from "../characterModalL2";

interface OverflowChestModalProps {
  hero: Hero;
  onClose: () => void;
}

export default function OverflowChestModal({ hero, onClose }: OverflowChestModalProps) {
  const bt = characterModalBorderT();
  const l2 = isCharacterModalL2();
  const updateHero = useHeroStore((s) => s.updateHero);
  const overflowChest = hero.overflowChest || [];
  const totalItems = overflowChest.reduce((sum, i) => sum + (i.count ?? 1), 0);
  const effectiveMax = getEffectiveMaxNormal(hero);
  const freeSlots = Math.max(0, effectiveMax - (hero.inventory?.length ?? 0));
  const canUnload = freeSlots > 0 && overflowChest.length > 0;

  const handleUnload = () => {
    if (!canUnload) return;
    const { inventory, overflowChest: newOverflow } = unloadOverflowChest(hero);
    updateHero({ inventory, overflowChest: newOverflow });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={characterModalPanelClass("max-w-md w-full")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            Сундук переповнення
          </h2>
          <button
            className={l2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="space-y-3 text-xs mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Предметів у сундуку:</span>
            <span className="text-green-400">{totalItems}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Вільних слотів в інвентарі:</span>
            <span className="text-yellow-400">{freeSlots}</span>
          </div>
          {overflowChest.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Вміст:</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {overflowChest.map((item, i) => {
                  const def = itemsDB[item.id];
                  const name = def?.name ?? item.name ?? item.id;
                  const cnt = item.count ?? 1;
                  return (
                    <div key={`${item.id}-${i}`} className="flex items-center gap-2">
                      {def?.icon && (
                        <img
                          src={def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`}
                          alt={name}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="text-gray-300">{name}:</span>
                      <span className="text-green-400">x{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-gray-500 text-[11px]">
            Предмети з сундука не можна передати, продати чи видалити. Вони лишаються тут, поки є місце в інвентарі.
          </p>
        </div>
        <div className={`flex gap-2 justify-center pt-2 ${bt}`}>
          {canUnload && (
            <button
              onClick={handleUnload}
              className="px-4 py-2 rounded-md bg-[#2d4a2d] text-white text-xs hover:bg-[#3d5a3d]"
            >
              Вивантажити в інвентар
            </button>
          )}
          <button
            onClick={onClose}
            className={
              l2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            }
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
