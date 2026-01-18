import React from "react";
import type { HeroInventoryItem } from "../../../types/Hero";
import { QUESTS } from "../../../data/quests";
import { itemsDB } from "../../../data/items/itemsDB";

interface QuestItemModalProps {
  item: HeroInventoryItem;
  hero: any;
  onClose: () => void;
}

export default function QuestItemModal({
  item,
  hero,
  onClose,
}: QuestItemModalProps) {
  // Знаходимо квест, який використовує цей предмет
  const quest = QUESTS.find((q) =>
    q.questDrops?.some((drop) => drop.itemId === item.id)
  );

  const activeQuests = hero?.activeQuests || [];
  const isQuestActive = quest && activeQuests.some((aq: any) => aq.questId === quest.id);

  // Отримуємо прогрес для цього квесту
  let currentProgress = 0;
  let requiredCount = 0;
  let mobNames: string[] = [];

  if (quest && isQuestActive) {
    const activeQuest = activeQuests.find((aq: any) => aq.questId === quest.id);
    const questDrop = quest.questDrops?.find((drop) => drop.itemId === item.id);
    
    if (questDrop) {
      requiredCount = questDrop.requiredCount;
      mobNames = quest.questDrops
        ?.filter((drop) => drop.itemId === item.id)
        .map((drop) => drop.mobName) || [];
      
      // Перевіряємо інвентар для точного прогресу
      const inventoryItem = hero?.inventory?.find((invItem: any) => invItem.id === item.id);
      const itemCount = inventoryItem?.count || 0;
      currentProgress = Math.min(itemCount, requiredCount);
    }
  } else if (quest) {
    const questDrop = quest.questDrops?.find((drop) => drop.itemId === item.id);
    if (questDrop) {
      requiredCount = questDrop.requiredCount;
      mobNames = quest.questDrops
        ?.filter((drop) => drop.itemId === item.id)
        .map((drop) => drop.mobName) || [];
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {item.icon && (
              <img
                src={item.icon}
                alt={item.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <h2 className="text-lg font-semibold text-[#b8860b]">
              {item.name}
            </h2>
          </div>
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
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Опис:</div>
              <div className="text-gray-300">{item.description}</div>
            </div>
          )}

          {quest && (
            <div>
              <div className="text-sm font-semibold text-[#b8860b] mb-2">Квест:</div>
              <div className="text-green-400 font-semibold mb-1">{quest.name}</div>
              <div className="text-gray-300 text-[11px] mb-2">{quest.description}</div>
              
              {requiredCount > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-1">Потрібно зібрати:</div>
                  <div className="text-gray-300 text-[11px]">
                    {requiredCount}x {item.name}
                  </div>
                  {mobNames.length > 0 && (
                    <div className="text-gray-400 text-[10px] mt-1">
                      З мобів: {mobNames.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {isQuestActive && requiredCount > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-semibold text-[#b8860b] mb-1">Прогрес:</div>
                  <div className="text-gray-300 text-[11px]">
                    {currentProgress} / {requiredCount}
                  </div>
                  {currentProgress >= requiredCount && (
                    <div className="text-green-400 text-[10px] mt-1">✓ Завершено</div>
                  )}
                </div>
              )}

              {!isQuestActive && (
                <div className="mt-2">
                  <div className="text-yellow-400 text-[11px]">
                    Квест не активний. Прийміть квест, щоб почати збирати предмети.
                  </div>
                </div>
              )}
            </div>
          )}

          {!quest && (
            <div className="text-gray-400 text-[11px]">
              Цей предмет не пов'язаний з жодним квестом.
            </div>
          )}

          {item.count && item.count > 1 && (
            <div className="text-gray-300 text-[11px]">
              Кількість: {item.count}
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

