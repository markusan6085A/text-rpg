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
export function hydrateHero(hero: Hero | null): Hero | null {
  if (!hero) return null;

  const hj = (hero as any).heroJson ?? {};
  
  // 🔥 Правило: hero.* має пріоритет, але якщо його немає - беремо з heroJson (для міграції)
  const skills = Array.isArray(hero.skills) && hero.skills.length > 0
    ? hero.skills
    : (Array.isArray(hj.skills) && hj.skills.length > 0 ? hj.skills : []);
  
  const mobsKilled = (hero as any).mobsKilled !== undefined && (hero as any).mobsKilled !== null
    ? (hero as any).mobsKilled
    : (hj.mobsKilled !== undefined && hj.mobsKilled !== null ? hj.mobsKilled : 0);
  
  const exp = hero.exp !== undefined && hero.exp !== null
    ? hero.exp
    : (hj.exp !== undefined && hj.exp !== null ? hj.exp : 0);
  
  const level = hero.level !== undefined && hero.level !== null && hero.level > 0
    ? hero.level
    : (hj.level !== undefined && hj.level !== null && hj.level > 0 ? hj.level : 1);

  // 🔥 Синхронізуємо heroJson з hero (однонапрямкова синхронізація: hero → heroJson)
  // 🔥 КРИТИЧНО: Сервер вимагає обов'язкові поля в heroJson: name, race, classId/klass
  const hydratedHero: Hero = {
    ...hero,
    skills,
    mobsKilled: mobsKilled as any,
    exp,
    level,
    heroJson: {
      ...hj,
      // 🔥 КРИТИЧНО: heroJson завжди синхронізований з hero (для серіалізації)
      // Базові поля (обов'язкові для сервера)
      name: hero.name || hj.name || '',
      race: hero.race || hj.race || '',
      klass: hero.klass || hj.klass || '',
      classId: hero.klass || hj.classId || hj.klass || '',
      gender: hero.gender || hj.gender || '',
      profession: hero.profession || hj.profession || '',
      // Прогрес (skills, mobsKilled, exp, level)
      skills,
      mobsKilled,
      exp,
      level,
    },
  };

  return hydratedHero;
}
