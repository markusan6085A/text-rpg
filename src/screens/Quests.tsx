// src/screens/Quests.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { QUESTS, QUESTS_BY_LOCATION } from "../data/quests";
import { itemsDB } from "../data/items/itemsDB";

type Navigate = (path: string) => void;

export default function QuestsScreen({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  if (!hero) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const activeQuests = hero.activeQuests || [];
  const completedQuests = hero.completedQuests || [];

  // Отримуємо унікальні локації з квестів
  const locations = Array.from(new Set(QUESTS.map(q => q.location).filter(Boolean))) as string[];

  // Функція для прийняття квесту
  const acceptQuest = (questId: string) => {
    const questDef = QUESTS.find((q) => q.id === questId);
    if (!questDef) return;

    const newActiveQuests = [
      ...activeQuests,
      {
        questId,
        progress: questDef.progress ? { ...questDef.progress } : {},
      },
    ];

    updateHero({ activeQuests: newActiveQuests });
  };

  // Якщо локація не вибрана, показуємо список локацій
  if (!selectedLocation) {
    return (
      <div className="w-full text-[#f4e2b8] px-1 py-2">
        {/* Заголовок */}
        <div className="text-[#ffd700] mb-4 text-xs border-b border-dotted border-gray-500 pb-2 font-semibold" style={{ textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}>
          Квести
        </div>

        {/* Список локацій */}
        <div className="space-y-2">
          {locations.length === 0 ? (
            <div className="text-[#b8860b]/60 text-xs text-center py-4">
              Поки що немає доступних локацій з квестами.
            </div>
          ) : (
            locations.map((location) => {
              const locationQuests = QUESTS_BY_LOCATION[location] || [];
              const availableLocationQuests = locationQuests.filter(
                (quest) =>
                  !completedQuests.includes(quest.id) &&
                  !activeQuests.some((aq) => aq.questId === quest.id) &&
                  (!quest.requirements?.level || (hero.level || 1) >= quest.requirements.level)
              );

              if (availableLocationQuests.length === 0) return null;

              return (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className="w-full text-left border-b border-dotted border-gray-500 py-2 hover:bg-black/20"
                >
                  <div className="flex items-center gap-2">
                    <img src="/assets/quest.png" alt="Quest" className="w-3 h-3 object-contain" />
                    <span className="text-orange-400 text-xs font-semibold">{location}</span>
                    {locationQuests[0]?.locationLevel && (
                      <span className="text-gray-400 text-[10px]">({locationQuests[0].locationLevel})</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Якщо локація вибрана, показуємо квести з цієї локації
  const locationQuests = QUESTS_BY_LOCATION[selectedLocation] || [];
  const availableQuests = locationQuests.filter(
    (quest) =>
      !completedQuests.includes(quest.id) &&
      !activeQuests.some((aq) => aq.questId === quest.id) &&
      (!quest.requirements?.level || (hero.level || 1) >= quest.requirements.level)
  );

  return (
    <div className="w-full text-[#f4e2b8] px-1 py-2">
      {/* Заголовок з кнопкою назад */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSelectedLocation(null)}
          className="text-gray-400 text-xs hover:text-gray-300"
        >
          ← Назад
        </button>
        <div className="text-[#ffd700] text-xs border-b border-dotted border-gray-500 pb-2 font-semibold flex-1" style={{ textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}>
          {selectedLocation} {locationQuests[0]?.locationLevel && `(${locationQuests[0].locationLevel})`}
        </div>
      </div>

      {/* Список квестів */}
      <div className="space-y-2">
        {availableQuests.length === 0 ? (
          <div className="text-[#b8860b]/60 text-xs text-center py-4">
            Поки що немає доступних квестів у цій локації.
          </div>
        ) : (
          availableQuests.map((quest) => (
            <div
              key={quest.id}
              className="border-b border-dotted border-gray-500 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <img src="/assets/quest.png" alt="Quest" className="w-3 h-3 object-contain" />
                <span className="text-green-400 text-xs font-semibold">{quest.name}</span>
              </div>
              <div className="text-gray-400 text-[11px] mb-2">
                {quest.description}
              </div>
              
              {/* Детальна інформація про квестові предмети */}
              {quest.questDrops && quest.questDrops.length > 0 && (
                <div className="text-gray-400 text-[10px] mb-2">
                  <div className="font-semibold mb-1">Потрібно зібрати:</div>
                  {(() => {
                    // Групуємо квестові предмети по itemId
                    const groupedDrops: Record<string, { itemId: string; requiredCount: number; mobNames: string[] }> = {};
                    quest.questDrops.forEach((questDrop) => {
                      if (!groupedDrops[questDrop.itemId]) {
                        groupedDrops[questDrop.itemId] = {
                          itemId: questDrop.itemId,
                          requiredCount: questDrop.requiredCount,
                          mobNames: [],
                        };
                      }
                      if (!groupedDrops[questDrop.itemId].mobNames.includes(questDrop.mobName)) {
                        groupedDrops[questDrop.itemId].mobNames.push(questDrop.mobName);
                      }
                    });
                    return Object.values(groupedDrops).map((group, idx) => {
                      const itemDef = itemsDB[group.itemId];
                      // Використовуємо назву з itemsDB, або очищаємо itemId від префіксу "quest_" та "_token"
                      const displayName = itemDef?.name || group.itemId.replace(/^quest_/i, "").replace(/_token$/i, "").replace(/_/g, " ");
                      return (
                        <div key={idx} className="ml-2 flex items-center gap-1.5">
                          {itemDef?.icon && (
                            <img 
                              src={itemDef.icon} 
                              alt={itemDef.name || group.itemId} 
                              className="w-4 h-4 object-contain flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <span>
                            {group.requiredCount}x {displayName} з {group.mobNames.join(", ")}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {quest.rewards && (
                <div className="text-[#ff8c00] text-[10px] mb-2 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Нагороди:</span>
                    {quest.rewards.exp && <span>EXP: {quest.rewards.exp.toLocaleString("ru-RU")} </span>}
                    {quest.rewards.adena && <span>Адена: {quest.rewards.adena.toLocaleString("ru-RU")} </span>}
                    {quest.rewards.items?.map((item, idx) => {
                      const itemDef = itemsDB[item.id];
                      return (
                        <span key={idx} className="flex items-center gap-1">
                          {itemDef?.icon && (
                            <img src={itemDef.icon} alt={itemDef.name} className="w-4 h-4 object-contain" />
                          )}
                          <span>{itemDef?.name || item.id} x{item.count}</span>
                          {idx < (quest.rewards?.items?.length || 0) - 1 ? ", " : ""}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className="text-purple-400 text-[10px] hover:text-purple-300 underline cursor-pointer"
                    onClick={() => acceptQuest(quest.id)}
                  >
                    Взять квест
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
