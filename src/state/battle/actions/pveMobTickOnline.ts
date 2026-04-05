import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { useAuthStore } from "../../authStore";
import { battleStoreRef } from "../../battleStoreRef";
import { pveBattleTickAPI } from "../../../utils/api/characters";
import { applyBuffsToStats } from "../helpers";
import { persistBattle, loadBattle } from "../persist";

let tickInFlight = false;

function pickDefenseStatsForServer(heroStats: Record<string, any>): Record<string, number> {
  const keys = ["pDef", "mDef", "evasion", "invulnerable", "damageTakenReduction"];
  const out: Record<string, number> = {};
  for (const k of keys) {
    const n = Number(heroStats[k]);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/**
 * Серверний крок удару моба. При помилці — тихий fallback на локальний processMobAttack через виклик з Layout.
 */
export function schedulePveMobTickOnline(): void {
  if (tickInFlight) return;

  const hero = useHeroStore.getState().hero;
  const token = useAuthStore.getState().accessToken;
  const cid = String(useCharacterStore.getState().characterId ?? "").trim();
  const hid = String((hero as any)?.id ?? "").trim();
  const bs = battleStoreRef.getState();
  if (!hero?.name || !token || !cid || hid !== cid) return;
  if (bs.zoneId === "fishing") return;
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const sess = hj.battleSession;
  if (!sess || Number(sess.v) !== 1) return;

  tickInFlight = true;
  const expectedRevisionRaw =
    useHeroStore.getState().serverState?.heroRevision ?? hj.heroRevision ?? 0;
  const expectedRevision = Number(expectedRevisionRaw);

  const heroStats = applyBuffsToStats(hero.battleStats || {}, bs.heroBuffs || []);

  void pveBattleTickAPI(cid, {
    expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
    heroDefenseStats: pickDefenseStatsForServer(heroStats as any),
  })
    .then((res) => {
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const mergedHj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      store.applyServerSync(
        {
          hp: mergedHj.hp,
          mp: mergedHj.mp,
          cp: mergedHj.cp,
          heroJson: { ...prevHj, ...mergedHj },
        } as any,
        {
          heroRevision: mergedHj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        }
      );

      const logLines: string[] = Array.isArray((res as any).logLines)
        ? (res as any).logLines.filter((x: any) => typeof x === "string")
        : [];
      const killedHero = (res as any).killedHero === true;
      const now = Date.now();
      const mobNextAt = now + 1000 + Math.random() * 5000;
      const heroName = store.hero?.name;
      const nextLog = [...logLines, ...(bs.log || [])].slice(0, 30);

      if (killedHero && battleStoreRef.setState) {
        battleStoreRef.setState({
          status: "idle",
          mobNextAttackAt: null,
          log: nextLog,
        });
        if (heroName) {
          const saved = loadBattle(heroName) || {};
          persistBattle({ ...saved, status: "idle", mobNextAttackAt: null, log: nextLog } as any, heroName);
        }
        return;
      }

      if (battleStoreRef.setState) {
        battleStoreRef.setState({
          mobNextAttackAt: mobNextAt,
          log: nextLog,
        });
      }
      if (heroName) {
        const saved = loadBattle(heroName) || {};
        persistBattle({ ...saved, mobNextAttackAt: mobNextAt, log: nextLog } as any, heroName);
      }
    })
    .catch(() => {
      void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
    })
    .finally(() => {
      tickInFlight = false;
    });
}

export function shouldUsePveServerMobTick(): boolean {
  const hero = useHeroStore.getState().hero;
  if (!useAuthStore.getState().accessToken) return false;
  const cid = String(useCharacterStore.getState().characterId ?? "").trim();
  const hid = String((hero as any)?.id ?? "").trim();
  if (!cid || hid !== cid) return false;
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const sess = hj.battleSession;
  return !!(sess && Number(sess.v) === 1);
}
