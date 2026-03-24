import type { Hero } from "../../types/Hero";
import { useBattleStore } from "./store";
import { BASE_ATTACK_ID, clearLoadout, getSkillDefForBattle, loadLoadout, saveLoadout } from "./loadout";
import { loadBattle, persistBattle } from "./persist";

function skillIdsSignature(skills: Hero["skills"]): string {
  if (!Array.isArray(skills)) return "";
  return [...new Set(skills.map((s: any) => Number(s?.id)).filter((x) => !Number.isNaN(x)))].sort((a, b) => a - b).join(",");
}

function sanitizeSlots(slots: (number | string | null)[], hero: Hero): (number | string | null)[] {
  const learned = new Set(
    (Array.isArray(hero.skills) ? hero.skills : []).map((s: any) => Number(s?.id)).filter((x) => !Number.isNaN(x))
  );
  const out = slots.map((slot) => {
    if (slot === null || slot === undefined) return null;
    if (typeof slot === "string") return slot;
    const n = Number(slot);
    if (n === BASE_ATTACK_ID) return BASE_ATTACK_ID;
    if (!learned.has(n)) return null;
    const def = getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, n);
    if (!def) return null;
    if (def.category === "passive") return null;
    return n;
  });
  if (!out.length) return [BASE_ATTACK_ID, null];
  if (out[0] === null || out[0] === undefined) out[0] = BASE_ATTACK_ID;
  return out;
}

/**
 * Після зміни професії — чистий loadout; після зміни списку скілів — прибираємо неіснуючі id з панелі.
 * Викликати з heroStore після оновлення героя.
 */
export function syncBattleLoadoutAfterHeroChange(prev: Hero | null, next: Hero | null): void {
  if (!next?.name) return;
  const name = next.name;
  const profChanged = !!prev && prev.profession !== next.profession;
  const klassChanged = !!prev && prev.klass !== next.klass;
  const skillsChanged = skillIdsSignature(prev?.skills) !== skillIdsSignature(next.skills);

  if (profChanged || klassChanged) {
    clearLoadout(name);
    const fresh = loadLoadout(name);
    useBattleStore.setState({ loadoutSlots: fresh });
    const saved = loadBattle(name) || {};
    persistBattle(
      {
        ...saved,
        loadoutSlots: fresh,
        professionForLoadout: next.profession,
        heroBuffs: [],
        heroName: name,
      },
      name
    );
    saveLoadout(name, fresh);
    return;
  }

  if (!skillsChanged) return;

  const currentSlots = useBattleStore.getState().loadoutSlots ?? loadLoadout(name);
  const sanitized = sanitizeSlots([...currentSlots], next);
  useBattleStore.setState({ loadoutSlots: sanitized });
  saveLoadout(name, sanitized);
  const saved = loadBattle(name) || {};
  persistBattle(
    {
      ...saved,
      loadoutSlots: sanitized,
      professionForLoadout: next.profession,
      heroName: name,
    },
    name
  );
}
