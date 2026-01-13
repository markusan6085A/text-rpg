// src/utils/mobs/calcMobStats.ts
/**
 * Обчислює стати мобів на основі рівня та HP
 * Стати обчислюються нормально, потім множаться на 2 для HP, pAtk, mAtk, pDef, mDef
 */

export interface MobStats {
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  mp: number;
  sp: number;
}

/**
 * Обчислює стати для фізичного моба (базові значення, потім множаться на 2)
 */
export function calcPhysicalMobStats(level: number, hp: number): MobStats {
  // Базові значення (як було раніше)
  const basePAtk = Math.round(level * 10);
  const basePDef = Math.round(level * 4 + hp * 0.075);
  const baseMDef = Math.round(level * 4 + hp * 0.06);
  
  // Множимо на 2 тільки урон і захист
  return {
    pAtk: basePAtk * 2,
    mAtk: 0,
    pDef: basePDef * 2,
    mDef: baseMDef * 2,
    mp: 0,
    sp: Math.round(level * 2), // SP за рівень
  };
}

/**
 * Обчислює стати для магічного моба (базові значення, потім множаться на 2)
 */
export function calcMagicMobStats(level: number, hp: number): MobStats {
  // Базові значення
  const basePAtk = Math.round(level * 6);
  const baseMAtk = Math.round(level * 10);
  const basePDef = Math.round(level * 3 + hp * 0.06);
  const baseMDef = Math.round(level * 5 + hp * 0.075);
  
  // Множимо на 2 тільки урон і захист
  return {
    pAtk: basePAtk * 2,
    mAtk: baseMAtk * 2,
    pDef: basePDef * 2,
    mDef: baseMDef * 2,
    mp: Math.round(level * 20), // MP не множимо
    sp: Math.round(level * 2), // SP за рівень
  };
}

/**
 * Визначає чи моб магічний на основі назви
 */
export function isMagicMob(name: string): boolean {
  const magicKeywords = [
    "magus", "shaman", "mystic", "wizard", "sorcerer", "mage",
    "necromancer", "spell", "magic", "cursed", "possessed"
  ];
  const lowerName = name.toLowerCase();
  return magicKeywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Автоматично обчислює стати для моба на основі його назви
 */
export function calcMobStats(level: number, hp: number, name: string): MobStats {
  if (isMagicMob(name)) {
    return calcMagicMobStats(level, hp);
  }
  return calcPhysicalMobStats(level, hp);
}

