// src/screens/character/CharacterQuests.tsx
import React, { useState } from "react";
import { useHeroStore } from "../../state/heroStore";
import { QUESTS, QUESTS_BY_LOCATION, type Quest } from "../../data/quests";
import { itemsDB } from "../../data/items/itemsDB";
import { getCityUiVariant } from "../../utils/cityUiVariant";

export default function CharacterQuests() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const isL2 = getCityUiVariant() === "l2";
  const rowB = isL2 ? "border-b border-solid border-[#5c4a32]/40" : "border-b border-solid border-white/50";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? "w-full flex items-center justify-center text-xs text-[#8a7a60]"
            : "w-full flex items-center justify-center text-xs text-gray-400"
        }
      >
        Загрузка персонажа...
      </div>
    );
  }

  const activeQuests = hero.activeQuests || [];
  const completedQuests = hero.completedQuests || [];

  // Отримуємо унікальні локації з квестів
  const locations = Array.from(new Set(QUESTS.map(q => q.location).filter(Boolean))) as string[];

  // Отримуємо активні квести з деталями та оновлюємо прогрес з інвентаря
  const activeQuestsWithDetails = activeQuests.map((activeQuest) => {
    const questDef = QUESTS.find((q) => q.id === activeQuest.questId);
    if (!questDef) return null;
    
    // Оновлюємо прогрес на основі інвентаря
    const progress: Record<string, number> = { ...activeQuest.progress };
    if (questDef.questDrops) {
      questDef.questDrops.forEach((questDrop) => {
        const inventoryItem = hero.inventory?.find((item) => item.id === questDrop.itemId);
        const itemCount = inventoryItem?.count || 0;
        // Прогрес = мінімум між кількістю в інвентарі та потрібною кількістю
        progress[questDrop.itemId] = Math.min(itemCount, questDrop.requiredCount);
      });
    }
    
    return { ...questDef, progress };
  }).filter((q): q is Quest & { progress: Record<string, number> } => q !== null);

  // Отримуємо доступні квести (не завершені та не активні)
  const availableQuests = QUESTS.filter(
    (quest) =>
      !completedQuests.includes(quest.id) &&
      !activeQuests.some((aq) => aq.questId === quest.id) &&
      (!quest.requirements?.level || (hero.level || 1) >= quest.requirements.level)
  );

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

  // Функція для завершення квесту
  const completeQuest = (questId: string) => {
    console.log("[completeQuest] Початок завершення квесту:", questId);
    const questDef = QUESTS.find((q) => q.id === questId);
    if (!questDef) {
      console.log("[completeQuest] Квест не знайдено:", questId);
      return;
    }

    // Перевіряємо, чи всі предмети зібрані (перевіряємо інвентар напряму)
    if (!questDef.questDrops) {
      console.log("[completeQuest] Немає questDrops");
      return;
    }

    // Групуємо по itemId для перевірки (беремо максимальну потрібну кількість)
    const itemsToCheck: Record<string, number> = {};
    questDef.questDrops.forEach((questDrop) => {
      if (!itemsToCheck[questDrop.itemId] || itemsToCheck[questDrop.itemId] < questDrop.requiredCount) {
        itemsToCheck[questDrop.itemId] = questDrop.requiredCount;
      }
    });

    let allCollected = true;
    Object.entries(itemsToCheck).forEach(([itemId, requiredCount]) => {
      const inventoryItem = hero.inventory?.find((item) => item.id === itemId);
      const itemCount = inventoryItem?.count || 0;
      console.log(`[completeQuest] Перевірка ${itemId}: має ${itemCount}, потрібно ${requiredCount}`);
      if (itemCount < requiredCount) {
        allCollected = false;
      }
    });

    if (!allCollected) {
      console.log("[completeQuest] Не всі предмети зібрані");
      return;
    }

    console.log("[completeQuest] Всі предмети зібрані, завершуємо квест");

    // Видаляємо квестові предмети з інвентаря
    // Групуємо по itemId, щоб не видаляти кілька разів один і той самий предмет
    const newInventory = [...(hero.inventory || [])];
    const itemsToRemove: Record<string, number> = {};
    
    questDef.questDrops.forEach((questDrop) => {
      // Для кожного унікального itemId зберігаємо максимальну потрібну кількість
      if (!itemsToRemove[questDrop.itemId] || itemsToRemove[questDrop.itemId] < questDrop.requiredCount) {
        itemsToRemove[questDrop.itemId] = questDrop.requiredCount;
      }
    });
    
    // Видаляємо предмети
    Object.entries(itemsToRemove).forEach(([itemId, requiredCount]) => {
      const itemIndex = newInventory.findIndex((item) => item.id === itemId);
      if (itemIndex >= 0) {
        const item = newInventory[itemIndex];
        const newCount = (item.count || 1) - requiredCount;
        if (newCount <= 0) {
          newInventory.splice(itemIndex, 1);
        } else {
          newInventory[itemIndex] = { ...item, count: newCount };
        }
      }
    });

    // Додаємо нагороди
    const rewards = questDef.rewards || {};
    let newAdena = hero.adena || 0;
    if (rewards.adena) {
      newAdena += rewards.adena;
    }

    // Додаємо предмети-нагороди
    if (rewards.items) {
      rewards.items.forEach((rewardItem) => {
        const itemDef = itemsDB[rewardItem.id];
        if (itemDef) {
          const existingItemIndex = newInventory.findIndex((item) => item.id === rewardItem.id);
          if (existingItemIndex >= 0) {
            const existingItem = newInventory[existingItemIndex];
            newInventory[existingItemIndex] = {
              ...existingItem,
              count: (existingItem.count || 1) + rewardItem.count,
            };
          } else {
            newInventory.push({
              id: itemDef.id,
              name: itemDef.name,
              type: itemDef.kind,
              slot: itemDef.slot,
              icon: itemDef.icon,
              description: itemDef.description,
              stats: itemDef.stats,
              count: rewardItem.count,
            });
          }
        }
      });
    }

    // Оновлюємо героя
    const newActiveQuests = activeQuests.filter((aq) => aq.questId !== questId);
    const newCompletedQuests = [...completedQuests, questId];

    console.log("[completeQuest] Оновлюємо героя:", {
      newActiveQuests: newActiveQuests.length,
      newCompletedQuests: newCompletedQuests.length,
      inventoryItems: newInventory.length,
      newAdena,
    });

    updateHero({
      activeQuests: newActiveQuests,
      completedQuests: newCompletedQuests,
      inventory: newInventory,
      adena: newAdena,
    });

    console.log("[completeQuest] Квест завершено успішно");
  };

  // Функція для оновлення прогресу квесту (викликається при зборі предметів)
  const updateQuestProgress = (questId: string, itemId: string) => {
    const newActiveQuests = activeQuests.map((aq) => {
      if (aq.questId === questId) {
        const currentProgress = aq.progress[itemId] || 0;
        return {
          ...aq,
          progress: {
            ...aq.progress,
            [itemId]: currentProgress + 1,
          },
        };
      }
      return aq;
    });

    updateHero({ activeQuests: newActiveQuests });
  };

  // Якщо локація не вибрана і є активні квести, показуємо їх, інакше показуємо список локацій
  const showLocationList = !selectedLocation && activeQuestsWithDetails.length === 0;

  return (
    <div className={isL2 ? "w-full text-[#d4c4a8] px-1 py-2" : "w-full text-[#f4e2b8] px-1 py-2"}>
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        {selectedLocation && (
          <button
            onClick={() => setSelectedLocation(null)}
            className={
              isL2 ? "text-[#8a7a60] text-xs hover:text-[#d4c4a8]" : "text-gray-400 text-xs hover:text-gray-300"
            }
          >
            ← Назад
          </button>
        )}
        <div
          className={
            isL2
              ? "text-[#e8c56e] text-xs border-b border-solid border-[#5c4a32]/45 pb-2 font-semibold flex-1"
              : "text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1"
          }
          style={isL2 ? undefined : { textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
        >
          {selectedLocation ? `${selectedLocation} ${QUESTS_BY_LOCATION[selectedLocation]?.[0]?.locationLevel ? `(${QUESTS_BY_LOCATION[selectedLocation][0].locationLevel})` : ""}` : "Мої Квести"}
        </div>
      </div>

      {/* Список локацій (якщо немає активних квестів і локація не вибрана) */}
      {showLocationList && (
        <div className="mb-2">
          <div
            className={
              isL2 ? "text-[#c9a44c] mb-2 text-xs font-semibold" : "text-[#b8860b] mb-2 text-xs font-semibold"
            }
          >
            Доступні локації:
          </div>
          <div className="space-y-1">
            {locations.map((location) => {
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
                  className={
                    isL2
                      ? `w-full text-left ${rowB} py-2 hover:bg-[#2a2618]/35 rounded-sm`
                      : "w-full text-left border-b border-solid border-white/50 py-2 hover:bg-black/20"
                  }
                >
                  <div className="flex items-center gap-2">
                    <img src="/assets/quest.png" alt="Quest" className="w-3 h-3 object-contain" />
                    <span className="text-orange-400 text-xs font-semibold">{location}</span>
                    {locationQuests[0]?.locationLevel && (
                      <span className={isL2 ? "text-[#8a7a60] text-[10px]" : "text-gray-400 text-[10px]"}>
                        ({locationQuests[0].locationLevel})
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Активні квести */}
      {activeQuestsWithDetails.length > 0 && (
        <div className="mb-2">
          <div
            className={
              isL2 ? "text-[#c9a44c] mb-2 text-xs font-semibold" : "text-[#b8860b] mb-2 text-xs font-semibold"
            }
          >
            Активні квести:
          </div>
          <div className="space-y-2">
            {activeQuestsWithDetails.map((quest) => {
              const canComplete = quest.questDrops?.every((questDrop) => {
                // Перевіряємо інвентар для точного прогресу
                const inventoryItem = hero.inventory?.find((item) => item.id === questDrop.itemId);
                const itemCount = inventoryItem?.count || 0;
                return itemCount >= questDrop.requiredCount;
              });

              return (
                <div key={quest.id} className={`${rowB} py-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <img src="/assets/quest.png" alt="Quest" className="w-3 h-3 object-contain" />
                    <span className="text-green-400 text-xs font-semibold">{quest.name}</span>
                  </div>
                  <div className={isL2 ? "text-[#8a7a60] text-[11px] mb-2" : "text-gray-400 text-[11px] mb-2"}>
                    {quest.description}
                  </div>
                  
                  {/* Прогрес */}
                  {quest.questDrops && (
                    <div
                      className={
                        isL2 ? "text-[#9d8265] text-[10px] mb-2" : "text-[#b8860b]/60 text-[10px] mb-2"
                      }
                    >
                      <div className="font-semibold mb-1">Прогрес:</div>
                      {(() => {
                        // Групуємо квестові предмети по itemId для відображення прогресу
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
                        return Object.values(groupedDrops).map((group) => {
                          // Перевіряємо інвентар для точного прогресу
                          const inventoryItem = hero.inventory?.find((item) => item.id === group.itemId);
                          const itemCount = inventoryItem?.count || 0;
                          const currentProgress = Math.min(itemCount, group.requiredCount);
                          const itemDef = itemsDB[group.itemId];
                          // Використовуємо назву з itemsDB, або очищаємо itemId від префіксу "quest_" та "_token"
                          const displayName = itemDef?.name || group.itemId.replace(/^quest_/i, "").replace(/_token$/i, "").replace(/_/g, " ");
                          return (
                            <div key={group.itemId} className="ml-2 flex items-center gap-1.5">
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
                                {displayName}: {currentProgress}({group.requiredCount}) з {group.mobNames.join(", ")}
                              </span>
                              {currentProgress >= group.requiredCount && (
                                <span className="text-green-400 ml-1">✓</span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Нагороди */}
                  {quest.rewards && (
                    <div className="text-[#ff8c00] text-[10px] mb-2 flex items-center gap-2">
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
                  )}

                  {/* Кнопка завершення */}
                  {canComplete && (
                    <button
                      className={
                        isL2
                          ? "mt-2 px-3 py-1 text-[10px] bg-gradient-to-b from-[#2e2619] to-[#14110c] text-green-400 border border-[#5c4a32]/70 rounded-md hover:border-[#c7ad80]/40 hover:brightness-110"
                          : "mt-2 px-3 py-1 text-[10px] bg-[#0f0a06] text-green-400 border border-white/50 rounded-md hover:bg-[#1a1208]"
                      }
                      onClick={() => completeQuest(quest.id)}
                    >
                      Завершити квест
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Доступні квести */}
      {availableQuests.length > 0 && (
        <div className="mb-2">
          <div
            className={
              isL2 ? "text-[#c9a44c] mb-2 text-xs font-semibold" : "text-[#b8860b] mb-2 text-xs font-semibold"
            }
          >
            Доступні квести:
          </div>
          <div className="space-y-2">
            {availableQuests.map((quest) => (
              <div key={quest.id} className={`${rowB} py-2 flex items-start gap-3`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <img src="/assets/quest.png" alt="Quest" className="w-3 h-3 object-contain" />
                    <span className="text-green-400 text-xs font-semibold">{quest.name}</span>
                  </div>
                  <div className={isL2 ? "text-[#8a7a60] text-[11px] mb-2" : "text-gray-400 text-[11px] mb-2"}>
                    {quest.description}
                  </div>
                  
                  {/* Детальна інформація про квестові предмети */}
                  {quest.questDrops && quest.questDrops.length > 0 && (
                    <div className={isL2 ? "text-[#8a7a60] text-[10px] mb-2" : "text-gray-400 text-[10px] mb-2"}>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Якщо немає квестів */}
      {activeQuestsWithDetails.length === 0 && availableQuests.length === 0 && (
        <div
          className={
            isL2 ? "text-[#8a7a60] text-xs text-center py-4" : "text-[#b8860b]/60 text-xs text-center py-4"
          }
        >
          Поки що немає доступних квестів.
        </div>
      )}
    </div>
  );
}

