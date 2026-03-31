// src/screens/character/CharacterQuests.tsx
import React, { useState } from "react";
import { useHeroStore } from "../../state/heroStore";
import {
  QUESTS,
  QUESTS_BY_LOCATION,
  QUEST_ITEM_TURN_IN_ALIASES,
  ELVEN_MYSTIC_FIRST_PROF_QUEST_ID,
  ELVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  isHeroElvenMysticBaseForFirstProfQuest,
  isHeroElvenFighterBaseForFirstProfQuest,
  type Quest,
} from "../../data/quests";
import { itemsDB } from "../../data/items/itemsDB";
import type { HeroInventoryItem } from "../../types/Hero";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { getGameSettings } from "../../state/gameSettings";
import { getPremiumMultiplier } from "../../utils/premium/isPremiumActive";

function questIconSrc(quest: { icon?: string }) {
  return quest.icon || "/assets/quest.png";
}

/** Кількість для здачі: квестовий id + алиаси (напр. charcoal з дропу зони). */
function countQuestTurnInInInventory(inv: HeroInventoryItem[] | undefined, questItemId: string): number {
  const aliases = QUEST_ITEM_TURN_IN_ALIASES[questItemId];
  const ids = aliases ? ([questItemId, ...aliases] as const) : [questItemId];
  const set = new Set<string>(ids);
  let sum = 0;
  for (const it of inv ?? []) {
    if (set.has(it.id)) sum += it.count ?? 1;
  }
  return sum;
}

/** Зняти required з усіх стеків і за всіма id (канонічний + алиаси). */
function removeQuestTurnInFromInventory(inv: HeroInventoryItem[], questItemId: string, toRemove: number): HeroInventoryItem[] {
  const aliases = QUEST_ITEM_TURN_IN_ALIASES[questItemId];
  const order = aliases ? [questItemId, ...aliases] : [questItemId];
  let remaining = Math.max(0, Math.floor(toRemove));
  const out = [...inv];
  for (const itemId of order) {
    for (let i = out.length - 1; i >= 0 && remaining > 0; i--) {
      if (out[i].id !== itemId) continue;
      const c = out[i].count ?? 1;
      if (c <= remaining) {
        remaining -= c;
        out.splice(i, 1);
      } else {
        out[i] = { ...out[i], count: c - remaining };
        remaining = 0;
      }
    }
  }
  return out;
}

type CharacterQuestsProps = {
  /** true на /quests — без дубля шапки, контент одразу під банером сторінки */
  embedInQuestPage?: boolean;
  /** Для кнопки переходу на крафт ресурсів (див. quest.resourceCraftHint) */
  navigate?: (path: string) => void;
};

function QuestResourceCraftCallout(props: {
  hint: string;
  navigate?: (path: string) => void;
  isL2: boolean;
}) {
  const { hint, navigate, isL2 } = props;
  return (
    <div
      className={
        isL2
          ? "mb-2 rounded border border-[#5c4a32]/45 bg-black/25 px-2 py-1.5 text-[10px] text-[#c9b99a]"
          : "mb-2 rounded border border-white/15 bg-black/20 px-2 py-1.5 text-[10px] text-gray-300"
      }
    >
      <div className="leading-snug">{hint}</div>
      {navigate ? (
        <button
          type="button"
          onClick={() => navigate("/craft/resources")}
          className={
            isL2
              ? "mt-1.5 text-[10px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
              : "mt-1.5 text-[10px] font-semibold text-purple-400 hover:text-purple-300 underline"
          }
        >
          Крафт ресурсів →
        </button>
      ) : null}
    </div>
  );
}

export default function CharacterQuests({ embedInQuestPage = false, navigate }: CharacterQuestsProps = {}) {
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

    const progress: Record<string, number> = { ...activeQuest.progress };
    if (questDef.questDrops) {
      questDef.questDrops.forEach((questDrop) => {
        const itemCount = countQuestTurnInInInventory(hero.inventory, questDrop.itemId);
        progress[questDrop.itemId] = Math.min(itemCount, questDrop.requiredCount);
      });
    }
    if (questDef.questKillTargets) {
      questDef.questKillTargets.forEach((kt) => {
        const v = activeQuest.progress?.[kt.progressKey] ?? 0;
        progress[kt.progressKey] = Math.min(v, kt.requiredCount);
      });
    }

    return { ...questDef, progress };
  }).filter((q): q is Quest & { progress: Record<string, number> } => {
    if (q == null) return false;
    if (q.id === ELVEN_MYSTIC_FIRST_PROF_QUEST_ID && !isHeroElvenMysticBaseForFirstProfQuest(hero)) return false;
    if (q.id === ELVEN_FIGHTER_FIRST_PROF_QUEST_ID && !isHeroElvenFighterBaseForFirstProfQuest(hero)) return false;
    return true;
  });

  // Отримуємо доступні квести (не завершені та не активні)
  const availableQuests = QUESTS.filter(
    (quest) =>
      !completedQuests.includes(quest.id) &&
      !activeQuests.some((aq) => aq.questId === quest.id) &&
      (!quest.requirements?.level || (hero.level || 1) >= quest.requirements.level) &&
      !(quest.id === ELVEN_MYSTIC_FIRST_PROF_QUEST_ID && !isHeroElvenMysticBaseForFirstProfQuest(hero)) &&
      !(quest.id === ELVEN_FIGHTER_FIRST_PROF_QUEST_ID && !isHeroElvenFighterBaseForFirstProfQuest(hero))
  );

  // Функція для прийняття квесту
  const acceptQuest = (questId: string) => {
    const questDef = QUESTS.find((q) => q.id === questId);
    if (!questDef) return;

    const initProgress: Record<string, number> = { ...(questDef.progress || {}) };
    for (const kt of questDef.questKillTargets ?? []) {
      initProgress[kt.progressKey] = initProgress[kt.progressKey] ?? 0;
    }

    const newActiveQuests = [
      ...activeQuests,
      {
        questId,
        progress: initProgress,
      },
    ];

    updateHero({ activeQuests: newActiveQuests });
  };

  // Функція для завершення квесту
  const completeQuest = (questId: string) => {
    const questDef = QUESTS.find((q) => q.id === questId);
    if (!questDef) return;

    const hasDrops = questDef.questDrops && questDef.questDrops.length > 0;
    const hasKills = questDef.questKillTargets && questDef.questKillTargets.length > 0;
    if (!hasDrops && !hasKills) return;

    const aqEntry = activeQuests.find((a) => a.questId === questId);

    if (hasKills) {
      for (const kt of questDef.questKillTargets!) {
        if ((aqEntry?.progress?.[kt.progressKey] ?? 0) < kt.requiredCount) return;
      }
    }

    if (hasDrops) {
      const itemsToCheck: Record<string, number> = {};
      questDef.questDrops!.forEach((questDrop) => {
        if (!itemsToCheck[questDrop.itemId] || itemsToCheck[questDrop.itemId] < questDrop.requiredCount) {
          itemsToCheck[questDrop.itemId] = questDrop.requiredCount;
        }
      });
      let allCollected = true;
      Object.entries(itemsToCheck).forEach(([itemId, requiredCount]) => {
        const itemCount = countQuestTurnInInInventory(hero.inventory, itemId);
        if (itemCount < requiredCount) allCollected = false;
      });
      if (!allCollected) return;
    }

    let newInventory = [...(hero.inventory || [])];
    if (hasDrops) {
      const itemsToRemove: Record<string, number> = {};
      questDef.questDrops!.forEach((questDrop) => {
        if (!itemsToRemove[questDrop.itemId] || itemsToRemove[questDrop.itemId] < questDrop.requiredCount) {
          itemsToRemove[questDrop.itemId] = questDrop.requiredCount;
        }
      });
      for (const [itemId, requiredCount] of Object.entries(itemsToRemove)) {
        newInventory = removeQuestTurnInFromInventory(newInventory, itemId, requiredCount);
      }
    }

    const rewards = questDef.rewards || {};
    let newAdena = hero.adena || 0;
    if (rewards.adena) {
      newAdena += rewards.adena;
    }

    const addSilver = Math.max(0, Math.floor(Number(rewards.coins_silver ?? 0)));
    const newCoinsSilver = (hero.coins_silver ?? 0) + addSilver;

    let expPayload: { exp?: number } = {};
    if (rewards.exp && rewards.exp > 0) {
      const expEnabled = getGameSettings().expEnabled !== false;
      const add = expEnabled ? Math.round(rewards.exp * getPremiumMultiplier(hero)) : 0;
      expPayload = { exp: Math.floor(Number(hero.exp ?? 0)) + add };
    }

    let spPayload: { sp?: number } = {};
    if (rewards.sp != null && Number(rewards.sp) > 0) {
      spPayload = { sp: Math.floor(Number(hero.sp ?? 0)) + Math.floor(Number(rewards.sp)) };
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

    updateHero({
      activeQuests: newActiveQuests,
      completedQuests: newCompletedQuests,
      inventory: newInventory,
      adena: newAdena,
      ...(addSilver > 0 ? { coins_silver: newCoinsSilver } : {}),
      ...expPayload,
      ...spPayload,
    });
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

  const orphanActive = activeQuests.filter((aq) => !QUESTS.some((q) => q.id === aq.questId));
  const showLocationList =
    !selectedLocation && activeQuestsWithDetails.length === 0 && orphanActive.length === 0;

  const clearOrphanQuests = () => {
    const valid = activeQuests.filter((aq) => QUESTS.some((q) => q.id === aq.questId));
    updateHero({ activeQuests: valid });
  };

  return (
    <div className={isL2 ? "w-full text-[#d4c4a8] px-1 py-2" : "w-full text-[#f4e2b8] px-1 py-2"}>
      {!embedInQuestPage && (
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
            {selectedLocation
              ? `${selectedLocation} ${
                  QUESTS_BY_LOCATION[selectedLocation]?.[0]?.locationLevel
                    ? `(${QUESTS_BY_LOCATION[selectedLocation][0].locationLevel})`
                    : ""
                }`
              : "Мої Квести"}
          </div>
        </div>
      )}

      {embedInQuestPage && selectedLocation && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setSelectedLocation(null)}
            className={
              isL2 ? "text-[#8a7a60] text-xs hover:text-[#d4c4a8]" : "text-gray-400 text-xs hover:text-gray-300"
            }
          >
            ← Назад
          </button>
          <div
            className={
              isL2
                ? "text-[#e8c56e] text-xs border-b border-solid border-[#5c4a32]/45 pb-2 font-semibold flex-1"
                : "text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1"
            }
          >
            {selectedLocation}{" "}
            {QUESTS_BY_LOCATION[selectedLocation]?.[0]?.locationLevel
              ? `(${QUESTS_BY_LOCATION[selectedLocation][0].locationLevel})`
              : ""}
          </div>
        </div>
      )}

      {orphanActive.length > 0 && (
        <div
          className={
            isL2
              ? "mb-3 rounded-md border border-amber-900/50 bg-black/30 px-2 py-2 text-[11px] text-[#d4c4a8]"
              : "mb-3 rounded border border-amber-800/40 px-2 py-2 text-[11px] text-amber-100"
          }
        >
          <div className="font-semibold text-amber-200/90 mb-1">Застаріле завдання в журналі</div>
          <p className="text-[10px] opacity-90 mb-2">
            Активний квест не знайдено в поточній версії гри — приберіть запис, щоб знову бачити список локацій.
          </p>
          <button
            type="button"
            onClick={clearOrphanQuests}
            className={
              isL2
                ? "text-[10px] px-2 py-1 rounded border border-[#5c4a32]/70 text-[#e8c56e] hover:border-[#c7ad80]/45"
                : "text-[10px] px-2 py-1 rounded border border-amber-700/60 text-amber-200"
            }
          >
            Очистити
          </button>
        </div>
      )}

      {/* Список локацій (якщо немає активних квестів і локація не вибрана) */}
      {showLocationList && locations.length > 0 && (
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
                    <img src={questIconSrc(locationQuests[0])} alt="" className="w-4 h-4 object-contain shrink-0" />
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
              const aq = activeQuests.find((a) => a.questId === quest.id);
              const itemsOk =
                !quest.questDrops?.length ||
                (() => {
                  const itemsToCheck: Record<string, number> = {};
                  quest.questDrops!.forEach((qd) => {
                    if (!itemsToCheck[qd.itemId] || itemsToCheck[qd.itemId] < qd.requiredCount) {
                      itemsToCheck[qd.itemId] = qd.requiredCount;
                    }
                  });
                  return Object.entries(itemsToCheck).every(([itemId, req]) => {
                    return countQuestTurnInInInventory(hero.inventory, itemId) >= req;
                  });
                })();
              const killsOk =
                !quest.questKillTargets?.length ||
                quest.questKillTargets.every(
                  (kt) => (aq?.progress?.[kt.progressKey] ?? 0) >= kt.requiredCount
                );
              const canComplete = itemsOk && killsOk;

              return (
                <div key={quest.id} className={`${rowB} py-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <img src={questIconSrc(quest)} alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-green-400 text-xs font-semibold">{quest.name}</span>
                  </div>
                  <div className={isL2 ? "text-[#8a7a60] text-[11px] mb-2" : "text-gray-400 text-[11px] mb-2"}>
                    {quest.description}
                  </div>
                  {quest.resourceCraftHint ? (
                    <QuestResourceCraftCallout hint={quest.resourceCraftHint} navigate={navigate} isL2={isL2} />
                  ) : null}

                  {/* Прогрес */}
                  {quest.questDrops && (
                    <div
                      className={
                        isL2 ? "text-[#9d8265] text-[10px] mb-2" : "text-[#b8860b]/60 text-[10px] mb-2"
                      }
                    >
                      <div className="font-semibold mb-1">Прогрес:</div>
                      {(() => {
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
                          const itemCount = countQuestTurnInInInventory(hero.inventory, group.itemId);
                          const currentProgress = Math.min(itemCount, group.requiredCount);
                          const itemDef = itemsDB[group.itemId];
                          const labelCharcoal =
                            group.itemId === "quest_gludio_charcoal"
                              ? "Charcoal"
                              : itemDef?.name ||
                                group.itemId.replace(/^quest_/i, "").replace(/_token$/i, "").replace(/_/g, " ");
                          return (
                            <div key={group.itemId} className="ml-2">
                              {itemDef?.icon && (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <img
                                    src={itemDef.icon}
                                    alt=""
                                    className="w-4 h-4 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                  <span className="font-semibold">
                                    Принеси {group.requiredCount} {labelCharcoal}
                                  </span>
                                </div>
                              )}
                              {!itemDef?.icon && (
                                <div className="font-semibold mb-0.5">
                                  Принеси {group.requiredCount} {labelCharcoal}
                                </div>
                              )}
                              <span>
                                {currentProgress}/{group.requiredCount} · з {group.mobNames.join(", ")}
                              </span>
                              {currentProgress >= group.requiredCount ? (
                                <span className="text-green-400 ml-1">✓</span>
                              ) : null}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {quest.questKillTargets && quest.questKillTargets.length > 0 && (
                    <div
                      className={
                        isL2 ? "text-[#9d8265] text-[10px] mb-2" : "text-[#b8860b]/60 text-[10px] mb-2"
                      }
                    >
                      <div className="font-semibold mb-1">Убийства:</div>
                      {quest.questKillTargets.map((kt) => {
                        const cur = Math.min(
                          aq?.progress?.[kt.progressKey] ?? 0,
                          kt.requiredCount
                        );
                        const ok = cur >= kt.requiredCount;
                        return (
                          <div key={kt.progressKey} className="ml-2">
                            {kt.mobName}: {cur}/{kt.requiredCount}
                            {ok ? <span className="text-green-400 ml-1">✓</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Нагороди */}
                  {quest.rewards && (
                    <div className="text-[#ff8c00] text-[10px] mb-2 flex items-center gap-2">
                      <span className="font-semibold">Нагороди:</span>
                      {quest.rewards.exp && <span>EXP: {quest.rewards.exp.toLocaleString("ru-RU")} </span>}
                      {quest.rewards.sp != null && Number(quest.rewards.sp) > 0 && (
                        <span>SP: {Number(quest.rewards.sp).toLocaleString("ru-RU")} </span>
                      )}
                      {quest.rewards.adena && <span>Адена: {quest.rewards.adena.toLocaleString("ru-RU")} </span>}
                      {!!quest.rewards.coins_silver && quest.rewards.coins_silver > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="" className="w-3.5 h-3.5 object-contain" />
                          Серебряные монеты: {quest.rewards.coins_silver}
                        </span>
                      )}
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
                    <img src={questIconSrc(quest)} alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-green-400 text-xs font-semibold">{quest.name}</span>
                  </div>
                  <div className={isL2 ? "text-[#8a7a60] text-[11px] mb-2" : "text-gray-400 text-[11px] mb-2"}>
                    {quest.description}
                  </div>
                  {quest.resourceCraftHint ? (
                    <QuestResourceCraftCallout hint={quest.resourceCraftHint} navigate={navigate} isL2={isL2} />
                  ) : null}

                  {/* Детальна інформація про квестові предмети */}
                  {quest.questDrops && quest.questDrops.length > 0 && (
                    <div className={isL2 ? "text-[#8a7a60] text-[10px] mb-2" : "text-gray-400 text-[10px] mb-2"}>
                      {(() => {
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
                          const labelCharcoal =
                            group.itemId === "quest_gludio_charcoal"
                              ? "Charcoal"
                              : itemDef?.name ||
                                group.itemId.replace(/^quest_/i, "").replace(/_token$/i, "").replace(/_/g, " ");
                          return (
                            <div key={idx} className="ml-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {itemDef?.icon ? (
                                  <img
                                    src={itemDef.icon}
                                    alt=""
                                    className="w-4 h-4 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span className="font-semibold">
                                  Принеси {group.requiredCount} {labelCharcoal}
                                </span>
                              </div>
                              <span>з {group.mobNames.join(", ")}</span>
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
                        {quest.rewards.sp != null && Number(quest.rewards.sp) > 0 && (
                          <span>SP: {Number(quest.rewards.sp).toLocaleString("ru-RU")} </span>
                        )}
                        {quest.rewards.adena && <span>Адена: {quest.rewards.adena.toLocaleString("ru-RU")} </span>}
                        {!!quest.rewards.coins_silver && quest.rewards.coins_silver > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <img src="/items/drops/resources/etc_coins_silver_i00.png" alt="" className="w-3.5 h-3.5 object-contain" />
                            Серебряные монеты: {quest.rewards.coins_silver}
                          </span>
                        )}
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

