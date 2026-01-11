import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";

/**
 * Обробляє Battle Roar (skill 121) - збільшує maxHp на +10% і одразу відновлює +10% HP
 */
export function handleBattleRoar(
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  curMaxHp: number
): { hpChange: number; log: string } {
  if (def.id !== 121 || def.category !== "buff") {
    return { hpChange: 0, log: "" };
  }
  
  const healPercent = levelDef.power ?? 10; // 10% від поточного maxHp
  const instantHeal = Math.round(curMaxHp * (healPercent / 100));
  
  return {
    hpChange: instantHeal,
    log: `${def.name}: +10% maxHp, +${instantHeal} HP`,
  };
}

/**
 * Обробляє Body To Mind (skill 1157) - віднімає HP і додає MP
 */
export function handleBodyToMind(
  def: SkillDefinition,
  levelDef: SkillLevelDefinition,
  curHeroHP: number
): { hpChange: number; mpChange: number; log: string; canCast: boolean } {
  if (def.id !== 1157 || def.category !== "special") {
    return { hpChange: 0, mpChange: 0, log: "", canCast: true };
  }
  
  const hpConsumeValues = [131, 209, 280, 318, 366];
  const mpRestoreValues = [22.0, 35.0, 47.0, 53.0, 61.0];
  const levelIndex = levelDef.level - 1;
  const hpConsume = hpConsumeValues[levelIndex] ?? 0;
  const mpRestore = Math.round(mpRestoreValues[levelIndex] ?? 0);
  
  // Перевіряємо, чи достатньо HP
  if (curHeroHP <= hpConsume) {
    return {
      hpChange: 0,
      mpChange: 0,
      log: `${def.name}: недостаточно HP (требуется ${hpConsume})`,
      canCast: false,
    };
  }
  
  return {
    hpChange: -hpConsume,
    mpChange: mpRestore,
    log: `${def.name}: -${hpConsume} HP, +${mpRestore} MP`,
    canCast: true,
  };
}

/**
 * Обробляє інші special скіли
 */
export function handleOtherSpecialSkill(def: SkillDefinition): string {
  if (def.category === "special" && def.id !== 1157) {
    return `${def.name} effect applied`;
  }
  return "";
}

