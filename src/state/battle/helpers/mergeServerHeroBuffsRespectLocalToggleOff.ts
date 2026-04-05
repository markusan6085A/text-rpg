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
  const locBySkillId = new Map<number, any>();
  for (const b of loc) {
    const id = Number(b?.id);
    if (Number.isFinite(id)) locBySkillId.set(id, b);
    if (Number(b?.expiresAt) !== TOGGLE_EXPIRES) continue;
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

  // PvE tick/attack з сервера майже не рухають lastTickAt у toggle (немає mpPerTick на кроці моба в snapshot).
  // Якщо брати серверний lastTickAt як істину, після кожного tick локальний regen «доганяє» миттєво сотні
  // інтервалів і вимикає ауру (newMP < 0) — «Ваша аура закінчилася» + фальшивий дрен MP.
  const filteredWithLocalToggleClock = filtered.map((b) => {
    if (Number(b?.expiresAt) !== TOGGLE_EXPIRES) return b;
    const id = Number(b?.id);
    if (!Number.isFinite(id)) return b;
    const def = getSkillDefForBattle(hero?.profession ?? null, hero?.klass, hero?.race, id);
    if (!def || !skillDefIsToggle(def)) return b;
    const lb = locBySkillId.get(id);
    if (!lb) return b;
    const sTick = Math.max(Number(b.lastTickAt) || 0, Number(b.startedAt) || 0);
    const lTick = Math.max(Number(lb.lastTickAt) || 0, Number(lb.startedAt) || 0);
    if (lTick > sTick) return { ...b, lastTickAt: lTick };
    return b;
  });

  const keys = new Set(filteredWithLocalToggleClock.map(buffDedupeKey));
  const extras = loc.filter((b) => !keys.has(buffDedupeKey(b)));
  return [...filteredWithLocalToggleClock, ...extras];
}
