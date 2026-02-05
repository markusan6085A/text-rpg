import type { BattleBuff } from "../types";

export const cleanupBuffs = (buffs: BattleBuff[], now: number) => {
  const seenStack = new Set<string>();
  const seenId = new Set<number>();
  const seenName = new Set<string>();

  return buffs
    .filter((b) => b.expiresAt > now)
    .filter((b) => {
      const isToggleBuff = b.expiresAt === Number.MAX_SAFE_INTEGER;
      if (!isToggleBuff) return true;

      const hasStack = b.stackType ? seenStack.has(b.stackType) : false;
      const hasId = typeof b.id === "number" ? seenId.has(b.id) : false;
      const hasName = b.name ? seenName.has(b.name) : false;

      if (hasStack || hasId || hasName) return false;

      if (b.stackType) seenStack.add(b.stackType);
      if (typeof b.id === "number") seenId.add(b.id);
      if (b.name) seenName.add(b.name);
      return true;
  });
};

export const applyBuffsToStats = (
  stats: any,
  buffs: BattleBuff[]
) => {
  const merged = { ...(stats || {}) };
  let invulnerable = false;

  // Синхронізуємо attackSpeed та atkSpeed перед застосуванням бафів
  // Це гарантує, що базове значення доступне в обох ключах
  if (typeof merged["attackSpeed"] === "number" && typeof merged["atkSpeed"] !== "number") {
    merged["atkSpeed"] = merged["attackSpeed"];
  } else if (typeof merged["atkSpeed"] === "number" && typeof merged["attackSpeed"] !== "number") {
    merged["attackSpeed"] = merged["atkSpeed"];
  }

  // ❗ ВАЖЛИВО: Збираємо всі percent бафи для кожного стату окремо
  // Це дозволяє правильно додавати відсотки замість множення
  const percentBuffsByStat: Record<string, number> = {};
  const flatBuffsByStat: Record<string, number> = {};
  const multiplierBuffsByStat: Record<string, number> = {};

  // Спочатку збираємо всі бафи
  buffs.forEach((b) => {
    b.effects.forEach((eff) => {
      const stat = eff.stat;
      // КРИТИЧНО: mode має бути з eff.mode, якщо є multiplier - це multiplier!
      let mode = eff.mode;
      // Якщо mode не встановлено, але є multiplier - це multiplier режим
      if (!mode && (eff.multiplier !== undefined && eff.multiplier !== null)) {
        mode = "multiplier";
      }
      // Якщо mode все ще не встановлено, fallback на "flat"
      if (!mode) {
        mode = "flat";
      }
      
      // Діагностика для Rapid Shot (id 99) - тимчасово для перевірки
      if (b.id === 99 && import.meta.env.DEV) {
        console.log(`[applyBuffsToStats] APPLY BUFF Rapid Shot:`, {
          stat,
          mode,
          effMode: eff.mode,
          effMultiplier: eff.multiplier,
          effValue: eff.value,
          effRaw: eff,
          hasMultiplier: eff.multiplier !== undefined,
        });
      }
      
      // Для multiplier режиму: eff.multiplier або eff.value (дефолт 1)
      // Для інших режимів: eff.value (дефолт 0)
      const val = mode === "multiplier"
        ? (eff.multiplier ?? eff.value ?? 1)
        : (eff.value ?? 0);
      
      // Маппінг статів для сумісності
      let targetStat = stat;
      if (stat === "critRate") {
        targetStat = "crit";
      } else if (stat === "mCritRate" || stat === "magicCritRate" || stat === "skillCritRate") {
        targetStat = "mCrit";
      } else if (stat === "attackSpeed") {
        // attackSpeed мапиться на atkSpeed для сумісності
        targetStat = "atkSpeed";
      } else if (stat === "atkSpeed") {
        // atkSpeed залишається без змін
        targetStat = "atkSpeed";
      } else if (stat === "critDamage") {
        // critDamage мапиться на critPower для сумісності з calcCombatStats
        targetStat = "critPower";
      } else if (stat === "skillMastery") {
        // skillMastery залишається без змін
        targetStat = "skillMastery";
      }

      if (!stat) return;
      if (stat === "invulnerable") {
        invulnerable = invulnerable || val === 1 || val === true;
        return;
      }
      if (typeof val !== "number") return;
      
      // Для attackSpeed перевіряємо обидва ключі (attackSpeed та atkSpeed)
      let current: number | undefined;
      if (stat === "attackSpeed" || stat === "atkSpeed") {
        // Перевіряємо обидва ключі для attackSpeed/atkSpeed
        current = typeof merged["atkSpeed"] === "number" 
          ? merged["atkSpeed"] 
          : typeof merged["attackSpeed"] === "number"
          ? merged["attackSpeed"]
          : typeof stats?.["atkSpeed"] === "number"
          ? stats["atkSpeed"]
          : typeof stats?.["attackSpeed"] === "number"
          ? stats["attackSpeed"]
          : undefined;
      } else {
        current = typeof merged[targetStat] === "number" 
          ? merged[targetStat] 
          : typeof stats?.[targetStat] === "number"
          ? stats[targetStat]
          : undefined;
      }

      // Діагностика для Rapid Shot (id 99) - тимчасово для перевірки
      if (b.id === 99 && import.meta.env.DEV) {
        console.log(`[applyBuffsToStats] APPLY BUFF Rapid Shot:`, {
          stat,
          targetStat,
          mode,
          effValue: eff.value,
          effMultiplier: eff.multiplier,
          val,
          current,
          before: current ?? 0,
          statsKeys: Object.keys(stats),
          mergedKeys: Object.keys(merged),
        });
      }

      // ❗ ВАЖЛИВО: Збираємо всі percent бафи для кожного стату
      // Відсотки додаються, а не множаться один на одного
      // Для percent mode використовуємо val (eff.value) — це вже обчислений відсоток з processSkillEffects
      // (eff.multiplier у effects використовується тільки для обчислення value, не як фінальний %)
      if (mode === "percent") {
        const percentValue = val;
        if (stat === "skillCritRate" || stat === "vampirism" || stat === "critDamage") {
          // skillCritRate, vampirism, and critDamage are always additive (e.g., +20% critDamage means add 20)
          // The value is already in percentage points, so we add it directly
          flatBuffsByStat[targetStat] = (flatBuffsByStat[targetStat] || 0) + percentValue;
        } else if (stat === "atkSpeed" || stat === "attackSpeed") {
          // Для atkSpeed збираємо відсотки окремо
          percentBuffsByStat[targetStat] = (percentBuffsByStat[targetStat] || 0) + percentValue;
        } else {
          // Для всіх інших статів (включаючи pAtk, mAtk, pDef, mDef) збираємо відсотки
          percentBuffsByStat[targetStat] = (percentBuffsByStat[targetStat] || 0) + percentValue;
        }
      } else if (mode === "multiplier") {
        // Для multiplier збираємо множники (вони множаться один на одного)
        multiplierBuffsByStat[targetStat] = (multiplierBuffsByStat[targetStat] || 1) * val;
      } else {
        // Для flat режиму додаємо значення
        flatBuffsByStat[targetStat] = (flatBuffsByStat[targetStat] || 0) + val;
      }
      
      // Діагностика для shieldBlockRate
      if (stat === "shieldBlockRate" && import.meta.env.DEV) {
        console.log(`[applyBuffsToStats] shieldBlockRate:`, {
          stat,
          targetStat,
          mode,
          val,
          current,
          before: current ?? 0,
          after: merged[targetStat],
          buffName: b.name,
          buffId: b.id,
        });
      }
    });
  });

  // ❗ ВАЖЛИВО: Тепер застосовуємо всі зібрані бафи до базових значень
  // Спочатку застосовуємо multiplier бафи (вони множаться один на одного)
  Object.keys(multiplierBuffsByStat).forEach((targetStat) => {
    const baseValue = typeof stats?.[targetStat] === "number" ? stats[targetStat] : (merged[targetStat] ?? 0);
    merged[targetStat] = baseValue * multiplierBuffsByStat[targetStat];
  });

  // Потім застосовуємо percent бафи (відсотки додаються, а не множаться)
  Object.keys(percentBuffsByStat).forEach((targetStat) => {
    const baseValue = typeof stats?.[targetStat] === "number" ? stats[targetStat] : (merged[targetStat] ?? 0);
    const totalPercent = percentBuffsByStat[targetStat];
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") {
      // Для atkSpeed використовуємо базове значення або fallback
      const baseAtkSpeed = baseValue > 0 ? baseValue : (typeof stats?.["atkSpeed"] === "number" ? stats["atkSpeed"] : typeof stats?.["attackSpeed"] === "number" ? stats["attackSpeed"] : 200);
      merged[targetStat] = baseAtkSpeed * (1 + totalPercent / 100);
      merged["atkSpeed"] = merged[targetStat];
      merged["attackSpeed"] = merged[targetStat];
    } else if (baseValue > 0) {
      merged[targetStat] = baseValue * (1 + totalPercent / 100);
    }
  });

  // Нарешті застосовуємо flat бафи (додаються)
  Object.keys(flatBuffsByStat).forEach((targetStat) => {
    const current = merged[targetStat] ?? (typeof stats?.[targetStat] === "number" ? stats[targetStat] : 0);
    merged[targetStat] = current + flatBuffsByStat[targetStat];
    
    // Синхронізуємо ключі для сумісності
    if (targetStat === "atkSpeed" || targetStat === "attackSpeed") {
      merged["atkSpeed"] = merged[targetStat];
      merged["attackSpeed"] = merged[targetStat];
    } else if (targetStat === "crit") {
      merged["critRate"] = merged[targetStat];
    } else if (targetStat === "mCrit") {
      merged["skillCritRate"] = merged[targetStat];
      merged["mCritRate"] = merged[targetStat];
      merged["magicCritRate"] = merged[targetStat];
    } else if (targetStat === "critPower") {
      merged["critDamage"] = merged[targetStat];
    }
  });

  if (invulnerable) merged.invulnerable = true;
  return merged;
};

