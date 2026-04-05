import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { useAuthStore } from "../../authStore";
import { battleStoreRef } from "../../battleStoreRef";
import { pveBattleTickAPI } from "../../../utils/api/characters";
import {
  applyBuffsToStats,
  cleanupBuffs,
  computeBuffedMaxResources,
  mergeServerHeroBuffsRespectLocalToggleOff,
} from "../helpers";
import { persistBattle, loadBattle } from "../persist";
import type { BattleState } from "../types";
import {
  mergeHeroBuffsForPveResourceScaling,
  scalePveSnapshotHpMpCpToBuffed,
} from "../../../utils/heroBuffedResources";
import { filterBuffsForHeroProfession } from "../loadout";
import { applyRevisionConflictFromApiError } from "../../heroStore";
import { runSerializedPveMutation } from "./pveMutationQueue";
import { getMaxResources } from "../helpers/getMaxResources";

/** Другий тік не ставимо в чергу — один «інтент» за раз (наступний інтервал спробує знову). */
let tickScheduleBusy = false;

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
  if (tickScheduleBusy) return;

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

  tickScheduleBusy = true;
  if (typeof bs.mobHP === "number" && bs.mobHP <= 0) {
    tickScheduleBusy = false;
    return;
  }
  const expectedRevisionRaw =
    useHeroStore.getState().serverState?.heroRevision ?? hj.heroRevision ?? 0;
  const expectedRevision = Number(expectedRevisionRaw);

  const heroStats = applyBuffsToStats(hero.battleStats || {}, bs.heroBuffs || []);

  void runSerializedPveMutation(async () => {
    try {
      const heroJsonBeforeTick = ((useHeroStore.getState().hero as any)?.heroJson || {}) as Record<string, any>;
      const res = await pveBattleTickAPI(cid, {
        expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        heroDefenseStats: pickDefenseStatsForServer(heroStats as any),
      });
      if (battleStoreRef.getState()?.status !== "fighting") return;
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const mergedHj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const srvHpAfter = Math.floor(Number((res as any).heroHpAfter));
      if (Number.isFinite(srvHpAfter) && srvHpAfter >= 0) {
        mergedHj.hp = srvHpAfter;
      }
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
      const forScaleRaw = mergeHeroBuffsForPveResourceScaling(
        mergedHj.heroBuffs,
        heroJsonBeforeTick.heroBuffs,
        clientBattle,
      );
      const buffsForScale = hSync
        ? cleanupBuffs(filterBuffsForHeroProfession(hSync, forScaleRaw), tickNow)
        : cleanupBuffs(forScaleRaw, tickNow);
      const liveHero = store.hero;
      const baseCaps = liveHero ? getMaxResources(liveHero) : null;
      const scaledRes = scalePveSnapshotHpMpCpToBuffed(
        mergedHj,
        buffsForScale,
        tickNow,
        baseCaps,
      );
      const bmh = Math.max(1, Math.floor(baseCaps?.maxHp ?? Number(mergedHj.maxHp ?? 1)));
      const bmm = Math.max(1, Math.floor(baseCaps?.maxMp ?? Number(mergedHj.maxMp ?? 1)));
      const bmc = Math.max(1, Math.floor(baseCaps?.maxCp ?? Number(mergedHj.maxCp ?? 1)));
      const buffedCaps = computeBuffedMaxResources({ maxHp: bmh, maxMp: bmm, maxCp: bmc }, buffsForScale as any);

      const prevBHp = Math.floor(Number(heroJsonBeforeTick.hp ?? NaN));
      const prevBMp = Math.floor(Number(heroJsonBeforeTick.mp ?? NaN));
      const prevBCp = Math.floor(Number(heroJsonBeforeTick.cp ?? NaN));
      const srvBHp = Math.floor(Number(mergedHj.hp ?? NaN));
      const srvBMp = Math.floor(Number(mergedHj.mp ?? NaN));
      const srvBCp = Math.floor(Number(mergedHj.cp ?? NaN));
      const unchangedHp = Number.isFinite(prevBHp) && Number.isFinite(srvBHp) && srvBHp === prevBHp;
      const unchangedMp = Number.isFinite(prevBMp) && Number.isFinite(srvBMp) && srvBMp === prevBMp;
      const unchangedCp = Number.isFinite(prevBCp) && Number.isFinite(srvBCp) && srvBCp === prevBCp;

      const clampRes = (v: number, cap: number) =>
        Math.min(Math.max(1, Math.floor(cap)), Math.max(0, Math.round(Number(v) || 0)));

      // HP: сервер зменшив — тільки scaled; інакше не відкочувати локальний реген (live > scaled).
      const scaledHp = clampRes(scaledRes.hp, buffedCaps.maxHp);
      let finalHp = scaledHp;
      if (unchangedHp) {
        const live = Number(liveHero?.hp);
        if (Number.isFinite(live)) {
          const liveH = clampRes(live, buffedCaps.maxHp);
          if (liveH > scaledHp) finalHp = liveH;
        }
      }

      // MP/CP на tick сервер не чіпає — live (реген, toggle drain) інакше затирається знімком після regenTick.
      const pickLiveOrScaled = (unchanged: boolean, liveRaw: unknown, scaledVal: number, cap: number) => {
        const s = clampRes(scaledVal, cap);
        if (!unchanged) return s;
        const live = Number(liveRaw);
        if (!Number.isFinite(live)) return s;
        return clampRes(live, cap);
      };

      const finalMp = pickLiveOrScaled(unchangedMp, liveHero?.mp, scaledRes.mp, buffedCaps.maxMp);
      const finalCp = pickLiveOrScaled(unchangedCp, liveHero?.cp, scaledRes.cp, buffedCaps.maxCp);

      const hjTickMerged = { ...mergedHj, heroBuffs: mergedToggleHeroBuffs };
      store.applyServerSync(
        {
          hp: finalHp,
          mp: finalMp,
          cp: finalCp,
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
      const stLog = battleStoreRef.getState()?.log ?? [];
      const nextLog = [...logLines, ...stLog].slice(0, 30);
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

      const sessTick = mergedHj?.battleSession;
      const mobBuffsTick = Array.isArray(sessTick?.mobBuffs)
        ? cleanupBuffs(sessTick.mobBuffs as any[], tickNow)
        : [];
      const tickPatch: Record<string, unknown> = {
        mobNextAttackAt: mobNextAt,
        log: nextLog,
        heroBuffs: buffsSynced,
        mobBuffs: mobBuffsTick,
        ...controlPatch,
      };
      if (typeof sessTick?.mobStunnedUntil === "number" && Number.isFinite(sessTick.mobStunnedUntil)) {
        tickPatch.mobStunnedUntil = sessTick.mobStunnedUntil;
      }
      if (battleStoreRef.setState) {
        battleStoreRef.setState(tickPatch as any);
      }
      if (heroName) {
        const saved = loadBattle(heroName) || {};
        persistBattle({ ...saved, ...tickPatch } as any, heroName);
      }
    } catch (e: any) {
      const code = String(e?.body?.error ?? "");
      if (Number(e?.status) === 409) {
        applyRevisionConflictFromApiError(e);
      }
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
    } finally {
      tickScheduleBusy = false;
    }
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
