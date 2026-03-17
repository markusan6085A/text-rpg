import type { Hero } from "../../types/Hero";

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
/** Субота/неділя (польський час) — медалі 7 Печатей зникають */
function isSevenSealsOffPeriod(): boolean {
  const polandTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  const day = polandTime.getDay();
  return day === 0 || day === 6; // Неділя або субота
}

export function hydrateHero(hero: Hero | null): Hero | null {
  if (!hero) return null;

  const hj = (hero as any).heroJson ?? {};

  // 🔥 Медалі 7 Печатей: в суботу 00:00 зникають, з понеділка знову падають
  let inventory = hero.inventory;
  if (isSevenSealsOffPeriod() && Array.isArray(inventory) && inventory.length > 0) {
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
  const exp = hero.exp !== undefined && hero.exp !== null
    ? Number(hero.exp) || 0
    : (hj.exp !== undefined && hj.exp !== null ? Number(hj.exp) || 0 : 0);
  
  const level = hero.level !== undefined && hero.level !== null && hero.level > 0
    ? Number(hero.level) || 1
    : (hj.level !== undefined && hj.level !== null && hj.level > 0 ? Number(hj.level) || 1 : 1);

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

  const hydratedHero: Hero = {
    ...hero,
    inventory: inventory ?? hero.inventory,
    skills,
    mobsKilled: mobsKilled as any,
    exp,
    level,
    dailyQuestsProgress: dailyQuestsProgress as any,
    dailyQuestsCompleted: dailyQuestsCompleted as any,
    dailyQuestsResetDate: dailyQuestsResetDate as any,
    activeQuests: activeQuests as any,
    heroJson: {
      ...hj,
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
      // 🔥 inventory з hero — інакше після «Очистить» heroJson.inventory лишається старим
      inventory: Array.isArray(hero.inventory) ? hero.inventory : (Array.isArray(hj.inventory) ? hj.inventory : []),
      // Щоденні завдання та активні квести — синхронізуємо в heroJson для збереження
      dailyQuestsProgress,
      dailyQuestsCompleted,
      dailyQuestsResetDate,
      activeQuests,
    },
  };

  return hydratedHero;
}
