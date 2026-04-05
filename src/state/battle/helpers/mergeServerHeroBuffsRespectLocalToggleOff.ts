import type { Hero } from "../../../types/Hero";
import { cleanupBuffs } from "./buffs";
import { getSkillDefForBattle, skillDefIsToggle } from "../loadout";

const TOGGLE_EXPIRES = Number.MAX_SAFE_INTEGER;

function buffDedupeKey(b: any): string {
  const id = Number(b?.id);
  if (Number.isFinite(id)) return `id:${id}`;
  return `n:${String(b?.name ?? "")}`;
}

/**
 * pve-battle-attack / tick повертають heroBuffs з БД; після вимкнення toggle локально sync ще не встиг —
 * сервер шле старий "on". Не відновлювати toggle-баф, якщо в бойовому списку його вже немає.
 * Додаємо з локального списку те, чого немає у відфільтрованому серверному (свої бафи з міста тощо).
 */
export function mergeServerHeroBuffsRespectLocalToggleOff(
  hero: Hero | null | undefined,
  serverBuffs: any[] | undefined,
  localBattleBuffs: any[] | undefined,
  now: number,
): any[] {
  const srv = cleanupBuffs(Array.isArray(serverBuffs) ? serverBuffs : [], now);
  const loc = cleanupBuffs(Array.isArray(localBattleBuffs) ? localBattleBuffs : [], now);

  const localToggleOnIds = new Set<number>();
  for (const b of loc) {
    if (Number(b?.expiresAt) !== TOGGLE_EXPIRES) continue;
    const id = Number(b?.id);
    if (!Number.isFinite(id)) continue;
    const def = getSkillDefForBattle(hero?.profession ?? null, hero?.klass, hero?.race, id);
    if (def && skillDefIsToggle(def)) localToggleOnIds.add(id);
  }

  const filtered = srv.filter((b) => {
    if (Number(b?.expiresAt) !== TOGGLE_EXPIRES) return true;
    const id = Number(b?.id);
    if (!Number.isFinite(id)) return true;
    const def = getSkillDefForBattle(hero?.profession ?? null, hero?.klass, hero?.race, id);
    if (!def || !skillDefIsToggle(def)) return true;
    return localToggleOnIds.has(id);
  });

  const keys = new Set(filtered.map(buffDedupeKey));
  const extras = loc.filter((b) => !keys.has(buffDedupeKey(b)));
  return [...filtered, ...extras];
}
