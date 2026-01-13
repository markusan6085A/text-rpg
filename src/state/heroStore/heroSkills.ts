import { getSkillDef } from "../battle/loadout";
import type { Hero } from "../../types/Hero";

export function learnSkillLogic(hero: Hero, skillId: number): { success: boolean; updatedHero?: Hero } {
  // Отримуємо визначення скіла
  const skillDef = getSkillDef(skillId);
  if (!skillDef) {
    console.warn(`[learnSkill] Скіл з ID ${skillId} не знайдено`);
    return { success: false };
  }

  const skills = Array.isArray(hero.skills) ? [...hero.skills] : [];
  const existing = skills.find((s) => s.id === skillId);
  const currentLevel = existing?.level || 0;

  // Знаходимо наступний доступний рівень скіла (може бути не currentLevel + 1)
  const sortedLevels = (skillDef.levels || []).sort((a, b) => a.level - b.level);
  const levelDef = sortedLevels.find((l) => l.level > currentLevel);
  if (!levelDef) {
    console.warn(`[learnSkill] Немає наступного рівня для скіла ${skillId} (поточний рівень: ${currentLevel})`);
    return { success: false };
  }
  
  const nextLevel = levelDef.level;

  // Перевірка requiredLevel
  const heroLevel = hero.level || 1;
  if (heroLevel < levelDef.requiredLevel) {
    console.warn(`[learnSkill] Недостатній рівень героя: потрібно ${levelDef.requiredLevel}, має ${heroLevel}`);
    return { success: false };
  }

  // Перевірка SP
  const heroSp = hero.sp || 0;
  if (heroSp < levelDef.spCost) {
    console.warn(`[learnSkill] Недостатньо SP: потрібно ${levelDef.spCost}, має ${heroSp}`);
    return { success: false };
  }

  // Перевірка max level
  const maxLevel = skillDef.levels ? Math.max(...skillDef.levels.map((l) => l.level)) : 1;
  if (nextLevel > maxLevel) {
    console.warn(`[learnSkill] Максимальний рівень скіла досягнуто: ${maxLevel}`);
    return { success: false };
  }
  // Перевірка, чи nextLevel дійсно існує в списку рівнів (вже перевірено вище через levelDef, але для безпеки)
  if (!skillDef.levels?.some((l) => l.level === nextLevel)) {
    console.warn(`[learnSkill] Рівень ${nextLevel} не існує для скіла ${skillId}`);
    return { success: false };
  }

  // Оновлюємо скіл
  if (existing) {
    const skillIndex = skills.findIndex((s) => s.id === skillId);
    skills[skillIndex] = { ...existing, level: nextLevel };
  } else {
    skills.push({ id: skillId, level: nextLevel });
  }

  // Повертаємо оновленого героя
  const updatedHero: Hero = {
    ...hero,
    skills,
    sp: heroSp - levelDef.spCost,
  };

  return { success: true, updatedHero };
}

