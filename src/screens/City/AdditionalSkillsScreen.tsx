import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { learnSkillLogic } from "../../state/heroStore/heroSkills";
import {
  getDefaultProfessionForKlass,
  getProfessionDefinition,
  normalizeProfessionId,
  ProfessionId,
} from "../../data/skills";
import { AdditionalSkills } from "../../data/skills/additional";
import { fixHeroProfession } from "../../utils/fixProfession";

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
  const learnSkill = useHeroStore((s) => s.learnSkill);
  const updateHero = useHeroStore((s) => s.updateHero);

  if (!hero) {
    return (
      <div className="w-full text-white flex items-center justify-center">
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
      <div className="w-full text-white px-4 py-2">
        <div className="w-full max-w-[360px] mx-auto">
          <div className="text-center text-gray-500 text-sm">{emptyMessage}</div>
          <div className="mt-4 flex justify-center">
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              {backLabel}
            </span>
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

  const handleLearnSkill = (skillId: number, adenaCost: number) => {
    const heroAdena = hero.adena ?? 0;
    if (heroAdena < adenaCost) {
      alert(`Недостаточно аден! Нужно: ${adenaCost}, есть: ${heroAdena}`);
      return;
    }

    // Для додаткових скілів використовуємо спрощену логіку (без перевірки SP)
    const skillDef = allAdditionalSkills.find((s) => s.id === skillId);
    if (!skillDef) {
      alert("Навык не найден.");
      return;
    }

    const skills = Array.isArray(hero.skills) ? [...hero.skills] : [];
    const existing = skills.find((s) => s.id === skillId);
    const currentLevel = existing?.level || 0;

    // Знаходимо перший рівень скіла
    const sortedLevels = (skillDef.levels || []).sort((a, b) => a.level - b.level);
    const levelDef = sortedLevels.find((l) => l.level > currentLevel) || sortedLevels[0];
    
    if (!levelDef) {
      alert("Навык уже изучен на максимальный уровень.");
      return;
    }

    const nextLevel = levelDef.level;
    const heroLevel = hero.level || 1;
    
    // Перевірка requiredLevel
    if (heroLevel < levelDef.requiredLevel) {
      alert(`Недостаточный уровень героя! Требуется: ${levelDef.requiredLevel}, у вас: ${heroLevel}`);
      return;
    }

    // Оновлюємо скіл
    if (existing) {
      const skillIndex = skills.findIndex((s) => s.id === skillId);
      skills[skillIndex] = { ...existing, level: nextLevel };
    } else {
      skills.push({ id: skillId, level: nextLevel });
    }

    // Оновлюємо героя: додаємо скіл та віднімаємо адену
    // CP бонуси додаються автоматично через пасивні ефекти (maxCp)
    updateHero({
      skills,
      adena: heroAdena - adenaCost,
    });
  };

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[12px] text-gray-500">
            <div>
              Класс: <span className="text-[#87ceeb] font-semibold">{hero.klass}</span>
              <div className="text-gray-500 text-[11px]">
                Профессия:{" "}
                <span className="text-red-500 font-semibold">
                  {getProfessionDefinition(heroProfessionId)?.label || "—"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div>
                Адена: <span className="text-[#daa520] font-semibold">{hero.adena ?? 0}</span>
              </div>
              <div>
                Lv: <span className="text-[#e0e0e0] font-semibold">{heroLevel}</span>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-2 text-sm text-[#dec28e]">
            <div className="text-[12px] text-green-500 font-semibold text-center">
              {title}
            </div>
            
            {availableSkills.length === 0 ? (
              <div className="text-sm text-[#c7ad80] mb-4 text-center">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-3">
                {availableSkills.map((row) => {
                  const { skill, requiredLevel, adenaCost, canLearn } = row;
                  
                  // Отримуємо російський опис з description
                  const descriptionParts = skill.description?.split("\n\n") || [];
                  const russianDesc = descriptionParts.length > 1 
                    ? descriptionParts.slice(1).join("\n\n")
                    : skill.description || "";
                  
                  // Розділяємо опис та ефекти
                  const effectsIndex = russianDesc.indexOf("Эффекты:");
                  const descriptionText = effectsIndex >= 0 
                    ? russianDesc.substring(0, effectsIndex).trim()
                    : russianDesc;
                  const effectsText = effectsIndex >= 0 
                    ? russianDesc.substring(effectsIndex).trim()
                    : "";
                  
                  return (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <img
                          src={skill.icon || "/skills/attack.jpg"}
                          alt={skill.name}
                          className="w-10 h-10 object-contain flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-blue-400 font-semibold">
                            {skill.name}
                          </div>
                          {descriptionText && (
                            <div className="text-[11px] text-gray-400 mt-1 whitespace-pre-line">
                              {descriptionText}
                            </div>
                          )}
                          {effectsText && (
                            <div className="text-[11px] text-red-400 mt-1 whitespace-pre-line">
                              {effectsText}
                            </div>
                          )}
                          <div className="text-[11px] text-[#c7ad80] mt-1">
                            Требуется уровень: {requiredLevel}
                          </div>
                          <div className="text-[11px] text-[#daa520] mt-1">
                            Стоимость: {adenaCost} адены
                          </div>
                          <button
                            onClick={() => handleLearnSkill(skill.id, adenaCost)}
                            disabled={!canLearn}
                            className={`mt-2 pt-2 pb-2 text-[11px] border-t border-b ${
                              canLearn
                                ? "text-green-500 hover:text-green-400 cursor-pointer border-green-500/30"
                                : "text-gray-500 cursor-not-allowed border-gray-500/30"
                            }`}
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
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              {backLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

