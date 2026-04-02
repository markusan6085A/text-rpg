import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { learnSkillLogic } from "../../state/heroStore/heroSkills";
import {
  getDefaultProfessionForKlass,
  getProfessionDefinition,
  normalizeProfessionId,
  ProfessionId,
} from "../../data/skills";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";
import { AdditionalSkills } from "../../data/skills/additional";
import { fixHeroProfession } from "../../utils/fixProfession";
import { showToast } from "../../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { useCharacterStore } from "../../state/characterStore";
import { postLearnAdditionalSkill } from "../../utils/api/characters";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";

interface AdditionalSkillsScreenProps {
  navigate: (path: string) => void;
  title?: string;
  emptyMessage?: string;
  selectProfessionTitle?: string;
  learnLabel?: string;
  backLabel?: string;
}

type SkillRow = {
  skill: any;
  currentLevel: number;
  nextLevel: number;
  requiredLevel: number;
  spCost: number;
  power: number | null;
  canLearn: boolean;
  luckyCoinCost?: number; // Для додаткових скілів
};

const DEFAULT_TITLE = "Дополнительные скилы — изучение дополнительных скилов";
const DEFAULT_EMPTY = "Навыков пока нет.";

export default function AdditionalSkillsScreen({
  navigate,
  title = DEFAULT_TITLE,
  emptyMessage = DEFAULT_EMPTY,
  selectProfessionTitle = "Выбор профессии",
  learnLabel = "Выучить",
  backLabel = "В город",
}: AdditionalSkillsScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const skillCardL2 =
    "space-y-2 rounded-md border border-[#5c4a32]/60 bg-gradient-to-b from-[#1a1610]/90 to-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-2.5";
  const skillCardClassic = "space-y-2 rounded-md border border-[#c7ad80]/25 bg-black/25 p-2.5";
  const statPanelL2 =
    "rounded-md border border-[#5c4a32]/55 bg-black/30 p-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]";
  const statPanelClassic = "rounded-md border border-white/20 bg-black/25 p-2.5";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-sm gap-2`
            : "w-full text-white flex items-center justify-center"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#e8c56e] rounded-full animate-spin shrink-0" />
        )}
        Загрузка...
      </div>
    );
  }

  const heroSp =
    typeof hero.sp === "number"
      ? hero.sp
      : typeof (hero as any).SP === "number"
      ? (hero as any).SP
      : 0;
  const heroLevel = hero.level ?? 1;
  const currentSkills = Array.isArray(hero.skills) ? hero.skills : [];

  // ВИПРАВЛЯЄМО ПРОФЕСІЮ ПЕРЕД ВИКОРИСТАННЯМ
  const fixedHero = fixHeroProfession(hero);
  if (fixedHero !== hero) {
    // Якщо професія була виправлена, оновлюємо героя
    updateHero({ profession: fixedHero.profession });
  }

  const defaultProfession = getDefaultProfessionForKlass(hero.klass, hero.race);
  if (!defaultProfession) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
            : "w-full text-white px-4 py-2"
        }
      >
        <div
          className={
            isL2
              ? "w-full max-w-[min(100%,28rem)] sm:max-w-xl mx-auto"
              : "w-full max-w-[min(100%,24rem)] mx-auto"
          }
        >
          <div className={isL2 ? "text-center text-[#8a7a60] text-sm" : "text-center text-gray-500 text-sm"}>{emptyMessage}</div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/city")}
              className={
                isL2
                  ? "text-sm text-[#c9a44c] cursor-pointer hover:text-[#e8c56e] py-1.5 px-3 rounded-md border border-[#5c4a32]/60 bg-gradient-to-b from-[#2a2419]/80 to-transparent hover:border-[#c7ad80]/40"
                  : "text-sm text-red-600 cursor-pointer hover:text-red-500 bg-transparent border-0"
              }
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Використовуємо виправлену професію або поточну
  const currentProfession = fixedHero.profession || hero.profession;
  const heroProfessionId =
    normalizeProfessionId(currentProfession as ProfessionId | string | null) ?? defaultProfession;

  // Отримуємо додаткові скіли (доступні для всіх рас і класів)
  const allAdditionalSkills = Object.values(AdditionalSkills);

  // Фільтруємо скіли: показуємо тільки ті, які ще НЕ вивчені
  // 🎯 Скіли відкриваються по рівню: показуємо тільки скіли з requiredLevel <= heroLevel
  const availableSkills = allAdditionalSkills
    .map((sk) => {
      const entry = currentSkills.find((hs: any) => hs.id === sk.id);
      const currentLevel = entry?.level ?? 0;
      
      // Якщо скіл вже вивчений (currentLevel > 0), не показуємо його
      if (currentLevel > 0) {
        return null;
      }

      // Знаходимо перший рівень скіла (для додаткових скілів зазвичай 1 рівень)
      const levels = [...(sk.levels || [])].sort((a, b) => a.level - b.level);
      const firstLevelDef = levels[0];
      if (!firstLevelDef) {
        return null;
      }

      const requiredLevel = firstLevelDef.requiredLevel ?? 1;
      
      // 🎯 Скіл відкривається тільки якщо рівень гравця >= requiredLevel
      if (heroLevel < requiredLevel) {
        return null; // Не показуємо скіли, які ще не відкрилися
      }
      
      const adenaCost = firstLevelDef.spCost ?? 0; // Використовуємо spCost як вартість аден
      const heroAdena = hero.adena ?? 0;
      const canLearn = heroLevel >= requiredLevel && heroAdena >= adenaCost;

      return {
        skill: sk,
        currentLevel: 0,
        nextLevel: firstLevelDef.level,
        requiredLevel,
        adenaCost,
        power: firstLevelDef.power ?? null,
        canLearn,
      };
    })
    .filter(Boolean) as (SkillRow & { adenaCost: number })[];

  const handleLearnSkill = async (skillId: number, adenaCost: number) => {
    const heroAdena = hero.adena ?? 0;
    if (heroAdena < adenaCost) {
      showToast(`Недостаточно аден! Нужно: ${adenaCost}, есть: ${heroAdena}`, "error");
      return;
    }

    const skillDef = allAdditionalSkills.find((s) => s.id === skillId);
    if (!skillDef) {
      showToast("Навык не найден.", "error");
      return;
    }

    const existing = currentSkills.find((s: any) => s.id === skillId);
    const currentLevel = existing?.level ?? 0;
    if (currentLevel > 0) {
      showToast("Навык уже изучен.", "error");
      return;
    }

    const sortedLevels = (skillDef.levels || []).sort((a, b) => a.level - b.level);
    const levelDef = sortedLevels[0];
    if (!levelDef) {
      showToast("Навык недоступен.", "error");
      return;
    }
    const heroLevel = hero.level || 1;
    if (heroLevel < (levelDef.requiredLevel ?? 1)) {
      showToast(`Недостаточный уровень героя! Требуется: ${levelDef.requiredLevel}, у вас: ${heroLevel}`, "error");
      return;
    }

    if (characterId) {
      try {
        await postLearnAdditionalSkill(characterId, { skillId });
        await loadHeroFromAPI();
        showToast("Навык изучен.", "success");
      } catch (e: any) {
        if (e?.message && (e.message.includes("revision_conflict") || e.message.includes("Character was modified"))) {
          console.warn("Ігноруємо revision conflict при вивченні скіла");
        } else {
          console.error(e);
        }
        showToast("Не удалось изучить навык на сервере.", "error");
      }
      return;
    }

    const skills = Array.isArray(hero.skills) ? [...hero.skills] : [];
    const nextLevel = levelDef.level;
    if (existing) {
      const skillIndex = skills.findIndex((s) => s.id === skillId);
      skills[skillIndex] = { ...existing, level: nextLevel };
    } else {
      skills.push({ id: skillId, level: nextLevel });
    }

    try {
      updateHero({
        skills,
        adena: heroAdena - adenaCost,
      });
    } catch (e: any) {
      if (e?.message && (e.message.includes("revision_conflict") || e.message.includes("Character was modified"))) {
        console.warn("Ігноруємо revision conflict при вивченні скіла");
      } else {
        console.error(e);
      }
    }
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-white px-4 py-2"
      }
    >
      <div
        className={
          isL2
            ? "w-full max-w-[min(100%,28rem)] sm:max-w-xl mx-auto"
            : "w-full max-w-[min(100%,24rem)] mx-auto"
        }
      >
        <div className="space-y-3">
          <header
            className={
              isL2
                ? "text-center pb-3 border-b border-[#5c4a32]/45"
                : "text-center pb-3 border-b border-white/15"
            }
          >
            <h1
              className={
                isL2
                  ? "text-[14px] sm:text-[15px] font-semibold text-[#e8c56e] tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
                  : "text-[13px] font-semibold text-[#dec28e]"
              }
            >
              {title}
            </h1>
          </header>

          <div
            className={`flex items-center justify-between text-[12px] ${
              isL2 ? `${statPanelL2} text-[#8a7a60]` : `${statPanelClassic} text-gray-500`
            }`}
          >
            <div>
              Класс:{" "}
              <span className={isL2 ? "text-[#c9a44c] font-semibold" : "text-[#87ceeb] font-semibold"}>{hero.klass}</span>
              <div className={isL2 ? "text-[#8a7a60] text-[11px] mt-0.5" : "text-gray-500 text-[11px] mt-0.5"}>
                Профессия:{" "}
                <span className={isL2 ? "text-[#d4786a] font-semibold" : "text-red-500 font-semibold"}>
                  {getProfessionDefinition(heroProfessionId)?.label || "—"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div>
                Адена:{" "}
                <span className={isL2 ? "text-[#e8c56e] font-semibold" : "text-[#daa520] font-semibold"}>
                  {hero.adena ?? 0}
                </span>
              </div>
              <div>
                Lv:{" "}
                <span className={isL2 ? "text-[#d4c4a8] font-semibold" : "text-[#e0e0e0] font-semibold"}>{heroLevel}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {availableSkills.length === 0 ? (
              <div
                className={
                  isL2 ? "text-sm text-[#8a7a60] py-2 text-center" : "text-sm text-[#c7ad80] py-2 text-center"
                }
              >
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-3">
                {availableSkills.map((row) => {
                  const { skill, requiredLevel, adenaCost, canLearn } = row;

                  // Отримуємо російський опис з description
                  const descriptionParts = skill.description?.split("\n\n") || [];
                  const russianDesc =
                    descriptionParts.length > 1 ? descriptionParts.slice(1).join("\n\n") : skill.description || "";

                  // Розділяємо опис та ефекти
                  const effectsIndex = russianDesc.indexOf("Эффекты:");
                  const descriptionText =
                    effectsIndex >= 0 ? russianDesc.substring(0, effectsIndex).trim() : russianDesc;
                  const effectsText =
                    effectsIndex >= 0 ? russianDesc.substring(effectsIndex).trim() : "";

                  return (
                    <div key={skill.id} className={isL2 ? skillCardL2 : skillCardClassic}>
                      <div className="flex items-start gap-3">
                        <img
                          src={skill.icon || "/skills/attack.jpg"}
                          alt={skill.name}
                          className={
                            isL2
                              ? "w-10 h-10 object-contain flex-shrink-0 rounded-[3px] border border-[#5c4a32]/40"
                              : "w-10 h-10 object-contain flex-shrink-0 rounded-[3px] border border-white/15"
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={
                              isL2
                                ? "text-[13px] text-[#e8dcc8] font-semibold"
                                : "text-[13px] text-blue-400 font-semibold"
                            }
                          >
                            {skill.name}
                          </div>
                          {descriptionText && (
                            <div
                              className={
                                isL2
                                  ? "text-[11px] text-[#8a7a60] mt-1 whitespace-pre-line"
                                  : "text-[11px] text-gray-400 mt-1 whitespace-pre-line"
                              }
                            >
                              {descriptionText}
                            </div>
                          )}
                          {effectsText && (
                            <div
                              className={
                                isL2
                                  ? "text-[11px] text-[#c45c5c] mt-1 whitespace-pre-line"
                                  : "text-[11px] text-red-400 mt-1 whitespace-pre-line"
                              }
                            >
                              {effectsText}
                            </div>
                          )}
                          <div className={isL2 ? "text-[11px] text-[#a89470] mt-1" : "text-[11px] text-[#c7ad80] mt-1"}>
                            Требуется уровень: {requiredLevel}
                          </div>
                          <div className={isL2 ? "text-[11px] text-[#c9a44c] mt-1" : "text-[11px] text-[#daa520] mt-1"}>
                            Стоимость: {adenaCost} адены
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLearnSkill(skill.id, adenaCost)}
                            disabled={!canLearn}
                            className={
                              canLearn
                                ? isL2
                                  ? "mt-2 w-full text-left py-2 text-[11px] font-medium rounded-md border border-[#5c4a32]/55 bg-gradient-to-b from-[#2e2619]/90 to-[#14110c]/80 text-[#7d9b7a] hover:border-[#7d9b7a]/45 hover:text-[#a8c4a4] transition-[border-color,color] duration-150"
                                  : "mt-2 w-full text-left py-2 text-[11px] border-t border-b text-green-500 hover:text-green-400 cursor-pointer border-green-500/30"
                                : isL2
                                  ? "mt-2 w-full text-left py-2 text-[11px] rounded-md border border-[#3d3428]/80 text-[#6a5c48] cursor-not-allowed"
                                  : "mt-2 w-full text-left py-2 text-[11px] border-t border-b text-gray-500 cursor-not-allowed border-white/30"
                            }
                          >
                            {learnLabel} за {adenaCost} адены
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/city")}
              className={
                isL2
                  ? "text-sm text-[#c9a44c] cursor-pointer hover:text-[#e8c56e] py-1.5 px-3 rounded-md border border-[#5c4a32]/60 bg-gradient-to-b from-[#2a2419]/80 to-transparent hover:border-[#c7ad80]/40"
                  : "text-sm text-red-600 cursor-pointer hover:text-red-500 bg-transparent border-0"
              }
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

