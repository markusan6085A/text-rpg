import type { BattleState } from "../../types";
import type { Hero } from "../../../../types/Hero";
import { hasShieldEquipped } from "../../../../utils/shield/shieldDefense";

/**
 * Перевіряє, чи має герой активний баф "Physical Mirror" та повертає шанси відбиття
 * Працює тільки якщо надітий щит
 */
export function getReflectChances(
  heroBuffs: BattleState["heroBuffs"],
  hero: Hero | null,
  now: number
): { physical: number; magic: number } {
  // Перевіряємо, чи надітий щит (скіл працює тільки з щитом)
  if (!hasShieldEquipped(hero)) {
    return { physical: 0, magic: 0 };
  }

  // Шукаємо активний баф Physical Mirror (ID 350)
  const physicalMirrorBuff = heroBuffs?.find((b) => b.id === 350 && (!b.expiresAt || b.expiresAt > now));
  
  if (!physicalMirrorBuff) {
    return { physical: 0, magic: 0 };
  }

  // Отримуємо значення reflectSkillPhysic та reflectSkillMagic з ефектів бафу
  let physicalChance = 0;
  let magicChance = 0;

  physicalMirrorBuff.effects?.forEach((eff: any) => {
    if (eff.stat === "reflectSkillPhysic") {
      physicalChance = eff.value ?? 0;
    } else if (eff.stat === "reflectSkillMagic") {
      magicChance = eff.value ?? 0;
    }
  });

  return {
    physical: Math.max(0, Math.min(100, physicalChance)),
    magic: Math.max(0, Math.min(100, magicChance)),
  };
}

/**
 * Перевіряє, чи спрацювало відбиття урону, та повертає інформацію про відбиття
 */
export function checkReflectDamage(
  damage: number,
  isPhysical: boolean,
  reflectChances: { physical: number; magic: number }
): { reflected: boolean; reflectedDamage: number } {
  const chance = isPhysical ? reflectChances.physical : reflectChances.magic;
  
  if (chance <= 0) {
    return { reflected: false, reflectedDamage: 0 };
  }

  // Перевіряємо шанс відбиття
  const roll = Math.random() * 100;
  const reflected = roll < chance;

  if (reflected) {
    // Відбитий урон = оригінальний урон (повністю відбивається назад на атакуючого)
    return { reflected: true, reflectedDamage: damage };
  }

  return { reflected: false, reflectedDamage: 0 };
}

