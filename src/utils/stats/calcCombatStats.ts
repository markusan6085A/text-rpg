/**
 * Обчислює бойові стати героя (pAtk, mAtk, pDef, mDef, тощо)
 * Порядок: baseStats -> level scaling -> equipment bonuses -> set bonuses
 */
import type { HeroBaseStats } from "../../state/heroFactory";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { getActiveSetBonuses } from "../../data/sets/armorSets";

export interface CombatStats {
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  accuracy: number;
  evasion: number;
  crit: number;
  mCrit: number;
  critPower: number;
  attackSpeed: number;
  castSpeed: number;
  hpRegen: number;
  mpRegen: number;
  cpRegen: number;
  shieldBlockRate?: number; // Shield block rate (from skills like Shield Fortress)
  shieldBlockPower?: number; // Shield block power (from skills like Aegis Stance)
}

export function calcCombatStats(
  baseStats: HeroBaseStats,
  level: number,
  equipment?: Record<string, string | null>,
  equipmentEnchantLevels?: Record<string, number>,
  activeDyes?: Array<{
    id: string;
    statPlus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    statMinus: "STR" | "CON" | "DEX" | "INT" | "MEN" | "WIT";
    effect: number;
    grade: "D" | "C" | "B" | "A" | "S";
  }>
): CombatStats {
  const lvl = Math.max(1, level);
  
  // 1. Level scaling (базові значення з урахуванням рівня)
  // Множник рівня зменшено: на 1 рівні = 1.0, на 80 рівні ≈ 2.0-2.2
  // Це забезпечує плавний ріст без завищених статів на початку
  const levelMultiplier = 1 + (lvl - 1) * 0.015; // На 80 рівні: 1 + 79 * 0.015 = 2.185
  const levelMultiplierDef = 1 + (lvl - 1) * 0.01; // На 80 рівні: 1 + 79 * 0.01 = 1.79
  const levelMultiplierSecondary = 1 + (lvl - 1) * 0.008; // На 80 рівні: 1 + 79 * 0.008 = 1.632
  
  // Зменшуємо бойові стати в половину для балансу
  // (раніше були моби з x2 статами, і герой 5лвл вбивав мобів 20лвл)
  const STAT_REDUCTION_MULTIPLIER = 0.5;
  
  let pAtk = Math.max(1, Math.round((baseStats.STR * 1.5 + baseStats.DEX * 0.5) * levelMultiplier * STAT_REDUCTION_MULTIPLIER));
  let mAtk = Math.max(1, Math.round((baseStats.INT * 1.2 + baseStats.WIT * 0.8) * levelMultiplier * STAT_REDUCTION_MULTIPLIER));
  let pDef = Math.max(1, Math.round((baseStats.CON * 1.8 + baseStats.DEX * 0.3) * levelMultiplierDef * STAT_REDUCTION_MULTIPLIER));
  let mDef = Math.max(1, Math.round((baseStats.MEN * 1.5 + baseStats.WIT * 0.5) * levelMultiplierDef * STAT_REDUCTION_MULTIPLIER));
  let accuracy = Math.max(1, Math.round((baseStats.DEX * 2.5 + baseStats.WIT * 0.5) * levelMultiplierSecondary));
  let evasion = Math.max(1, Math.round((baseStats.DEX * 2.5 + baseStats.WIT * 0.5) * levelMultiplierSecondary));
  let crit = Math.max(1, Math.round((baseStats.DEX * 2.5 + baseStats.STR * 0.3) * levelMultiplierSecondary));
  let mCrit = Math.max(1, Math.round((baseStats.WIT * 2.0 + baseStats.INT * 0.5) * levelMultiplierSecondary));
  
  // Швидкість атаки та каста - мінімальний ріст за рівнем
  let attackSpeed = Math.max(200, Math.round(500 - baseStats.DEX * 1.2 + lvl * 2));
  let castSpeed = Math.max(200, Math.round(700 - baseStats.WIT * 1.2 + lvl * 2));
  
  // Регенерація: базові значення 8/12/7 на 1 рівні, невеликий ріст за рівнем
  // На 1 рівні: 8/12/7, на 80 рівні: ~15/20/12
  let hpRegen = Math.max(1, Math.round(8 + (lvl - 1) * 0.1));
  let mpRegen = Math.max(1, Math.round(12 + (lvl - 1) * 0.1));
  let cpRegen = Math.max(1, Math.round(7 + (lvl - 1) * 0.06));
  let critPower = 0;
  let shieldBlockRate = 0; // Base shield block rate
  let shieldBlockPower = 100; // Base shield block power (100% = no reduction)

  // Збираємо відсоткові бонуси захисту та урону (застосовуються після всіх flat бонусів)
  let pDefPercentBonus = 0;
  let mDefPercentBonus = 0;
  let pAtkPercentBonus = 0;
  let mAtkPercentBonus = 0;

  // 2. Equipment bonuses
  if (equipment) {
    Object.entries(equipment).forEach(([slot, itemId]: [string, any]) => {
      const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (itemId && itemDef && itemDef.stats) {
        const itemStats = itemDef.stats;
        const enchantLevel = equipmentEnchantLevels?.[slot] ?? 0;
        
        // Бонус від заточки: +3% за рівень для зброї, +2% для броні
        const enchantMultiplier = enchantLevel > 0 ? (1 + (enchantLevel * 0.03)) : 1;
        const armorEnchantMultiplier = enchantLevel > 0 ? (1 + (enchantLevel * 0.02)) : 1;
        
        const isWeapon = itemDef.kind === "weapon";
        const isArmor = ["armor", "helmet", "boots", "gloves", "shield"].includes(itemDef.kind || "");
        
        if (itemStats.pAtk) {
          pAtk += isWeapon ? Math.round(itemStats.pAtk * enchantMultiplier) : itemStats.pAtk;
        }
        if (itemStats.mAtk) {
          mAtk += isWeapon ? Math.round(itemStats.mAtk * enchantMultiplier) : itemStats.mAtk;
        }
        if (itemStats.pDef) {
          pDef += isArmor ? Math.round(itemStats.pDef * armorEnchantMultiplier) : itemStats.pDef;
        }
        if (itemStats.mDef) {
          mDef += isArmor ? Math.round(itemStats.mDef * armorEnchantMultiplier) : itemStats.mDef;
        }
        // Збираємо відсоткові бонуси захисту та урону
        if (itemStats.pDefPercent) {
          pDefPercentBonus += itemStats.pDefPercent;
        }
        if (itemStats.mDefPercent) {
          mDefPercentBonus += itemStats.mDefPercent;
        }
        if (itemStats.pAtkPercent) {
          pAtkPercentBonus += itemStats.pAtkPercent;
        }
        if (itemStats.mAtkPercent) {
          mAtkPercentBonus += itemStats.mAtkPercent;
        }
        if (itemStats.accuracy) accuracy += itemStats.accuracy;
        if (itemStats.evasion) evasion += itemStats.evasion;
        if (itemStats.crit) crit += itemStats.crit;
        if (itemStats.mCrit) mCrit += itemStats.mCrit;
        // Маппінг pAtkSpd -> attackSpeed для зброї та тату
        if (itemStats.attackSpeed) attackSpeed += itemStats.attackSpeed;
        if (itemStats.pAtkSpd) {
          // Для зброї pAtkSpd додається тільки якщо це зброя, для тату - завжди
          const isTattoo = itemDef.kind === "tattoo";
          if (isWeapon || isTattoo) {
            attackSpeed += itemStats.pAtkSpd;
          }
        }
        if (itemStats.castSpeed) castSpeed += itemStats.castSpeed;
        if (itemStats.hpRegen) hpRegen += itemStats.hpRegen;
        if (itemStats.mpRegen) mpRegen += itemStats.mpRegen;
        if (itemStats.cpRegen) cpRegen += itemStats.cpRegen;
        if (itemStats.critPower) critPower += itemStats.critPower;
        if (itemStats.shieldBlockRate) shieldBlockRate += itemStats.shieldBlockRate;
        if (itemStats.shieldBlockPower) shieldBlockPower += itemStats.shieldBlockPower;
      }
    });
    // Відсоткові бонуси будуть застосовані після set bonuses
  }

  // 3. Set bonuses (після equipment bonuses)
  if (equipment) {
    const setBonuses = getActiveSetBonuses(equipment);
    
    if (setBonuses.pAtk) pAtk += setBonuses.pAtk;
    if (setBonuses.mAtk) mAtk += setBonuses.mAtk;
    if (setBonuses.pDef) pDef += setBonuses.pDef;
    if (setBonuses.mDef) mDef += setBonuses.mDef;
    
    // Збираємо відсоткові бонуси з сетів (застосуються разом з equipment бонусами в кінці)
    if (setBonuses.pDefPercent) {
      pDefPercentBonus += setBonuses.pDefPercent;
    }
    if (setBonuses.mDefPercent) {
      mDefPercentBonus += setBonuses.mDefPercent;
    }
    if (setBonuses.pAtkPercent) {
      pAtkPercentBonus += setBonuses.pAtkPercent;
    }
    if (setBonuses.mAtkPercent) {
      mAtkPercentBonus += setBonuses.mAtkPercent;
    }
    if (setBonuses.accuracy) accuracy += setBonuses.accuracy;
    if (setBonuses.evasion) evasion += setBonuses.evasion;
    
    // Обробка крита (підтримка різних назв)
    if (setBonuses.crit) {
      crit += setBonuses.crit;
      
      // Для магів сетів також додаємо crit до mCrit (магічний крит)
      // Перевіряємо, чи це магівський сет (має mAtk бонус)
      if (setBonuses.mAtk) {
        mCrit += setBonuses.crit;
      }
    }
    // Підтримка critRate (конвертуємо в flat: 1% = 10 flat)
    if (setBonuses.critRate) {
      crit += setBonuses.critRate * 10;
    }
    
    // Обробка магічного крита
    if (setBonuses.mCrit) mCrit += setBonuses.mCrit;
    // Підтримка skillCritRate (магічний крит, конвертуємо в flat: 1% = 10 flat)
    if (setBonuses.skillCritRate) {
      mCrit += setBonuses.skillCritRate * 10;
    }
    
    // Обробка сили крита
    if (setBonuses.critPower) critPower += setBonuses.critPower;
    // Підтримка critDamage (те саме що critPower)
    if (setBonuses.critDamage) critPower += setBonuses.critDamage;
    // Підтримка skillCritPower (магічна сила крита)
    if (setBonuses.skillCritPower) critPower += setBonuses.skillCritPower;
    
    if (setBonuses.attackSpeed) attackSpeed += setBonuses.attackSpeed;
    if (setBonuses.castSpeed) castSpeed += setBonuses.castSpeed;
    if (setBonuses.hpRegen) hpRegen += setBonuses.hpRegen;
    if (setBonuses.mpRegen) mpRegen += setBonuses.mpRegen;
    if (setBonuses.cpRegen) cpRegen += setBonuses.cpRegen;
    if (setBonuses.shieldBlockRate) shieldBlockRate += setBonuses.shieldBlockRate || 0;
    if (setBonuses.shieldBlockPower) shieldBlockPower += setBonuses.shieldBlockPower || 0;
  }
  
  // Застосовуємо всі відсоткові бонуси (з equipment та сетів) після всіх flat бонусів
  if (pDefPercentBonus > 0) {
    pDef = Math.round(pDef * (1 + pDefPercentBonus / 100));
  }
  if (mDefPercentBonus > 0) {
    mDef = Math.round(mDef * (1 + mDefPercentBonus / 100));
  }
  if (pAtkPercentBonus > 0) {
    pAtk = Math.round(pAtk * (1 + pAtkPercentBonus / 100));
  }
  if (mAtkPercentBonus > 0) {
    mAtk = Math.round(mAtk * (1 + mAtkPercentBonus / 100));
  }

  // 4. Прямі бонуси від тату (dyes) - додаються після всіх інших бонусів
  // Тату дають значні прямі бонуси до бойових статів, не через базові стати
  if (activeDyes && activeDyes.length > 0) {
    for (const dye of activeDyes) {
      // Базові множники для кожного ефекту (для +1 ефекту)
      // Для +5 ефекту: множник * 5
      const effectMultiplier = dye.effect;
      
      switch (dye.statPlus) {
        case "STR":
          // STR впливає на фізичний урон: +1 = +50 pAtk, +5 = +250 pAtk
          pAtk += Math.round(50 * effectMultiplier);
          break;
        case "DEX":
          // DEX впливає на швидкість атаки, точність, уклон, крит
          // +1 = +10 accuracy, +10 evasion, +20 crit, +30 attackSpeed
          accuracy += Math.round(10 * effectMultiplier);
          evasion += Math.round(10 * effectMultiplier);
          crit += Math.round(20 * effectMultiplier);
          attackSpeed += Math.round(30 * effectMultiplier);
          break;
        case "CON":
          // CON впливає на фізичний захист та HP (через calcResources, тут тільки pDef)
          // +1 = +30 pDef
          pDef += Math.round(30 * effectMultiplier);
          break;
        case "INT":
          // INT впливає на магічний урон: +1 = +50 mAtk, +5 = +250 mAtk
          mAtk += Math.round(50 * effectMultiplier);
          break;
        case "WIT":
          // WIT впливає на швидкість каста та магічний крит
          // +1 = +30 castSpeed, +20 mCrit
          castSpeed += Math.round(30 * effectMultiplier);
          mCrit += Math.round(20 * effectMultiplier);
          break;
        case "MEN":
          // MEN впливає на магічний захист та MP (через calcResources, тут тільки mDef)
          // +1 = +30 mDef
          mDef += Math.round(30 * effectMultiplier);
          break;
      }
      
      // Мінусові стати також впливають (віднімаються)
      switch (dye.statMinus) {
        case "STR":
          pAtk -= Math.round(50 * effectMultiplier);
          break;
        case "DEX":
          accuracy -= Math.round(10 * effectMultiplier);
          evasion -= Math.round(10 * effectMultiplier);
          crit -= Math.round(20 * effectMultiplier);
          attackSpeed -= Math.round(30 * effectMultiplier);
          break;
        case "CON":
          pDef -= Math.round(30 * effectMultiplier);
          break;
        case "INT":
          mAtk -= Math.round(50 * effectMultiplier);
          break;
        case "WIT":
          castSpeed -= Math.round(30 * effectMultiplier);
          mCrit -= Math.round(20 * effectMultiplier);
          break;
        case "MEN":
          mDef -= Math.round(30 * effectMultiplier);
          break;
      }
    }
    
    // Гарантуємо мінімальні значення після застосування тату
    pAtk = Math.max(1, pAtk);
    mAtk = Math.max(1, mAtk);
    pDef = Math.max(1, pDef);
    mDef = Math.max(1, mDef);
    accuracy = Math.max(1, accuracy);
    evasion = Math.max(1, evasion);
    crit = Math.max(0, crit);
    mCrit = Math.max(0, mCrit);
    attackSpeed = Math.max(100, attackSpeed);
    castSpeed = Math.max(100, castSpeed);
  }

  // 3. Конвертуємо в відсотки тільки для accuracy та evasion (caps / limits)
  // ❗ ВАЖЛИВО: crit та mCrit НЕ конвертуємо в % тут - вони мають залишатися flat значеннями
  // для правильної роботи пасивних скілів та бафів (які працюють з % модифікаторами)
  // Конвертація crit/mCrit в % буде виконана в кінці, після застосування всіх модифікаторів
  const accuracyPercent = Math.min(100, Math.round((accuracy / 100) * 10));
  const evasionPercent = Math.min(100, Math.round((evasion / 100) * 10));
  // crit та mCrit залишаються як flat значення (не конвертуємо в %)
  // const critPercent = Math.min(100, Math.round((crit / 10))); // ❌ ВИДАЛЕНО
  // const mCritPercent = Math.min(100, Math.round((mCrit / 10))); // ❌ ВИДАЛЕНО

  const finalAttackSpeed = Math.round(attackSpeed * 10) / 10;
  
  return {
    pAtk,
    mAtk,
    pDef,
    mDef,
    accuracy: accuracyPercent,
    evasion: evasionPercent,
    crit: crit, // ✅ Залишаємо flat значення (не конвертуємо в %)
    mCrit: mCrit, // ✅ Залишаємо flat значення (не конвертуємо в %)
    critPower,
    attackSpeed: finalAttackSpeed,
    castSpeed: Math.round(castSpeed * 10) / 10,
    hpRegen,
    mpRegen,
    cpRegen,
    shieldBlockRate,
    shieldBlockPower,
  };
}

