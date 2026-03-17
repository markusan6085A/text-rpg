import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { findSetForItem, formatSetStatsForDisplay } from "../../data/sets/armorSets";

/**
 * Отримує інформацію про сет для предмета
 */
export function getSetInfo(item: any): string | null {
  if (!item || !item.id) return null;
  
  const set = findSetForItem(item.id);
  if (!set) return null;

  // Нічого не показуємо — бонуси відключені
  if (!set.bonuses.fullSet && !set.bonuses.setStats && (!set.bonuses.partialSet || set.bonuses.partialSet.length === 0)) return null;

  let result = `Сет: ${set.name} [${set.grade}]\n\n`;
  
  // Список частин сету
  result += `Частини сету (${set.pieces.length}):\n`;
  set.pieces.forEach((piece, index) => {
    const itemDef = itemsDBWithStarter[piece.itemId] || itemsDB[piece.itemId];
    const itemName = itemDef?.name || piece.itemId;
    const isCurrentItem = piece.itemId === item.id;
    result += `${index + 1}. ${itemName}${isCurrentItem ? ' ←' : ''}\n`;
  });
  
  result += '\n';
  
  // Бонуси за повний сет
  if (set.bonuses.fullSet) {
    const bonuses = set.bonuses.fullSet;
    const bonusesList: string[] = [];

    if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
    if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
    if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
    if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. захист`);
    if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. захист`);
    if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
    if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
    if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
    if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
    if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
    if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
    if (bonuses.crit) {
      const critPercent = Math.round(bonuses.crit / 10);
      bonusesList.push(`+${critPercent}% Крит`);
    }
    if (bonuses.critRate) {
      bonusesList.push(`+${bonuses.critRate}% Крит`);
    }
    if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
    if (bonuses.critDamage) bonusesList.push(`+${bonuses.critDamage} Сила крита`);
    if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
    if (bonuses.skillCritPower) bonusesList.push(`+${bonuses.skillCritPower} Сила маг крита`);
    if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
    if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
    if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
    if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);

    bonusesList.push(...formatSetStatsForDisplay(set.bonuses.setStats));

      if (bonusesList.length > 0) {
      result += `Повний сет (${set.pieces.length} частин):\n`;
      result += bonusesList.join(', ') + '\n';
    }
  }

  // Бонуси за повний сет (тільки setStats, без fullSet)
  if (!set.bonuses.fullSet && set.bonuses.setStats) {
    const setStatsList = formatSetStatsForDisplay(set.bonuses.setStats);
    if (setStatsList.length > 0) {
      result += `Повний сет (${set.pieces.length} частин): ${setStatsList.join(", ")}\n`;
    }
  }
  
  // Бонуси за часткові сети
  if (set.bonuses.partialSet && set.bonuses.partialSet.length > 0) {
    result += '\n';
    set.bonuses.partialSet.forEach((partial) => {
      const bonuses = partial.bonuses;
      const bonusesList: string[] = [];

      if (bonuses.maxHp) bonusesList.push(`+${bonuses.maxHp} Max HP`);
      if (bonuses.maxMp) bonusesList.push(`+${bonuses.maxMp} Max MP`);
      if (bonuses.maxCp) bonusesList.push(`+${bonuses.maxCp} Max CP`);
      if (bonuses.pDef) bonusesList.push(`+${bonuses.pDef} Физ. захист`);
      if (bonuses.mDef) bonusesList.push(`+${bonuses.mDef} Маг. захист`);
      if (bonuses.hpRegen) bonusesList.push(`+${bonuses.hpRegen} Реген HP`);
      if (bonuses.mpRegen) bonusesList.push(`+${bonuses.mpRegen} Реген MP`);
      if (bonuses.attackSpeed) bonusesList.push(`+${bonuses.attackSpeed} Скорость атаки`);
      if (bonuses.castSpeed) bonusesList.push(`+${bonuses.castSpeed} Скорость каста`);
      if (bonuses.pAtk) bonusesList.push(`+${bonuses.pAtk} Физ. атака`);
      if (bonuses.mAtk) bonusesList.push(`+${bonuses.mAtk} Маг. атака`);
      if (bonuses.crit) {
        const critPercent = Math.round(bonuses.crit / 10);
        bonusesList.push(`+${critPercent}% Крит`);
      }
      if (bonuses.critRate) {
        bonusesList.push(`+${bonuses.critRate}% Крит`);
      }
      if (bonuses.critPower) bonusesList.push(`+${bonuses.critPower} Сила крита`);
      if (bonuses.critDamage) bonusesList.push(`+${bonuses.critDamage} Сила крита`);
      if (bonuses.skillCritRate) bonusesList.push(`+${bonuses.skillCritRate}% Шанс маг крита`);
      if (bonuses.skillCritPower) bonusesList.push(`+${bonuses.skillCritPower} Сила маг крита`);
      if (bonuses.pDefPercent) bonusesList.push(`+${bonuses.pDefPercent}% Физ. защ`);
      if (bonuses.mDefPercent) bonusesList.push(`+${bonuses.mDefPercent}% Маг. защ`);
      if (bonuses.maxHpPercent) bonusesList.push(`+${bonuses.maxHpPercent}% Max HP`);
      if (bonuses.accuracy) bonusesList.push(`+${bonuses.accuracy} Точність`);

      if (bonusesList.length > 0) {
        result += `Частковий сет (${partial.pieces} частин):\n`;
        result += bonusesList.join(', ') + '\n';
      }
    });
  }

  return result;
}

/**
 * Обчислює стати предмета з урахуванням заточки
 */
export function calculateEnchantedStats(item: any) {
  const enchantLevel = item.enchantLevel ?? 0;
  const itemDef = itemsDBWithStarter[item.id] || itemsDB[item.id];
  const isWeapon = itemDef?.kind === "weapon";
  const isArmor = itemDef && ["armor", "helmet", "boots", "gloves", "shield"].includes(itemDef.kind || "");
  
  const enchantMultiplier = enchantLevel > 0 ? (1 + (enchantLevel * 0.03)) : 1;
  const armorEnchantMultiplier = enchantLevel > 0 ? (1 + (enchantLevel * 0.02)) : 1;
  // Дроп з риби та інші предмети можуть не мати item.stats — беремо з itemsDB
  const stats = item.stats || itemDef?.stats || {};
  
  return {
    pAtk: stats.pAtk !== undefined 
      ? (isWeapon ? Math.round(stats.pAtk * enchantMultiplier) : stats.pAtk)
      : undefined,
    mAtk: stats.mAtk !== undefined
      ? (isWeapon ? Math.round(stats.mAtk * enchantMultiplier) : stats.mAtk)
      : undefined,
    pDef: stats.pDef !== undefined
      ? (isArmor ? Math.round(stats.pDef * armorEnchantMultiplier) : stats.pDef)
      : undefined,
    mDef: stats.mDef !== undefined
      ? (isArmor ? Math.round(stats.mDef * armorEnchantMultiplier) : stats.mDef)
      : undefined,
    enchantLevel,
    isWeapon,
    isArmor,
    enchantMultiplier,
    armorEnchantMultiplier,
    baseStats: stats,
  };
}

/** Опис ефектів LS кристала (для зброї з інвентаря або equipmentInserts) */
const LS_DESC: Record<string, (v: number) => string> = {
  luckyStrike: (v) => `Крит: +${v}%`,
  mCrit: (v) => `Маг. крит: +${v}%`,
  maxHpPercent: (v) => `Макс. HP: +${v}%`,
  focus: (v) => `Перезарядка скілів: -${v}%`,
  lifeSteal: (v) => `Відновлення HP від урону: ${v}%`,
  guidance: (v) => `Витрата MP скілів: -${v}%`,
  empower: (v) => `Урон скілів: +${v}%`,
  acumen: (v) => `Швидкість касту: +${v}%`,
  anger: (v) => `Сила крита: +${v}%`,
  magicParry: (v) => `Відбиття магії: ${v}%`,
  rskFocus: (v) => `Шанс не витратити MP: ${v}%`,
  rskEvasion: (v) => `Шанс уникнути атаку: ${v}%`,
  rskHaste: (v) => `Шанс миттєво відновити скіл: ${v}%`,
  backbiting: (v) => `Урон у спину: +${v}%`,
};

export function getLSDescriptionLines(itemOrInserts: object | null | undefined): string[] {
  if (!itemOrInserts) return [];
  const lines: string[] = [];
  const obj = itemOrInserts as Record<string, unknown>;
  for (const [key, fmt] of Object.entries(LS_DESC)) {
    const v = obj[key];
    if (v != null && typeof v === "number" && v > 0) {
      lines.push(fmt(v));
    }
  }
  return lines;
}
