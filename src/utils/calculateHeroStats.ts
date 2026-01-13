import { getSkillDef } from "../state/battle/loadout";
import { applyBuffsToStats } from "../state/battle/helpers";
import type { BattleBuff } from "../state/battle/types";
import { applySkillEffect } from "../data/skills/applySkillEffect";
import type { SkillHero } from "../data/skills/applySkillEffect";

/**
 * Обчислює стати героя з урахуванням пасивних скілів та бафів
 */
export function calculateHeroStatsWithPassives(
  hero: any,
  buffs: BattleBuff[] = []
) {
  const baseStats = hero.battleStats || {};
  const learnedSkills = Array.isArray(hero.skills) ? hero.skills : [];

  // Створюємо об'єкт для застосування пасивних скілів
  let statsWithPassives = { ...baseStats };

  // Застосовуємо пасивні скіли через applySkillEffect для правильного застосування
  learnedSkills.forEach((learned: any) => {
    const skillDef = getSkillDef(learned.id);
    if (!skillDef || skillDef.category !== "passive") return;

    const levelDef = skillDef.levels.find((l) => l.level === learned.level) ?? skillDef.levels[0];
    if (!levelDef) return;

    // Створюємо тимчасовий об'єкт SkillHero для застосування скілу
    const tempHero: SkillHero = {
      ...statsWithPassives,
      pAtk: statsWithPassives.pAtk ?? 0,
      pDef: statsWithPassives.pDef ?? 0,
      mAtk: statsWithPassives.mAtk ?? 0,
      mDef: statsWithPassives.mDef ?? 0,
      maxHp: statsWithPassives.maxHp ?? 1,
      maxMp: statsWithPassives.maxMp ?? 1,
      critRate: statsWithPassives.crit ?? 0,
    };

    // ❌ DEPRECATED: Ця функція використовує стару систему
    // Використовуйте recalculateAllStats замість цієї функції
    // applySkillEffect більше не обробляє пасивні скіли (вони йдуть через recalculateAllStats)
    applySkillEffect(tempHero, [tempHero], skillDef, levelDef);
    
    // Оновлюємо стати з tempHero
    Object.keys(tempHero).forEach((key) => {
      if (key !== "hp" && key !== "mp" && key !== "cp" && key !== "critRate") {
        const value = (tempHero as any)[key];
        if (value !== undefined && typeof value === "number") {
          // Округлюємо до 1 знака після коми для бойових статів
          if (key === "pAtk" || key === "mAtk" || key === "pDef" || key === "mDef") {
            statsWithPassives[key] = Math.round(value * 10) / 10;
          } else {
            statsWithPassives[key] = value;
          }
        }
      }
    });
  });

  // Застосовуємо бафи
  const statsWithBuffs = applyBuffsToStats(statsWithPassives, buffs);

  return statsWithBuffs;
}

/**
 * Обчислює maxHp, maxMp, maxCp з урахуванням пасивних скілів та бафів
 */
export function calculateMaxResourcesWithPassives(
  hero: any,
  buffs: BattleBuff[] = []
) {
  const baseMaxHp = hero.maxHp ?? hero.hp ?? 1;
  const baseMaxMp = hero.maxMp ?? hero.mp ?? 1;
  const baseMaxCp = hero.maxCp ?? hero.cp ?? Math.round(baseMaxHp * 0.6);

  const learnedSkills = Array.isArray(hero.skills) ? hero.skills : [];

  let maxHp = baseMaxHp;
  let maxMp = baseMaxMp;
  let maxCp = baseMaxCp;

  // Застосовуємо пасивні скіли для maxHp/maxMp через applySkillEffect
  learnedSkills.forEach((learned: any) => {
    const skillDef = getSkillDef(learned.id);
    if (!skillDef || skillDef.category !== "passive") return;

    const levelDef = skillDef.levels.find((l) => l.level === learned.level) ?? skillDef.levels[0];
    if (!levelDef) return;

    // Створюємо тимчасовий об'єкт SkillHero для застосування скілу
    const tempHero: SkillHero = {
      pAtk: 0,
      pDef: 0,
      mAtk: 0,
      mDef: 0,
      maxHp,
      maxMp,
      maxCp,
      critRate: 0,
    };

    // ❌ DEPRECATED: Ця функція використовує стару систему
    // Використовуйте recalculateAllStats замість цієї функції
    // applySkillEffect більше не обробляє пасивні скіли (вони йдуть через recalculateAllStats)
    const result = applySkillEffect(tempHero, [tempHero], skillDef, levelDef);
    
    // Оновлюємо maxHp/maxMp/maxCp з tempHero
    if (tempHero.maxHp !== undefined) maxHp = Math.round(tempHero.maxHp);
    if (tempHero.maxMp !== undefined) maxMp = Math.round(tempHero.maxMp);
    if (tempHero.maxCp !== undefined) maxCp = Math.round(tempHero.maxCp);
  });

  // Застосовуємо бафи для maxHp/maxMp
  const buffed = applyBuffsToStats({ maxHp, maxMp, maxCp }, buffs);

  return {
    maxHp: Math.max(1, Math.round(buffed.maxHp ?? maxHp)),
    maxMp: Math.max(1, Math.round(buffed.maxMp ?? maxMp)),
    maxCp: Math.max(1, Math.round(buffed.maxCp ?? maxCp)),
  };
}

