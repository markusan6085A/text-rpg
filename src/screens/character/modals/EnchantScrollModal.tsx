import React, { useState, useMemo } from "react";
import { itemsDB } from "../../../data/items/itemsDB";
import { getGradeFromScrollId, getGradeFromItemId } from "../../../utils/enchantHelpers";
import { handleEnchantScroll } from "../../../state/battle/actions/enchantScroll";
import type { BattleState } from "../../../state/battle/types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import {
  characterModalBorderT,
  characterModalPanelClass,
  isCharacterModalL2,
} from "../characterModalL2";

interface EnchantScrollModalProps {
  scrollItem: HeroInventoryItem;
  hero: Hero;
  inventory: HeroInventoryItem[];
  onClose: () => void;
  onEnchantSuccess: () => void;
  onTransfer: () => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function EnchantScrollModal({
  scrollItem,
  hero,
  inventory,
  onClose,
  onEnchantSuccess,
  onTransfer,
  updateHero,
}: EnchantScrollModalProps) {
  const bt = characterModalBorderT();
  const l2 = isCharacterModalL2();
  /** Індекс рядка в `inventory` — один предмет на кілька однакових id у списку */
  const [selectedInvIndex, setSelectedInvIndex] = useState<number | null>(null);
  const [lastEnchantResult, setLastEnchantResult] = useState<{
    invIndex: number;
    success: boolean;
    newLevel: number;
  } | null>(null);

  const scrollGrade = getGradeFromScrollId(scrollItem.id);
  const isWeaponScroll = scrollItem.id?.includes("weapon");
  const isArmorScroll = scrollItem.id?.includes("armor");

  // Підходящі предмети + індекс рядка в інвентарі (не тільки id — інакше дублікати «злипаються»)
  const suitableItems = useMemo(() => {
    const out: { item: HeroInventoryItem; invIndex: number }[] = [];
    (inventory || []).forEach((item: any, invIndex: number) => {
      if (!item || !item.id) return;
      const itemDef = itemsDB[item.id];
      if (!itemDef) return;
      const itemGrade = itemDef.grade ?? getGradeFromItemId(item.id);
      if (scrollGrade && itemGrade && itemGrade !== scrollGrade) return;
      if (isWeaponScroll && itemDef.kind === "weapon") {
        out.push({ item, invIndex });
        return;
      }
      if (
        isArmorScroll &&
        (["armor", "helmet", "boots", "gloves", "shield", "necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(
          itemDef.kind || ""
        ) ||
          ["necklace", "ring", "earring", "jewelry", "belt", "cloak"].includes(itemDef.slot || ""))
      ) {
        out.push({ item, invIndex });
      }
    });
    return out;
  }, [inventory, scrollGrade, isWeaponScroll, isArmorScroll]);

  const handleEnchant = () => {
    if (selectedInvIndex == null || !hero) return;
    const targetRow = inventory[selectedInvIndex];
    if (!targetRow) return;

    const fakeState: BattleState = {
      log: [],
      cooldowns: {},
      heroBuffs: [],
    } as unknown as BattleState;

    const result = handleEnchantScroll(
      scrollItem.id,
      targetRow.id,
      null,
      fakeState,
      hero,
      () => {},
      (partial) => updateHero(partial),
      selectedInvIndex
    );

    if (result.applied && result.newLevel !== undefined && selectedInvIndex != null) {
      // Після зняття рядка скрола індекси цілі зсуваються — інакше підсвітка «переповзе» на інший рядок
      const sIdx = inventory.findIndex((i) => i.id === scrollItem.id);
      let nextIdx = selectedInvIndex;
      if (sIdx !== -1 && sIdx < nextIdx && (inventory[sIdx]?.count ?? 1) <= 1) {
        nextIdx -= 1;
      }
      setSelectedInvIndex(nextIdx);
      setLastEnchantResult({
        invIndex: nextIdx,
        success: result.success,
        newLevel: result.newLevel,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={characterModalPanelClass("max-w-md w-full max-h-[90vh] overflow-y-auto")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            {scrollItem.name}
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
            <span className="text-gray-400">Грейд:</span>
            <span className="text-[#b8860b]">{scrollGrade}-grade</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Тип:</span>
            <span className="text-[#b8860b]">{isWeaponScroll ? "Зброя" : "Броня"}</span>
          </div>
        </div>
        
        <div className={`${bt} pt-2 mt-2 mb-4`}>
          <div className={l2 ? "text-sm font-semibold text-[#e8c56e] mb-2" : "text-sm font-semibold text-[#b8860b] mb-2"}>
            Оберіть предмет для заточки:
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suitableItems.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">
                Немає підходящих предметів
              </div>
            ) : (
              suitableItems.map(({ item, invIndex }) => {
                const itemDef = itemsDB[item.id];
                const displayName = item.name || itemDef?.name || item.id;
                const iconRaw = item.icon || itemDef?.icon;
                const iconPath = typeof iconRaw === "string"
                  ? (iconRaw.startsWith("/") ? iconRaw : `/items/${iconRaw}`)
                  : "/items/drops/Weapon_squires_sword_i00_0.jpg";
                const isJustEnchanted = lastEnchantResult?.invIndex === invIndex;
                const displayLevel = isJustEnchanted ? lastEnchantResult.newLevel : (item.enchantLevel ?? 0);
                const levelColor = isJustEnchanted
                  ? lastEnchantResult.success
                    ? "text-green-400 font-semibold"
                    : "text-red-400 font-semibold"
                  : "text-gray-400";
                return (
                  <button
                    key={`inv-${invIndex}`}
                    onClick={() => setSelectedInvIndex(invIndex)}
                    className={
                      l2
                        ? `w-full flex items-center gap-2 p-2 border rounded-md ${
                            selectedInvIndex === invIndex
                              ? "border-[#c7ad80]/45 bg-[#2a2618]/80"
                              : "border-[#5c4a32]/55 bg-[#14110c]"
                          }`
                        : `w-full flex items-center gap-2 p-2 border rounded ${
                            selectedInvIndex === invIndex
                              ? "border-white/50 bg-[#2a2a2a]"
                              : "border-white/50 bg-[#1a1a1a]"
                          }`
                    }
                  >
                    <img
                      src={iconPath}
                      alt={displayName}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                      }}
                    />
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm">{displayName}</div>
                      <div className={`text-xs ${levelColor}`}>Заточка: +{displayLevel}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        <div className={`flex justify-center gap-2 pt-2 ${bt}`}>
          {selectedInvIndex != null && (
            <button
              onClick={handleEnchant}
              className={
                l2
                  ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                  : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
              }
            >
              Заточить
            </button>
          )}
          <button
            onClick={onTransfer}
            className={
              l2
                ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
            }
          >
            Передать
          </button>
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
