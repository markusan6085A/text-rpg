import type { Hero } from "../../types/Hero";
import { normalizeLevelExpPair } from "../../data/expTable";
import { isSevenSealsInventoryClearDay } from "../../utils/sevenSealsTime";
import { mergeActiveSevenSealsBonus } from "../../utils/sevenSealsBonus";

/**
 * 🔥 КРИТИЧНО: Одна точка синхронізації hero ↔ heroJson
 * 
 * Правило: hero.* - єдине джерело істини
 * heroJson - лише для серіалізації на сервер
 * 
 * Ця функція гарантує консистентність:
 * - hero.skills, hero.mobsKilled, hero.exp, hero.level - офіційні поля
 * - heroJson.* - синхронізовані копії для збереження
 */

export function hydrateHero(hero: Hero | null): Hero | null {
  if (!hero) return null;

  const hj = (hero as any).heroJson ?? {};

  // Медалі 7 Печатей: лише неділя (Europe/Warsaw) — тиждень збору Пн–Сб закрито; у інвентарі не показуємо стек
  let inventory = hero.inventory;
  if (isSevenSealsInventoryClearDay() && Array.isArray(inventory) && inventory.length > 0) {
    inventory = inventory.filter((item: any) => item && item.id !== "seven_seals_medal") as Hero["inventory"];
  }
  
  // 🔥 Правило: hero.* має пріоритет, але якщо його немає - беремо з heroJson (для міграції)
  const skills = Array.isArray(hero.skills) && hero.skills.length > 0
    ? hero.skills
    : (Array.isArray(hj.skills) && hj.skills.length > 0 ? hj.skills : []);
  
  const mobsKilled = (hero as any).mobsKilled !== undefined && (hero as any).mobsKilled !== null
    ? (hero as any).mobsKilled
    : (hj.mobsKilled !== undefined && hj.mobsKilled !== null ? hj.mobsKilled : 0);
  
  // 🔥 Number() — API/мобільний повертає exp/level як string, потрібні числа для level-up
  let exp = hero.exp !== undefined && hero.exp !== null
    ? Number(hero.exp) || 0
    : (hj.exp !== undefined && hj.exp !== null ? Number(hj.exp) || 0 : 0);
  
  let level = hero.level !== undefined && hero.level !== null && hero.level > 0
    ? Number(hero.level) || 1
    : (hj.level !== undefined && hj.level !== null && hj.level > 0 ? Number(hj.level) || 1 : 1);

  const sp =
    hero.sp !== undefined && hero.sp !== null
      ? Number(hero.sp) || 0
      : (hj.sp !== undefined && hj.sp !== null ? Number(hj.sp) || 0 : 0);

  const normXp = normalizeLevelExpPair(level, exp);
  level = normXp.level;
  exp = normXp.exp;

  // 🔥 Синхронізуємо heroJson з hero (однонапрямкова синхронізація: hero → heroJson)
  // 🔥 КРИТИЧНО: Сервер вимагає обов'язкові поля в heroJson: name, race, classId/klass
  // 🔥 dailyQuests — hero.dailyQuests* має пріоритет, інакше беремо з heroJson (для load)
  const dailyQuestsProgress = (hero as any).dailyQuestsProgress !== undefined && typeof (hero as any).dailyQuestsProgress === "object"
    ? (hero as any).dailyQuestsProgress
    : (hj.dailyQuestsProgress && typeof hj.dailyQuestsProgress === "object" ? hj.dailyQuestsProgress : {});
  const dailyQuestsCompleted = Array.isArray((hero as any).dailyQuestsCompleted) ? (hero as any).dailyQuestsCompleted
    : (Array.isArray(hj.dailyQuestsCompleted) ? hj.dailyQuestsCompleted : []);
  const dailyQuestsResetDate = (hero as any).dailyQuestsResetDate ?? hj.dailyQuestsResetDate ?? null;
  const activeQuests = Array.isArray(hero.activeQuests) ? hero.activeQuests
    : (Array.isArray(hj.activeQuests) ? hj.activeQuests : []);

  const mergedSevenSealsBonus = mergeActiveSevenSealsBonus(hj.sevenSealsBonus, (hero as any).sevenSealsBonus);

  const hydratedHero: Hero = {
    ...hero,
    ...(mergedSevenSealsBonus ? { sevenSealsBonus: mergedSevenSealsBonus as any } : {}),
    inventory: inventory ?? hero.inventory,
    skills,
    mobsKilled: mobsKilled as any,
    exp,
    level,
    sp,
    dailyQuestsProgress: dailyQuestsProgress as any,
    dailyQuestsCompleted: dailyQuestsCompleted as any,
    dailyQuestsResetDate: dailyQuestsResetDate as any,
    activeQuests: activeQuests as any,
    heroJson: {
      ...hj,
      ...(mergedSevenSealsBonus ? { sevenSealsBonus: mergedSevenSealsBonus } : {}),
      // 🔥 КРИТИЧНО: heroJson завжди синхронізований з hero (для серіалізації)
      name: hero.name || hj.name || '',
      race: hero.race || hj.race || '',
      klass: hero.klass || hj.klass || '',
      classId: hero.klass || hj.classId || hj.klass || '',
      gender: hero.gender || hj.gender || '',
      profession: hero.profession || hj.profession || '',
      skills,
      mobsKilled,
      exp,
      level,
      sp,
      // inventory як у відфільтрованого hero (неділя — без медалей 7 Печатей)
      inventory: Array.isArray(inventory) ? inventory : (Array.isArray(hj.inventory) ? hj.inventory : []),
      // Щоденні завдання та активні квести — синхронізуємо в heroJson для збереження
      dailyQuestsProgress,
      dailyQuestsCompleted,
      dailyQuestsResetDate,
      activeQuests,
      // Соціальний статус (екран персонажа) — зберігається в heroJson для PUT і публічного профілю
      status: (hero as any).status ?? hj.status ?? "",
    },
  };

  return hydratedHero;
}
