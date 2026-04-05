import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { useAuthStore } from "../../authStore";
import { battleStoreRef } from "../../battleStoreRef";
import { pveBattleTickAPI } from "../../../utils/api/characters";
import { applyBuffsToStats, cleanupBuffs, mergeServerHeroBuffsRespectLocalToggleOff } from "../helpers";
import { persistBattle, loadBattle } from "../persist";
import type { BattleState } from "../types";
import {
  mergeServerAndClientBuffsForResourceScaling,
  scalePveSnapshotHpMpCpToBuffed,
} from "../../../utils/heroBuffedResources";
import { filterBuffsForHeroProfession } from "../loadout";

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

/** Сервер надсилає лише поля, виставлені цим ударом; інші не чіпаємо. Таймери — пізніший deadline wins. */
function mergeServerBattleControl(
  prev: Pick<BattleState, "heroStunnedUntil" | "heroBuffsBlockedUntil" | "heroSkillsBlockedUntil">,
  bc: Partial<{
    heroStunnedUntil: number;
    heroBuffsBlockedUntil: number;
    heroSkillsBlockedUntil: number;
  }>
): Partial<
  Pick<BattleState, "heroStunnedUntil" | "heroBuffsBlockedUntil" | "heroSkillsBlockedUntil">
> {
  const maxDeadline = (a?: number, b?: number): number | undefined => {
    const m = Math.max(Number(a) || 0, Number(b) || 0);
    return m > 0 ? m : undefined;
  };
  const out: Partial<
    Pick<BattleState, "heroStunnedUntil" | "heroBuffsBlockedUntil" | "heroSkillsBlockedUntil">
  > = {};
  if (typeof bc.heroStunnedUntil === "number" && Number.isFinite(bc.heroStunnedUntil)) {
    out.heroStunnedUntil = maxDeadline(prev.heroStunnedUntil, bc.heroStunnedUntil);
  }
  if (typeof bc.heroBuffsBlockedUntil === "number" && Number.isFinite(bc.heroBuffsBlockedUntil)) {
    out.heroBuffsBlockedUntil = maxDeadline(prev.heroBuffsBlockedUntil, bc.heroBuffsBlockedUntil);
  }
  if (typeof bc.heroSkillsBlockedUntil === "number" && Number.isFinite(bc.heroSkillsBlockedUntil)) {
    out.heroSkillsBlockedUntil = maxDeadline(prev.heroSkillsBlockedUntil, bc.heroSkillsBlockedUntil);
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
  if (!bs || bs.status !== "fighting") return;
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
      if (battleStoreRef.getState()?.status !== "fighting") return;
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const mergedHj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      const tickNow = Date.now();
      const clientBattle = cleanupBuffs(battleStoreRef.getState()?.heroBuffs || [], tickNow);
      const hSync = store.hero;
      const mergedToggleHeroBuffs = mergeServerHeroBuffsRespectLocalToggleOff(
        hSync,
        mergedHj.heroBuffs,
        clientBattle,
        tickNow,
      );
      const mergedBuffs = mergeServerAndClientBuffsForResourceScaling(mergedToggleHeroBuffs, clientBattle);
      const buffsForScale = hSync
        ? cleanupBuffs(filterBuffsForHeroProfession(hSync, mergedBuffs), tickNow)
        : cleanupBuffs(mergedBuffs, tickNow);
      const scaledRes = scalePveSnapshotHpMpCpToBuffed(mergedHj, buffsForScale, tickNow);
      const hjTickMerged = { ...mergedHj, heroBuffs: mergedToggleHeroBuffs };
      store.applyServerSync(
        {
          hp: scaledRes.hp,
          mp: scaledRes.mp,
          cp: scaledRes.cp,
          heroJson: { ...prevHj, ...hjTickMerged },
        } as any,
        {
          heroRevision: mergedHj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        }
      );

      const buffsSynced = cleanupBuffs(mergedToggleHeroBuffs, tickNow);

      const logLines: string[] = Array.isArray((res as any).logLines)
        ? (res as any).logLines.filter((x: any) => typeof x === "string")
        : [];
      const killedHero = (res as any).killedHero === true;
      const now = Date.now();
      const mobNextAt = now + 1000 + Math.random() * 5000;
      const heroName = store.hero?.name;
      const nextLog = [...logLines, ...(bs.log || [])].slice(0, 30);
      const bcRaw = (res as any).battleControl;
      const bc =
        bcRaw && typeof bcRaw === "object"
          ? (bcRaw as Partial<{
              heroStunnedUntil: number;
              heroBuffsBlockedUntil: number;
              heroSkillsBlockedUntil: number;
            }>)
          : null;
      const controlPatch =
        !killedHero && bc && battleStoreRef.getState
          ? mergeServerBattleControl(battleStoreRef.getState(), bc)
          : {};

      if (killedHero && battleStoreRef.setState) {
        battleStoreRef.setState({
          status: "idle",
          mobNextAttackAt: null,
          log: nextLog,
          heroBuffs: buffsSynced,
          heroStunnedUntil: undefined,
          heroBuffsBlockedUntil: undefined,
          heroSkillsBlockedUntil: undefined,
        });
        if (heroName) {
          const saved = loadBattle(heroName) || {};
          persistBattle(
            {
              ...saved,
              status: "idle",
              mobNextAttackAt: null,
              log: nextLog,
              heroBuffs: buffsSynced,
              heroStunnedUntil: undefined,
              heroBuffsBlockedUntil: undefined,
              heroSkillsBlockedUntil: undefined,
            } as any,
            heroName
          );
        }
        return;
      }

      if (battleStoreRef.setState) {
        battleStoreRef.setState({
          mobNextAttackAt: mobNextAt,
          log: nextLog,
          heroBuffs: buffsSynced,
          ...controlPatch,
        });
      }
      if (heroName) {
        const saved = loadBattle(heroName) || {};
        persistBattle({
          ...saved,
          mobNextAttackAt: mobNextAt,
          log: nextLog,
          heroBuffs: buffsSynced,
          ...controlPatch,
        } as any, heroName);
      }
    })
    .catch((e: any) => {
      const code = String(e?.body?.error ?? "");
      if (code === "no_battle_session" || code === "mob_dead") {
        const store = useHeroStore.getState();
        const h = store.hero;
        if (h && (h as any).heroJson) {
          const hj = { ...(h as any).heroJson } as Record<string, any>;
          delete hj.battleSession;
          store.updateHero({ heroJson: hj } as any, { skipServer: true });
        }
        if (battleStoreRef.setState) {
          battleStoreRef.setState({
            status: "idle",
            mobNextAttackAt: null,
            heroStunnedUntil: undefined,
            heroBuffsBlockedUntil: undefined,
            heroSkillsBlockedUntil: undefined,
          });
        }
        const name = useHeroStore.getState().hero?.name;
        if (name) {
          const saved = loadBattle(name) || {};
          persistBattle(
            {
              ...saved,
              status: "idle",
              mobNextAttackAt: null,
              heroStunnedUntil: undefined,
              heroBuffsBlockedUntil: undefined,
              heroSkillsBlockedUntil: undefined,
            } as any,
            name
          );
        }
        return;
      }
      if (battleStoreRef.getState()?.status === "fighting") {
        void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
      }
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
  if (battleStoreRef.getState()?.status !== "fighting") return false;
  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const sess = hj.battleSession;
  return !!(sess && Number(sess.v) === 1);
}
