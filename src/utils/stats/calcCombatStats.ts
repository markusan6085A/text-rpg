/**
 * Обчислює бойові стати героя (pAtk, mAtk, pDef, mDef, тощо)
 * Порядок: baseStats -> level scaling -> equipment bonuses -> set bonuses
 */
import type { HeroBaseStats } from "../../state/heroFactory";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { getActiveSetBonuses } from "../../data/sets/armorSets";
import { HERO_STAT_MULTIPLIER } from "../../data/balance";
import {
  getMagicWeaponEnchantFlatMAtk,
  getPhysicalWeaponEnchantFlatPAtk,
  isMagicWeaponForEnchant,
} from "./weaponEnchantBonuses";
import {
  getArmorShieldPDefEnchantBonus,
  getJewelryMDefEnchantBonus,
  isArmorOrShieldKind,
  isJewelryKind,
} from "./armorEnchantBonuses";
import { clampShieldBlockRate } from "../shield/shieldDefense";

export interface CombatStats {
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  /** Відображення: ~рейтинг/10 % (кламп 100). Рейтинг — те саме, що йде в PvE hit chance на сервері. */
  accuracy: number;
  evasion: number;
  /** Сирий рейтинг точності (DEX/шмот/сети); сервер: clamp 0..500 у pveHitChance. */
  accuracyRating?: number;
  evasionRating?: number;
  crit: number;
  mCrit: number;
  critPower: number;
  attackSpeed: number;
  castSpeed: number;
  hpRegen: number;
  mpRegen: number;
  cpRegen: number;
  shieldBlockRate?: number;
  shieldBlockPower?: number;
  /** Плоский бонус до зниження урону при успішному блоці (Shield Fortress тощо), не %. */
  shieldFortressDefense?: number;
  /** % bonus to magic skill damage (from set INT bonuses) */
  magicSkillPower?: number;
  /** % стійкість до отрути (для resistStat poison у скілах) */
  poisonResist?: number;
  /** % стійкість до утримання/root */
  holdResist?: number;
  /** % бонус до шансу накласти отруту (закладка під атакуючі ефекти) */
  poisonChanceBonus?: number;
  /** % бонус до шансу накласти утримання */
  holdChanceBonus?: number;
  /** % опір land-rate bleed (дебафи/скили з stat bleed), додається до resistStat цілі */
  bleedResist?: number;
  /** % до базового шансу накласти bleed (акаунт атакуючого) */
  bleedChanceBonus?: number;
  /** % бонус до отриманого зцілення (хіл-скили, банки HP) */
  healReceivedBonus?: number;
  /** % зменшення витрати MP на активні скіли (після lsGuidance) */
  mpSkillCostReduction?: number;
  /** % зменшення вхідного урону (після базової мітігації; див. processMobAttack). */
  damageTakenReduction?: number;
  /** % HP від нанесеної шкоди (фіз. атакі/скіли з vampirism). */
  vampirism?: number;
  /** % стійкість до stun/shock */
  stunResist?: number;
  /** % бонус до шансу stun/shock на ціль (де підтримується). */
  stunChanceBonus?: number;
  /** % опір ментальним ефектам (страх, мовчання тощо). */
  mentalResist?: number;
  /** % зменшення часу повторного використання скілів (reuse delay), підсумовується з пасивками. */
  cooldownReduction?: number;
}

export const RING_OF_QUEEN_ANT_ID = "ring_of_queen_ant";
export const RING_OF_CORE_ID = "ring_of_core";
export const RING_OF_BAIUM_ID = "ring_of_baium";
export const EARRING_OF_ORFEN_ID = "earring_of_orfen";
export const EARRING_OF_ZAKEN_ID = "earring_of_zaken";
export const EARRING_OF_ANTHARAS_ID = "earring_of_antharas";
export const NECKLACE_OF_VALAKAS_ID = "necklace_of_valakas";
export const NECKLACE_OF_FRINTEZZA_ID = "necklace_of_frintezza";

/** Перший слот (лексикографічно) з цим id — єдиний, що дає статти; як у L2 для унікальних епіків. */
export function primaryEquipmentSlotForItem(
  equipment: Record<string, string | null> | undefined,
  itemId: string
): string | null {
  if (!equipment) return null;
  const slots = Object.entries(equipment)
    .filter(([, id]) => id === itemId)
    .map(([s]) => s)
    .sort();
  return slots[0] ?? null;
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
  
  // Множник бойових статів з balance — різниця між класами (DPS/танк/маг) помітніша
  let pAtk = Math.max(1, Math.round((baseStats.STR * 1.5 + baseStats.DEX * 0.5) * levelMultiplier * HERO_STAT_MULTIPLIER));
  let mAtk = Math.max(1, Math.round((baseStats.INT * 1.2 + baseStats.WIT * 0.8) * levelMultiplier * HERO_STAT_MULTIPLIER));
  let pDef = Math.max(1, Math.round((baseStats.CON * 1.8 + baseStats.DEX * 0.3) * levelMultiplierDef * HERO_STAT_MULTIPLIER));
  let mDef = Math.max(1, Math.round((baseStats.MEN * 1.5 + baseStats.WIT * 0.5) * levelMultiplierDef * HERO_STAT_MULTIPLIER));
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
  let magicSkillPower = 0; // % bonus to magic skill damage (from set INT)
  let shieldBlockRate = 0; // Base shield block rate
  let shieldBlockPower = 100; // Base shield block power (100% = no reduction)

  // Збираємо відсоткові бонуси захисту та урону (застосовуються після всіх flat бонусів)
  let pDefPercentBonus = 0;
  let mDefPercentBonus = 0;
  let pAtkPercentBonus = 0;
  let mAtkPercentBonus = 0;
  let poisonResist = 0;
  let holdResist = 0;
  let poisonChanceBonus = 0;
  let holdChanceBonus = 0;
  let bleedResist = 0;
  let bleedChanceBonus = 0;
  let healReceivedBonus = 0;
  let mpSkillCostReduction = 0;
  let damageTakenReduction = 0;
  let vampirism = 0;
  let stunResist = 0;
  let stunChanceBonus = 0;
  let mentalResist = 0;
  let cooldownReduction = 0;

  const queenAntPrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_QUEEN_ANT_ID);
  const ringOfCorePrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_CORE_ID);
  const ringOfBaiumPrimarySlot = primaryEquipmentSlotForItem(equipment, RING_OF_BAIUM_ID);
  const orfenPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ORFEN_ID);
  const zakenEarringPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ZAKEN_ID);
  const antharasEarringPrimarySlot = primaryEquipmentSlotForItem(equipment, EARRING_OF_ANTHARAS_ID);
  const valakasNecklacePrimarySlot = primaryEquipmentSlotForItem(equipment, NECKLACE_OF_VALAKAS_ID);
  const frintezzaNecklacePrimarySlot = primaryEquipmentSlotForItem(equipment, NECKLACE_OF_FRINTEZZA_ID);

  // 2. Equipment bonuses
  if (equipment) {
    Object.entries(equipment).forEach(([slot, itemId]: [string, any]) => {
      if (itemId === RING_OF_QUEEN_ANT_ID && queenAntPrimarySlot != null && slot !== queenAntPrimarySlot) {
        return;
      }
      if (itemId === RING_OF_CORE_ID && ringOfCorePrimarySlot != null && slot !== ringOfCorePrimarySlot) {
        return;
      }
      if (itemId === RING_OF_BAIUM_ID && ringOfBaiumPrimarySlot != null && slot !== ringOfBaiumPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ORFEN_ID && orfenPrimarySlot != null && slot !== orfenPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ZAKEN_ID && zakenEarringPrimarySlot != null && slot !== zakenEarringPrimarySlot) {
        return;
      }
      if (itemId === EARRING_OF_ANTHARAS_ID && antharasEarringPrimarySlot != null && slot !== antharasEarringPrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_VALAKAS_ID && valakasNecklacePrimarySlot != null && slot !== valakasNecklacePrimarySlot) {
        return;
      }
      if (itemId === NECKLACE_OF_FRINTEZZA_ID && frintezzaNecklacePrimarySlot != null && slot !== frintezzaNecklacePrimarySlot) {
        return;
      }
      const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (itemId && itemDef && itemDef.stats) {
        const itemStats = itemDef.stats;
        const enchantLevel = equipmentEnchantLevels?.[slot] ?? 0;
        
        const isWeapon = itemDef.kind === "weapon";
        const isArmor = ["armor", "helmet", "boots", "gloves", "shield"].includes(itemDef.kind || "");
        const isArmorOrShield = isArmorOrShieldKind(itemDef.kind);
        const isJewelryPiece = isJewelryKind(itemDef.kind);
        
        if (itemStats.pAtk != null && Number.isFinite(Number(itemStats.pAtk))) {
          const baseP = Math.round(Number(itemStats.pAtk));
          if (isWeapon) {
            pAtk += baseP;
            if (!isMagicWeaponForEnchant(itemId, itemDef)) {
              pAtk += getPhysicalWeaponEnchantFlatPAtk(itemId, itemDef, enchantLevel);
            }
          } else {
            pAtk += itemStats.pAtk;
          }
        }
        if (itemStats.mAtk != null && Number.isFinite(Number(itemStats.mAtk))) {
          const baseM = Math.round(Number(itemStats.mAtk));
          if (isWeapon) {
            mAtk += baseM;
            if (isMagicWeaponForEnchant(itemId, itemDef)) {
              mAtk += getMagicWeaponEnchantFlatMAtk(enchantLevel);
            }
          } else {
            mAtk += itemStats.mAtk;
          }
        }
        if (itemStats.pDef != null && Number.isFinite(Number(itemStats.pDef))) {
          const basePd = Math.round(Number(itemStats.pDef));
          if (isArmorOrShield) {
            pDef += basePd + getArmorShieldPDefEnchantBonus(enchantLevel);
          } else if (!isWeapon) {
            pDef += itemStats.pDef;
          }
        }
        if (itemStats.mDef != null && Number.isFinite(Number(itemStats.mDef))) {
          const baseMd = Math.round(Number(itemStats.mDef));
          if (isJewelryPiece) {
            mDef += baseMd + getJewelryMDefEnchantBonus(itemId, enchantLevel);
          } else if (isArmorOrShield) {
            mDef += baseMd;
          } else if (!isWeapon) {
            mDef += itemStats.mDef;
          }
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
          // Скорость боя (pAtkSpd) — тільки для attackSpeed, не для castSpeed
          const isTattoo = itemDef.kind === "tattoo";
          if (isWeapon || isTattoo) {
            attackSpeed += itemStats.pAtkSpd;
          }
        }
        if (itemStats.castSpeed) castSpeed += itemStats.castSpeed;
        if ((itemStats as any).cast_speed) castSpeed += (itemStats as any).cast_speed;
        if (itemStats.hpRegen) hpRegen += itemStats.hpRegen;
        if (itemStats.mpRegen) mpRegen += itemStats.mpRegen;
        if (itemStats.cpRegen) cpRegen += itemStats.cpRegen;
        if (itemStats.critPower) critPower += itemStats.critPower;
        if (itemStats.magicSkillPower) magicSkillPower += itemStats.magicSkillPower;
        if (itemStats.shieldBlockRate) shieldBlockRate += itemStats.shieldBlockRate;
        if (itemStats.shieldBlockPower) shieldBlockPower += itemStats.shieldBlockPower;
        if (itemStats.poisonResist) poisonResist += itemStats.poisonResist;
        if (itemStats.holdResist) holdResist += itemStats.holdResist;
        if (itemStats.poisonChanceBonus) poisonChanceBonus += itemStats.poisonChanceBonus;
        if (itemStats.holdChanceBonus) holdChanceBonus += itemStats.holdChanceBonus;
        if (itemStats.bleedResist) bleedResist += itemStats.bleedResist;
        if (itemStats.bleedChanceBonus) bleedChanceBonus += itemStats.bleedChanceBonus;
        if (itemStats.healReceivedBonus) healReceivedBonus += itemStats.healReceivedBonus;
        if (itemStats.mpSkillCostReduction) mpSkillCostReduction += itemStats.mpSkillCostReduction;
        const dtr = (itemStats as any).damageTakenReduction;
        if (typeof dtr === "number" && Number.isFinite(dtr) && dtr > 0) {
          damageTakenReduction += dtr;
        }
        const vmp = (itemStats as any).vampirism;
        if (typeof vmp === "number" && Number.isFinite(vmp) && vmp > 0) {
          vampirism += vmp;
        }
        const sr = (itemStats as any).stunResist;
        if (typeof sr === "number" && Number.isFinite(sr) && sr > 0) {
          stunResist += sr;
        }
        const scb = (itemStats as any).stunChanceBonus;
        if (typeof scb === "number" && Number.isFinite(scb) && scb > 0) {
          stunChanceBonus += scb;
        }
        const mr = (itemStats as any).mentalResist;
        if (typeof mr === "number" && Number.isFinite(mr) && mr > 0) {
          mentalResist += mr;
        }
        const cdr = (itemStats as any).cooldownReduction;
        if (typeof cdr === "number" && Number.isFinite(cdr) && cdr > 0) {
          cooldownReduction += cdr;
        }
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
    if (setBonuses.poisonResist) poisonResist += setBonuses.poisonResist;
    if (setBonuses.holdResist) holdResist += setBonuses.holdResist;
    if (setBonuses.poisonChanceBonus) poisonChanceBonus += setBonuses.poisonChanceBonus;
    if (setBonuses.holdChanceBonus) holdChanceBonus += setBonuses.holdChanceBonus;
    if (setBonuses.bleedResist) bleedResist += setBonuses.bleedResist;
    if (setBonuses.bleedChanceBonus) bleedChanceBonus += setBonuses.bleedChanceBonus;
    if (setBonuses.healReceivedBonus) healReceivedBonus += setBonuses.healReceivedBonus;
    if (setBonuses.mpSkillCostReduction) mpSkillCostReduction += setBonuses.mpSkillCostReduction;
    const setVamp = (setBonuses as any).vampirism;
    if (typeof setVamp === "number" && Number.isFinite(setVamp) && setVamp > 0) vampirism += setVamp;
    const setSr = (setBonuses as any).stunResist;
    if (typeof setSr === "number" && Number.isFinite(setSr) && setSr > 0) stunResist += setSr;
    const setScb = (setBonuses as any).stunChanceBonus;
    if (typeof setScb === "number" && Number.isFinite(setScb) && setScb > 0) stunChanceBonus += setScb;
    const setMr = (setBonuses as any).mentalResist;
    if (typeof setMr === "number" && Number.isFinite(setMr) && setMr > 0) mentalResist += setMr;
    
    if (setBonuses.attackSpeed) attackSpeed += setBonuses.attackSpeed;
    if (setBonuses.castSpeed) castSpeed += setBonuses.castSpeed;
    if (setBonuses.hpRegen) hpRegen += setBonuses.hpRegen;
    if (setBonuses.mpRegen) mpRegen += setBonuses.mpRegen;
    if (setBonuses.cpRegen) cpRegen += setBonuses.cpRegen;
    if (setBonuses.shieldBlockRate) shieldBlockRate += setBonuses.shieldBlockRate || 0;
    if (setBonuses.shieldBlockPower) shieldBlockPower += setBonuses.shieldBlockPower || 0;
    if (setBonuses.magicSkillPower) magicSkillPower += setBonuses.magicSkillPower;
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

  // 4. Прямі бонуси від тату (dyes) — для STR/DEX/INT/WIT (додатково до зміни baseStats у формулах).
  // CON/MEN тут не дублюємо: pDef/mDef уже з baseStats.CON / baseStats.MEN (вирівняно з HP/MP через conBonus/menBonus).
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
        case "INT":
          mAtk -= Math.round(50 * effectMultiplier);
          break;
        case "WIT":
          castSpeed -= Math.round(30 * effectMultiplier);
          mCrit -= Math.round(20 * effectMultiplier);
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
    accuracyRating: accuracy,
    evasionRating: evasion,
    crit: crit,
    mCrit: mCrit,
    critPower,
    attackSpeed: finalAttackSpeed,
    castSpeed: Math.round(castSpeed * 10) / 10,
    hpRegen,
    mpRegen,
    cpRegen,
    shieldBlockRate: clampShieldBlockRate(shieldBlockRate),
    shieldBlockPower,
    magicSkillPower: magicSkillPower > 0 ? magicSkillPower : undefined,
    ...(poisonResist > 0 ? { poisonResist } : {}),
    ...(holdResist > 0 ? { holdResist } : {}),
    ...(poisonChanceBonus > 0 ? { poisonChanceBonus } : {}),
    ...(holdChanceBonus > 0 ? { holdChanceBonus } : {}),
    ...(bleedResist > 0 ? { bleedResist } : {}),
    ...(bleedChanceBonus > 0 ? { bleedChanceBonus } : {}),
    ...(healReceivedBonus > 0 ? { healReceivedBonus } : {}),
    ...(mpSkillCostReduction > 0 ? { mpSkillCostReduction } : {}),
    ...(damageTakenReduction > 0 ? { damageTakenReduction } : {}),
    ...(vampirism > 0 ? { vampirism } : {}),
    ...(stunResist > 0 ? { stunResist } : {}),
    ...(stunChanceBonus > 0 ? { stunChanceBonus } : {}),
    ...(mentalResist > 0 ? { mentalResist } : {}),
    ...(cooldownReduction > 0 ? { cooldownReduction } : {}),
  };
}

