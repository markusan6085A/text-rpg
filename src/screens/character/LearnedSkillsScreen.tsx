import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { getSkillsForProfession, normalizeProfessionId, getProfessionDefinition, getDefaultProfessionForKlass } from "../../data/skills";
import { getSkillDef, getSkillDefForBattle } from "../../state/battle/loadout";
import { fixHeroProfession } from "../../utils/fixProfession";
import { AdditionalSkills } from "../../data/skills/additional";

interface LearnedSkillsScreenProps {
  navigate: (path: string) => void;
}

export default function LearnedSkillsScreen({ navigate }: LearnedSkillsScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  if (!hero) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка персонажа...</div>
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
        description: skillDef.description,
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

  return (
    <div className="w-full text-white flex justify-center px-3 py-4">
      <div className="w-full max-w-[420px] space-y-4">
        {/* Заголовок */}
        <div className="text-center">
          <div className="text-lg font-semibold text-green-500 mb-2">Вивчені навички</div>
          <div className="text-sm text-gray-400">
            {hero.name} — {professionDisplay}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Всього вивчено: {skillsWithInfo.length}
          </div>
        </div>

        {/* Риска над кнопкою */}
        <div className="w-full h-px bg-gray-500"></div>

        {/* Кнопка назад */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/character")}
            className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            Назад до персонажа
          </button>
        </div>

        {/* Риска під кнопкою */}
        <div className="w-full h-px bg-gray-500"></div>

        {/* Список скілів по категоріях */}
        {Object.keys(skillsByCategory).length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Немає вивчених навичок
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="space-y-3">
                <div className={`text-sm font-semibold ${categoryColors[category] || "text-gray-400"}`}>
                  {categoryLabels[category] || category}
                </div>
                <div className="space-y-2">
                  {skills.map((skill) => {
                    // Розділяємо опис на англійську та російську частини
                    const descriptionParts = skill.description.split("\n\n");
                    // Беремо тільки російську частину (остання частина після \n\n)
                    let russianDescription = "";
                    if (descriptionParts.length > 1) {
                      // Якщо є \n\n, беремо частину після нього (російський переклад)
                      russianDescription = descriptionParts.slice(1).join("\n\n");
                    } else {
                      // Якщо немає \n\n, перевіряємо, чи текст містить кирилицю
                      const text = descriptionParts[0] || "";
                      const hasCyrillic = /[А-Яа-яЁё]/.test(text);
                      if (hasCyrillic) {
                        // Якщо є кирилиця, це вже російський текст
                        russianDescription = text;
                      } else {
                        // Якщо немає кирилиці, це англійський текст - не показуємо
                        russianDescription = "Переклад відсутній";
                      }
                    }
                    
                    const skillValues = formatSkillValues(skill.skillDef, skill.levelDef);
                    
                    // Спеціальна обробка для іконок
                    let iconSrc = skill.icon.startsWith("/") ? skill.icon : `/skills/${skill.icon}`;
                    // Спеціальна обробка для Light Armor Mastery (skill 227) для Rogue
                    if (skill.id === 227 && (skill.skillDef as any)?.code === "HF_0227") {
                      iconSrc = "/skills/skill0233.gif";
                    }
                    // Спеціальна обробка для Guts (skill 139) для OrcRaider
                    if (skill.id === 139 && (skill.skillDef as any)?.code === "OR_0139") {
                      iconSrc = "/skills/skill0139.gif";
                    }
                    // Для додаткових скілів іконка вже правильна (з /dopskills/)
                    // Не потрібно нічого змінювати
                    
                    return (
                      <div key={skill.id}>
                        <div className="flex items-start gap-2">
                          {/* Іконка скіла */}
                          <img
                            src={iconSrc}
                            alt={skill.name}
                            className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                            }}
                          />
                          {/* Опис скіла */}
                          <div className="flex-1">
                            <div className="text-xs text-gray-400 leading-relaxed">
                              {russianDescription}
                            </div>
                            {/* Значення скіла */}
                            {skillValues.length > 0 && (
                              <div className="text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                {skillValues.map((value, idx) => (
                                  <span key={idx}>{value}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Риска після опису скіла */}
                        <div className="w-full h-px bg-gray-500 mt-2"></div>
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

