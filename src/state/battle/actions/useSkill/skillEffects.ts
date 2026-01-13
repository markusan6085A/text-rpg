import type { SkillDefinition, SkillLevelDefinition } from "../../../../data/skills/types";
import { clampChance } from "./helpers";

/**
 * Обробка спеціальних ефектів скілів (stun, hold, sleep тощо)
 */

export type SkillEffectResult = {
  stun?: {
    duration: number; // тривалість в мілісекундах
    applied: boolean; // чи спрацював ефект
  };
  // Можна додати інші ефекти: hold, sleep, root, тощо
};

/**
 * Перевіряє та застосовує stun ефект зі скілу
 * @param skillDef - визначення скілу
 * @param levelDef - визначення рівня скілу
 * @returns результат обробки ефекту
 */
export function processSkillEffects(
  skillDef: SkillDefinition,
  levelDef: SkillLevelDefinition
): SkillEffectResult {
  const result: SkillEffectResult = {};

  // Перевіряємо чи скіл має stun ефект
  const stunEffect = skillDef.effects?.find(
    (eff: any) => eff.stat === "stunResist" || eff.stat === "stun"
  );

  if (stunEffect) {
    // Отримуємо chance з ефекту або зі скілу
    const baseChance = stunEffect.chance ?? skillDef.chance ?? 100;
    const chance = clampChance(baseChance);

    // Перевіряємо чи спрацював ефект
    const applied = Math.random() * 100 < chance;

    // Отримуємо тривалість з ефекту (в секундах), за замовчуванням 5 секунд
    const durationSeconds = stunEffect.duration ?? 5;
    const durationMs = durationSeconds * 1000;

    result.stun = {
      duration: durationMs,
      applied,
    };
  }

  return result;
}

/**
 * Перевіряє чи моб зараз оглушений
 * @param mobStunnedUntil - timestamp до якого моб оглушений
 * @param now - поточний timestamp
 * @returns true якщо моб оглушений
 */
export function isMobStunned(mobStunnedUntil: number | undefined, now: number): boolean {
  if (!mobStunnedUntil) return false;
  return now < mobStunnedUntil;
}

