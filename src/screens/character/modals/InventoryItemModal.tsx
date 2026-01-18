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
  const isEnchantScroll = item.id?.includes("enchant_weapon_scroll") || item.id?.includes("enchant_armor_scroll");
  const isConsumable = item.slot === "consumable";
  // Перевіряємо, чи це риба
  const isFish = item.id?.startsWith("fish_") || item.id === "fish_tuna" || item.id === "fish_seawater" || item.id === "fish_bream" || item.id === "fish_angler";
  // Перевіряємо, чи це удочка (для спеціальної заточки)
  const isFishingRod = item.id === "baby_duck_rod";
  // Перевіряємо, чи це скарбничка
  const isTreasureBox = item.id === "treasure_box";
  // Нормалізуємо слот для щитів (lhand -> shield) та зброї (lrhand -> weapon)
  let normalizedSlot = item.slot;
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
  
  const isEquipable = !["all", "consumable", "resource", "quest", "book", "recipe"].includes(normalizedSlot);
  
  // Перевіряємо, чи це квестовий предмет
  const isQuestItem = QUESTS.some((q) =>
    q.questDrops?.some((drop) => drop.itemId === item.id)
  );

  // Модалка для заточок
  if (isEnchantScroll) {
    return (
      <EnchantScrollModal
        scrollItem={item}
        hero={hero}
        inventory={inventory}
        onClose={onClose}
        onEnchantSuccess={onClose}
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
        updateHero={updateHero}
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

  // Модалка для квестових предметів
  if (isQuestItem) {
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
        className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#b8860b]">
            {item.name}
          </h2>
          <button
            className="text-gray-400 hover:text-white text-xl"
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
        <div className="flex justify-center pt-2 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}





