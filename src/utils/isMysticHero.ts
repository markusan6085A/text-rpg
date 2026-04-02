import type { Hero } from "../types/Hero";

/** Чи герой на ланцюжку містика (книги та гільдія магів). */
export function isMysticHero(hero: Hero | null | undefined): boolean {
  if (!hero) return false;
  const klass = String(hero.klass ?? "");
  if (/mystic|маг/i.test(klass)) return true;
  const p = String(hero.profession ?? "").toLowerCase();
  return (
    p.includes("mystic") ||
    p.includes("_cleric") ||
    p.includes("_wizard") ||
    p.includes("_oracle") ||
    p.includes("_shaman") ||
    p.includes("_elder") ||
    p.includes("bishop") ||
    p.includes("prophet")
  );
}
