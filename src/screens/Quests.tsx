// src/screens/Quests.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { QUESTS, QUESTS_BY_LOCATION } from "../data/quests";
import { itemsDB } from "../data/items/itemsDB";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (path: string) => void;

export default function QuestsScreen({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const rowL2 =
    "w-full text-left text-[12px] py-2.5 px-3 mb-2 rounded-md flex items-center gap-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";
  const questCardL2 =
    "rounded-md border border-[#5c4a32]/60 bg-black/20 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)] px-2.5 py-2 mb-2";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-xs gap-2`
            : "w-full flex items-center justify-center text-xs text-gray-400"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
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
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
            : "w-full text-[#f4e2b8] px-1 py-2"
        }
      >
        <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
          <div
            className={
              isL2
                ? "text-[#e8c56e] mb-3 text-[13px] border-b border-[#c7ad80]/20 pb-2 font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-[#ffd700] mb-2 text-xs border-b border-solid border-white/50 pb-2 font-semibold"
            }
            style={isL2 ? undefined : { textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
          >
            Квести
          </div>

          <div className={isL2 ? "space-y-0" : "space-y-2"}>
            {locations.length === 0 ? (
              <div
                className={
                  isL2
                    ? "text-[#8a7a60] text-xs text-center py-6 rounded-lg border border-[#5c4a32]/35"
                    : "text-[#b8860b]/60 text-xs text-center py-4"
                }
              >
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
                    type="button"
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={
                      isL2
                        ? `${rowL2} text-[#d4c4a8]`
                        : "w-full text-left border-b border-solid border-white/50 py-2 hover:bg-black/20"
                    }
                  >
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <img
                        src="/assets/quest.png"
                        alt=""
                        className={isL2 ? "w-4 h-4 object-contain shrink-0" : "w-3 h-3 object-contain"}
                      />
                      <span
                        className={
                          isL2
                            ? "text-[#c9a44c] text-xs font-semibold truncate"
                            : "text-orange-400 text-xs font-semibold"
                        }
                      >
                        {location}
                      </span>
                      {locationQuests[0]?.locationLevel && (
                        <span
                          className={
                            isL2 ? "text-[#8a7a60] text-[10px] ml-auto shrink-0" : "text-gray-400 text-[10px]"
                          }
                        >
                          ({locationQuests[0].locationLevel})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
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
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
          : "w-full text-[#f4e2b8] px-1 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setSelectedLocation(null)}
            className={
              isL2
                ? "text-[#c9a44c] text-xs hover:text-[#f4e2b8] shrink-0"
                : "text-gray-400 text-xs hover:text-gray-300"
            }
          >
            ← Назад
          </button>
          <div
            className={
              isL2
                ? "text-[#e8c56e] text-xs border-b border-[#c7ad80]/20 pb-2 font-semibold flex-1 min-w-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1"
            }
            style={isL2 ? undefined : { textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
          >
            {selectedLocation} {locationQuests[0]?.locationLevel && `(${locationQuests[0].locationLevel})`}
          </div>
        </div>

        <div className={isL2 ? "space-y-0" : "space-y-2"}>
          {availableQuests.length === 0 ? (
            <div
              className={
                isL2
                  ? "text-[#8a7a60] text-xs text-center py-6 rounded-lg border border-[#5c4a32]/35"
                  : "text-[#b8860b]/60 text-xs text-center py-4"
              }
            >
              Поки що немає доступних квестів у цій локації.
            </div>
          ) : (
            availableQuests.map((quest) => (
              <div
                key={quest.id}
                className={
                  isL2 ? questCardL2 : "border-b border-solid border-white/50 py-2"
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <img src="/assets/quest.png" alt="" className="w-3 h-3 object-contain shrink-0" />
                  <span
                    className={
                      isL2 ? "text-[#7d9b7a] text-xs font-semibold" : "text-green-400 text-xs font-semibold"
                    }
                  >
                    {quest.name}
                  </span>
                </div>
                <div
                  className={
                    isL2 ? "text-[#a89878] text-[11px] mb-2" : "text-gray-400 text-[11px] mb-2"
                  }
                >
                  {quest.description}
                </div>
              
              {/* Детальна інформація про квестові предмети */}
              {quest.questDrops && quest.questDrops.length > 0 && (
                <div
                  className={
                    isL2 ? "text-[#8a7a60] text-[10px] mb-2" : "text-gray-400 text-[10px] mb-2"
                  }
                >
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
                <div
                  className={
                    isL2
                      ? "text-[#d4a574] text-[10px] mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      : "text-[#ff8c00] text-[10px] mb-2 flex items-center gap-2 justify-between"
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
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
                    type="button"
                    className={
                      isL2
                        ? "text-[#c9a44c] text-[10px] hover:text-[#f4e2b8] underline cursor-pointer shrink-0 self-start sm:self-auto"
                        : "text-purple-400 text-[10px] hover:text-purple-300 underline cursor-pointer"
                    }
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
    </div>
  );
}
