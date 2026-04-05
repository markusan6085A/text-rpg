import React from "react";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import EnchantScrollModal from "./EnchantScrollModal";
import ConsumableItemModal from "./ConsumableItemModal";
import EquipableItemModal from "./EquipableItemModal";
import QuestItemModal from "./QuestItemModal";
import FishItemModal from "./FishItemModal";
import FishingRodModal from "./FishingRodModal";
import TreasureBoxModal from "./TreasureBoxModal";
import { QUESTS } from "../../../data/quests";
import {
  characterModalBorderT,
  characterModalPanelClass,
  isCharacterModalL2,
} from "../characterModalL2";

interface InventoryItemModalProps {
  item: HeroInventoryItem;
  hero: Hero;
  inventory: HeroInventoryItem[];
  onClose: () => void;
  onDelete: (item: HeroInventoryItem, amount: number) => void;
  onTransfer: (item: HeroInventoryItem, amount: number) => void;
  onDeleteRequest: (item: HeroInventoryItem, amount: number) => void;
  updateHero: (partial: Partial<Hero>) => void;
}

export default function InventoryItemModal({
  item,
  hero,
  inventory,
  onClose,
  onDelete,
  onTransfer,
  onDeleteRequest,
  updateHero,
}: InventoryItemModalProps) {
  const bt = characterModalBorderT();
  const l2 = isCharacterModalL2();
  const isEnchantScroll =
    item.id?.includes("enchant_weapon_scroll") ||
    item.id?.includes("enchant_armor_scroll") ||
    item.id?.startsWith("gm_giant_enchant_");
  const isConsumable = item.slot === "consumable";
  // Перевіряємо, чи це риба
  const isFish =
    item.id === "fish_seawater" ||
    item.id === "fish_tuna" ||
    item.id === "fish_bream" ||
    item.id === "fish_angler";
  // Перевіряємо, чи це удочка (для спеціальної заточки)
  const isFishingRod = item.id === "baby_duck_rod" || item.id === "shop_baby_duck_rod" || (item.id && item.id.toLowerCase().includes("rod"));
  // Перевіряємо, чи це скарбничка
  const isTreasureBox = item.id === "treasure_box";
  const isSevenSealsMedal = item.id === "seven_seals_medal";
  // Нормалізуємо слот для щитів (lhand -> shield) та зброї (lrhand -> weapon)
  // Якщо item.slot відсутній (сервер міг не передати) — беремо з DB або kind
  const _itemDefForSlot = itemsDB[item.id] || itemsDBWithStarter[item.id];
  let normalizedSlot = item.slot || _itemDefForSlot?.slot || item.kind || _itemDefForSlot?.kind;
  if (item.slot === "lhand") {
    const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
    if (itemDef && (itemDef.kind === "shield" || itemDef.kind === "armor")) {
      normalizedSlot = "shield";
    }
  } else if (item.slot === "lrhand") {
    // Перевіряємо, чи це зброя (включаючи удочки)
    const itemDef = itemsDB[item.id] || itemsDBWithStarter[item.id];
    if (itemDef && itemDef.kind === "weapon") {
      normalizedSlot = "weapon";
    }
  }
  
  const normEquipId = (id: string | null | undefined) =>
    String(id ?? "").replace(/^shop_/i, "").trim().toLowerCase();
  const itemBaseId = normEquipId(item.id);
  // Якщо цей предмет вже одягнений у відповідний слот (або lrhand) — не показувати "Одеть"
  const isAlreadyEquippedInSlot =
    normEquipId(hero.equipment?.[normalizedSlot] as string) === itemBaseId ||
    (normalizedSlot === "weapon" && normEquipId(hero.equipment?.lrhand as string) === itemBaseId);
  const isEquipable = !["all", "consumable", "resource", "quest", "book", "recipe"].includes(normalizedSlot) && !isAlreadyEquippedInSlot;
  
  // Перевіряємо, чи це квестовий предмет
  const isQuestItem = QUESTS.some((q) =>
    q.questDrops?.some((drop) => drop.itemId === item.id)
  );
  const isQuestSlot = normalizedSlot === "quest";
  const canTransfer = !isQuestItem && !isQuestSlot && !isSevenSealsMedal && !(item as any).meta?.hasLSPassive;

  // Модалка для заточок
  if (isEnchantScroll) {
    return (
      <EnchantScrollModal
        scrollItem={item}
        hero={hero}
        inventory={inventory}
        onClose={onClose}
        onEnchantSuccess={onClose}
        onTransfer={() => onTransfer(item, 1)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для удочки (з функцією заточки за Coin of Luck)
  if (isFishingRod) {
    return (
      <FishingRodModal
        item={item}
        hero={hero}
        inventory={inventory}
        onClose={onClose}
        onDelete={() => onDeleteRequest(item, 1)}
        onTransfer={() => onTransfer(item, 1)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для риби
  if (isFish) {
    return (
      <FishItemModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
      />
    );
  }

  // Модалка для скарбнички
  if (isTreasureBox) {
    return (
      <TreasureBoxModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для расходників
  if (isConsumable) {
    return (
      <ConsumableItemModal
        item={item}
        hero={hero}
        onClose={onClose}
        onDelete={(amount) => onDeleteRequest(item, amount)}
        onTransfer={(amount) => onTransfer(item, amount)}
        updateHero={updateHero}
      />
    );
  }

  // Модалка для екіпіруємих предметів
  if (isEquipable) {
    return (
      <EquipableItemModal
        item={item}
        onClose={onClose}
        onDelete={() => onDeleteRequest(item, 1)}
        onTransfer={() => onTransfer(item, 1)}
      />
    );
  }

  // Модалка для квестових предметів або предметів з квест-шопу (slot=quest — показуємо характеристики з itemsDB)
  if (isQuestItem || isQuestSlot) {
    return (
      <QuestItemModal
        item={item}
        hero={hero}
        onClose={onClose}
      />
    );
  }

  // Модалка для інших предметів (за замовчуванням)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={characterModalPanelClass("max-w-md w-full")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={l2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#b8860b]"}>
            {(itemsDB[item.id] || itemsDBWithStarter[item.id])?.name || item.name || item.id}
          </h2>
          <button
            className={l2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl" : "text-gray-400 hover:text-white text-xl"}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="space-y-3 text-xs mb-4">
          {item.description && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Описание:</div>
              <div className="text-gray-300">{item.description}</div>
            </div>
          )}
        </div>
        {canTransfer && (
          <div className={`flex justify-center pb-2 ${bt} pt-2`}>
            <button
              onClick={() => onTransfer(item, 1)}
              className={
                l2
                  ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#c9a44c] hover:border-[#c7ad80]/40"
                  : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
              }
            >
              Передать
            </button>
          </div>
        )}
        <div className={`flex justify-center pt-2 ${bt}`}>
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
