import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { loadBattle } from "../battle/persist";
import { cleanupBuffs } from "../battle/helpers";
import type { Hero } from "../../types/Hero";

export function updateHeroLogic(
  prev: Hero,
  partial: Partial<Hero>
): Hero {
  // ❗ ВАЖЛИВО: Завжди зберігаємо profession, race, gender, klass - вони не повинні втрачатися
  let updated = { 
    ...prev, 
    ...partial,
    // Гарантуємо, що базові поля не втрачаються
    profession: partial.profession !== undefined ? partial.profession : prev.profession,
    klass: partial.klass !== undefined ? partial.klass : prev.klass,
    race: partial.race !== undefined ? partial.race : prev.race,
    gender: partial.gender !== undefined ? partial.gender : prev.gender,
  };

  // ❗ recalculateAllStats НІКОЛИ не повинен запускатися через hp/mp/cp
  // Він має запускатися ТІЛЬКИ при: level, skills, equipment, baseStats, profession, klass, equipmentEnchantLevels, activeDyes
  const needsRecalc =
    partial.level !== undefined ||
    partial.skills !== undefined ||
    partial.equipment !== undefined ||
    partial.baseStats !== undefined ||
    partial.profession !== undefined ||
    partial.klass !== undefined ||
    partial.equipmentEnchantLevels !== undefined ||
    partial.activeDyes !== undefined;

  // ❗ ВАЖЛИВО: Навіть якщо needsRecalc = false, ми все одно повинні валідувати hp/mp/cp
  // щоб вони не перевищували maxHp/maxMp/maxCp
  // ❗ ВАЖЛИВО: hero.maxHp містить БАЗОВЕ значення БЕЗ бафів
  // Але при хілі/регені partial.hp може бути з урахуванням бафів
  // Тому НЕ обмежуємо hp до hero.maxHp, якщо partial.hp передано явно
  if (!needsRecalc && (partial.hp !== undefined || partial.mp !== undefined || partial.cp !== undefined)) {
    // Валідуємо ресурси тільки якщо вони невалідні (<= 0)
    // НЕ обмежуємо до hero.maxHp, бо він може бути без бафів, а partial.hp - з бафами
    if (partial.hp !== undefined) {
      updated.hp = Math.max(0, partial.hp); // Тільки перевіряємо, що не від'ємне
    }
    if (partial.mp !== undefined) {
      updated.mp = Math.max(0, partial.mp);
    }
    if (partial.cp !== undefined) {
      updated.cp = Math.max(0, partial.cp);
    }
  }

  if (needsRecalc) {
    // Перераховуємо ВСІ стати (ресурси + бойові) через централізовану функцію з урахуванням бафів
    const now = Date.now();
    const savedBattle = loadBattle(updated.name);
    const inBattle = savedBattle?.status && savedBattle.status !== "idle";
    const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], now);
    const recalculated = recalculateAllStats(updated, savedBuffs);
    
    // Зберігаємо оригінальні базові стати, якщо їх ще немає
    if (!updated.baseStatsInitial) {
      updated.baseStatsInitial = recalculated.originalBaseStats;
    }
    
    // ❗ ВАЖЛИВО: hp/mp/cp НЕ чіпаємо під час бою - вони живуть тільки в BattleState
    // Під час бою BattleState - єдине джерело правди для HP/MP/CP
    // Поза боєм - оновлюємо тільки при level up (повністю відновлюємо до max)
    const isLevelUp = partial.level !== undefined && partial.level !== prev.level;
    
    // hp/mp/cp оновлюємо ТІЛЬКИ якщо НЕ в бою АБО це level up
    const shouldUpdateResources = !inBattle || isLevelUp;
    
    // ❗ Забороняємо hp/mp/cp міняти maxHp
    // Якщо partial.hp передано - використовуємо його (з валідацією)
    // Інакше використовуємо prev.hp (з валідацією)
    const hpToUse = partial.hp !== undefined ? partial.hp : prev.hp;
    const safeHp =
      hpToUse === undefined ||
      hpToUse <= 0 ||
      hpToUse >= recalculated.resources.maxHp
        ? recalculated.resources.maxHp
        : hpToUse;
    
    const mpToUse = partial.mp !== undefined ? partial.mp : prev.mp;
    const safeMp =
      mpToUse === undefined ||
      mpToUse <= 0 ||
      mpToUse >= recalculated.resources.maxMp
        ? recalculated.resources.maxMp
        : mpToUse;
    
    const cpToUse = partial.cp !== undefined ? partial.cp : prev.cp;
    const safeCp =
      cpToUse === undefined ||
      cpToUse <= 0 ||
      cpToUse >= recalculated.resources.maxCp
        ? recalculated.resources.maxCp
        : cpToUse;
    
    updated = {
      ...updated,
      baseStats: recalculated.originalBaseStats, // Зберігаємо ОРИГІНАЛЬНІ базові стати (не зрощені)
      maxHp: recalculated.resources.maxHp, // Явно встановлюємо maxHp
      maxMp: recalculated.resources.maxMp, // Явно встановлюємо maxMp
      maxCp: recalculated.resources.maxCp, // Явно встановлюємо maxCp
      battleStats: recalculated.finalStats,
      // Оновлюємо hp/mp/cp тільки якщо потрібно (не в бою або level up)
      // Використовуємо safeHp/safeMp/safeCp, щоб не перезаписати правильні значення
      ...(shouldUpdateResources ? {
        hp: isLevelUp ? recalculated.resources.maxHp : safeHp,
        mp: isLevelUp ? recalculated.resources.maxMp : safeMp,
        cp: isLevelUp ? recalculated.resources.maxCp : safeCp,
      } : {}),
    };
  }

  return updated;
}

