import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { getSkillsForProfession, normalizeProfessionId, getProfessionDefinition, getDefaultProfessionForKlass } from "../../data/skills";
import { getSkillDef, getSkillDefForBattle } from "../../state/battle/loadout";
import { fixHeroProfession } from "../../utils/fixProfession";
import { AdditionalSkills } from "../../data/skills/additional";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { buildSkillIconCandidates } from "../../utils/skillIconUrls";

interface LearnedSkillsScreenProps {
  navigate: (path: string) => void;
}

function LearnedSkillIcon({
  skillId,
  name,
  declared,
}: {
  skillId: number;
  name: string;
  /** Шлях з SkillDefinition.icon */
  declared?: string | null;
}) {
  const candidates = React.useMemo(() => buildSkillIconCandidates(skillId, declared), [skillId, declared]);
  const [idx, setIdx] = React.useState(0);
  const [givenUp, setGivenUp] = React.useState(false);
  const src = candidates[idx] ?? "";

  if (givenUp || !src) {
    return <span className="w-5 h-5 shrink-0 inline-block" aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
      onError={() => {
        setIdx((i) => {
          const next = i + 1;
          if (next < candidates.length) return next;
          setGivenUp(true);
          return i;
        });
      }}
    />
  );
}

export default function LearnedSkillsScreen({ navigate }: LearnedSkillsScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const skillCardL2 =
    "rounded-md border border-[#5c4a32]/65 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] px-2.5 py-2 mb-2";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex justify-center px-3 py-10 text-[#8a7a60]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px] flex items-center justify-center gap-2 text-sm">
          {isL2 && (
            <span className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
          )}
          <span className={isL2 ? "text-[#d4c4a8]" : "text-center text-[#dec28e]"}>Загрузка персонажа...</span>
        </div>
      </div>
    );
  }

  // Виправляємо професію
  const fixedHero = fixHeroProfession(hero);
  if (fixedHero !== hero) {
    updateHero({ profession: fixedHero.profession });
  }

  const effectiveProfession = fixedHero.profession || getDefaultProfessionForKlass(fixedHero.klass, fixedHero.race);
  const normalizedProfession = normalizeProfessionId(effectiveProfession || "");
  const allSkillsForProfession = getSkillsForProfession(normalizedProfession);
  const learnedSkills = Array.isArray(hero.skills) ? hero.skills : [];
  
  // Отримуємо читабельну назву професії (як в Character.tsx)
  const profDef = normalizedProfession ? getProfessionDefinition(normalizedProfession) : null;
  const professionDisplay = profDef?.label || normalizedProfession || "Нет";

  // Створюємо Set з ID скілів професії для швидкої перевірки
  const professionSkillIds = new Set(
    Array.isArray(allSkillsForProfession) 
      ? allSkillsForProfession.map((s: any) => s.id)
      : Object.keys(allSkillsForProfession).map(Number)
  );
  
  // Додаємо ID додаткових скілів (Additional Skills) - вони доступні для всіх
  const additionalSkillIds = new Set(
    Object.values(AdditionalSkills).map((s: any) => s.id)
  );

  // Функція для форматування значень скіла
  const formatSkillValues = (skillDef: any, levelDef: any) => {
    const parts: string[] = [];
    
    // Для атак показуємо урон
    if ((skillDef.category === "physical_attack" || skillDef.category === "magic_attack") && levelDef?.power) {
      parts.push(`Урон: ${levelDef.power}`);
    }
    
    // Для лікування показуємо силу
    if (skillDef.category === "heal" && levelDef?.power) {
      parts.push(`Лікування: ${levelDef.power}`);
    }
    
    // Для бафів, пасивних, toggle показуємо ефекти
    if (skillDef.effects && Array.isArray(skillDef.effects) && skillDef.effects.length > 0) {
      const effectParts = skillDef.effects.map((eff: any) => {
        // Для multiplier режиму використовуємо eff.multiplier напряму
        let val: number;
        if (eff.mode === "multiplier") {
          val = typeof eff.multiplier === "number" ? eff.multiplier : 1;
        } else {
          // Для інших режимів використовуємо value або power
          const base = typeof eff.value === "number" 
            ? eff.value 
            : (typeof levelDef?.power === "number" ? levelDef.power : 0);
          val = base * (eff.multiplier ?? 1);
        }
        
        // Назви статів українською
        const statNames: Record<string, string> = {
          pAtk: "Физ. атака",
          pDef: "Физ. защита",
          mAtk: "Маг. атака",
          mDef: "Маг. защита",
          maxHp: "Макс. HP",
          maxMp: "Макс. MP",
          maxCp: "Макс. CP",
          critRate: "Шанс крита",
          critDamage: "Сила крита",
          accuracy: "Точность",
          evasion: "Уклонение",
          attackSpeed: "Скорость атаки",
          atkSpeed: "Скорость атаки",
          castSpeed: "Скорость каста",
          runSpeed: "Скорость бега",
          hpRegen: "Реген HP",
          mpRegen: "Реген MP",
          cpRegen: "Реген CP",
          attackRange: "Дальность",
          cooldownReduction: "Сокращение КД",
        };
        
        const statName = statNames[eff.stat] || eff.stat;
        const mode = eff.mode === "percent" ? "%" : eff.mode === "multiplier" ? "x" : "";
        
        return `${statName}: ${val}${mode}`;
      });
      
      parts.push(...effectParts);
    } else if (levelDef?.power && (skillDef.category === "buff" || skillDef.category === "passive" || skillDef.category === "toggle")) {
      // Якщо немає ефектів, але є power, показуємо його
      const powerType = skillDef.powerType === "percent" ? "%" : skillDef.powerType === "multiplier" ? "x" : "";
      parts.push(`Эффект: ${levelDef.power}${powerType}`);
    }
    
    // Додаємо технічні параметри
    if (levelDef?.mpCost > 0) {
      parts.push(`MP: ${levelDef.mpCost}`);
    }
    if (skillDef.castTime) {
      parts.push(`Каст: ${skillDef.castTime}с`);
    }
    if (skillDef.cooldown) {
      parts.push(`КД: ${skillDef.cooldown}с`);
    }
    if (skillDef.duration) {
      const minutes = Math.floor(skillDef.duration / 60);
      const seconds = skillDef.duration % 60;
      if (minutes > 0) {
        parts.push(`Длит.: ${minutes}м ${seconds}с`);
      } else {
        parts.push(`Длит.: ${seconds}с`);
      }
    }
    
    return parts;
  };

  // Отримуємо вивчені скіли з повною інформацією — getSkillDefForBattle для професійної версії (Chant of Life vs Wild Magic)
  const skillsWithInfo = learnedSkills
    .map((learned: any) => {
      const skillDef = getSkillDefForBattle(
        effectiveProfession,
        fixedHero.klass,
        fixedHero.race,
        learned.id
      ) ?? getSkillDef(learned.id);
      if (!skillDef) return null;

      // Перевіряємо, чи скіл належить поточній професії або є додатковим скілом
      const isProfessionSkill = professionSkillIds.has(learned.id);
      const isAdditionalSkill = additionalSkillIds.has(learned.id);
      
      if (!isProfessionSkill && !isAdditionalSkill) return null;

      const levelDef = skillDef.levels.find((l) => l.level === learned.level) ?? skillDef.levels[0];
      
      return {
        id: learned.id,
        name: skillDef.name,
        description: skillDef.description ?? "",
        icon: skillDef.icon,
        category: skillDef.category || "none",
        level: learned.level,
        maxLevel: skillDef.levels.length,
        castTime: skillDef.castTime,
        cooldown: skillDef.cooldown,
        duration: skillDef.duration,
        mpCost: levelDef?.mpCost ?? 0,
        power: levelDef?.power ?? 0,
        skillDef, // Додаємо повний skillDef для форматування
        levelDef, // Додаємо levelDef для форматування
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Групуємо по категоріях
  const skillsByCategory: Record<string, typeof skillsWithInfo> = {};
  skillsWithInfo.forEach((skill) => {
    const category = skill.category || "none";
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skill);
  });

  const categoryLabels: Record<string, string> = {
    physical_attack: "Фізичні атаки",
    magic_attack: "Магічні атаки",
    heal: "Лікування",
    buff: "Бафи",
    passive: "Пасивні",
    toggle: "Перемикачі",
    debuff: "Дебафи",
    special: "Спеціальні",
    none: "Інші",
  };

  const categoryColors: Record<string, string> = {
    physical_attack: "text-red-500",
    magic_attack: "text-gray-400",
    heal: "text-yellow-300",
    buff: "text-green-500",
    passive: "text-blue-800",
    toggle: "text-gray-400",
    debuff: "text-gray-400",
    special: "text-blue-300",
    none: "text-gray-400",
  };
  const categoryColorsL2: Record<string, string> = {
    physical_attack: "text-red-400",
    magic_attack: "text-[#a89878]",
    heal: "text-[#f0d78c]",
    buff: "text-[#7d9b7a]",
    passive: "text-[#9d8265]",
    toggle: "text-[#a89878]",
    debuff: "text-[#a89878]",
    special: "text-[#c9a44c]",
    none: "text-[#8a7a60]",
  };
  const catColor = (c: string) => (isL2 ? categoryColorsL2[c] : categoryColors[c]) || (isL2 ? "text-[#8a7a60]" : "text-gray-400");

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 flex justify-center px-3 py-3 text-[#e8dcc8]`
          : "w-full text-white flex justify-center px-3 py-4"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] space-y-4 mx-auto" : "w-full max-w-[420px] space-y-4"}>
        <div className="text-center">
          <div
            className={
              isL2
                ? "text-lg font-semibold text-[#e8c56e] mb-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                : "text-lg font-semibold text-green-500 mb-2"
            }
          >
            Вивчені навички
          </div>
          <div className={isL2 ? "text-sm text-[#d4c4a8]" : "text-sm text-gray-400"}>
            {hero.name} — {professionDisplay}
          </div>
          <div className={isL2 ? "text-xs text-[#8a7a60] mt-1" : "text-xs text-gray-400 mt-1"}>
            Всього вивчено: {skillsWithInfo.length}
          </div>
        </div>

        <div
          className={
            isL2 ? "w-full h-px bg-[#5c4a32]/50" : "w-full h-px bg-gray-500"
          }
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/character")}
            className={
              isL2
                ? "text-sm text-[#c9a44c] hover:text-[#f4e2b8] px-4 py-2 rounded-md border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 transition-[border-color,color] duration-150"
                : "text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
            }
          >
            Назад до персонажа
          </button>
        </div>

        <div
          className={
            isL2 ? "w-full h-px bg-[#5c4a32]/50" : "w-full h-px bg-gray-500"
          }
        />

        {/* Список скілів по категоріях */}
        {Object.keys(skillsByCategory).length === 0 ? (
          <div
            className={
              isL2
                ? "text-center text-[#8a7a60] py-8 rounded-lg border border-[#5c4a32]/35 bg-black/15"
                : "text-center text-gray-400 py-8"
            }
          >
            Немає вивчених навичок
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="space-y-3">
                <div className={`text-sm font-semibold ${catColor(category)}`}>
                  {categoryLabels[category] || category}
                </div>
                <div className="space-y-2">
                  {skills.map((skill) => {
                    const descriptionParts = (skill.description || "").split("\n\n");
                    let russianDescription = "";
                    if (descriptionParts.length > 1) {
                      russianDescription = descriptionParts.slice(1).join("\n\n");
                    } else {
                      // Без подвійного переносу показуємо весь опис (англ. або одна мова) — не підміняти «Переклад відсутній»
                      russianDescription = descriptionParts[0] || "";
                    }
                    
                    const skillValues = formatSkillValues(skill.skillDef, skill.levelDef);

                    let iconDeclared = skill.icon && String(skill.icon).trim().length > 0 ? String(skill.icon).trim() : undefined;
                    if (skill.id === 227 && (skill.skillDef as any)?.code === "HF_0227") {
                      iconDeclared = "/skills/skill0233.gif";
                    }
                    if (skill.id === 139 && (skill.skillDef as any)?.code === "OR_0139") {
                      iconDeclared = "/skills/skill0139.gif";
                    }

                    return (
                      <div
                        key={skill.id}
                        className={isL2 ? skillCardL2 : ""}
                      >
                        <div className="flex items-start gap-2">
                          <LearnedSkillIcon skillId={skill.id} name={skill.name} declared={iconDeclared} />
                          <div className="flex-1 min-w-0">
                            <div
                              className={
                                isL2
                                  ? "text-xs text-[#d4c4a8] leading-relaxed"
                                  : "text-xs text-gray-400 leading-relaxed"
                              }
                            >
                              {russianDescription}
                            </div>
                            {skillValues.length > 0 && (
                              <div
                                className={
                                  isL2
                                    ? "text-xs text-[#7d9b7a] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5"
                                    : "text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5"
                                }
                              >
                                {skillValues.map((value, idx) => (
                                  <span key={idx}>{value}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {!isL2 && <div className="w-full h-px bg-gray-500 mt-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

