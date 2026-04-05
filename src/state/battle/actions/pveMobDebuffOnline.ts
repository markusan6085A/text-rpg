import type { SkillDefinition } from "../../../data/skills/types";
import { pveBattleDebuffAPI } from "../../../utils/api/characters";
import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { battleStoreRef } from "../../battleStoreRef";
import { cleanupBuffs, mergeServerHeroBuffsRespectLocalToggleOff } from "../helpers";
import { loadBattle, persistBattle } from "../persist";
import {
  buffedResourcesFromPveServerSnapshot,
  logPveBuffedResourceDebug,
} from "../../../utils/heroBuffedResources";
import { applyRevisionConflictFromApiError } from "../../heroStore";
import { runSerializedPveMutation } from "./pveMutationQueue";
import { createCooldownEntry } from "./useSkill/helpers";
import { getMaxResources } from "../helpers/getMaxResources";

/**
 * Онлайн PvE: дебаф/стан на моба через POST .../pve-battle-debuff (CAS + snapshot у battleSession).
 */
export function schedulePveMobDebuffOnline(args: {
  skillId: number;
  def: SkillDefinition;
  cooldownDurationMs: number;
  now: number;
  onFallback: () => void;
}): void {
  const { skillId, def, cooldownDurationMs, now, onFallback } = args;
  const hero = useHeroStore.getState().hero;
  const cid =
    String(useCharacterStore.getState().characterId ?? "").trim() ||
    String((hero as any)?.id ?? "").trim();
  if (!cid || !hero?.name) return;

  const expectedRevisionRaw =
    useHeroStore.getState().serverState?.heroRevision ?? (hero as any)?.heroJson?.heroRevision ?? 0;
  const expectedRevision = Number(expectedRevisionRaw);
  if (!Number.isFinite(expectedRevision) || expectedRevision < 0) return;

  void runSerializedPveMutation(async () => {
    try {
      const res = await pveBattleDebuffAPI(cid, { skillId, expectedRevision });
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const hj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      const tickNow = Date.now();
      const liveBattleBuffs = battleStoreRef.getState()?.heroBuffs || [];
      const clientBattle = cleanupBuffs(liveBattleBuffs, tickNow);
      const heroForBuffMerge = store.hero ?? hero;
      const mergedToggleHeroBuffs = mergeServerHeroBuffsRespectLocalToggleOff(
        heroForBuffMerge,
        hj.heroBuffs,
        clientBattle,
        tickNow,
      );
      const br = buffedResourcesFromPveServerSnapshot({
        hj,
        liveHero: heroForBuffMerge,
        mergedHeroBuffs: mergedToggleHeroBuffs,
        fallbackBase: getMaxResources(heroForBuffMerge),
      });
      logPveBuffedResourceDebug("pve-mob-debuff", {
        serverBaseHp: br.rawBase.hp,
        serverBaseMaxHp: br.baseCaps.maxHp,
        buffedMaxHp: br.buffedCaps.maxHp,
        computedBuffedHp: br.hp,
      });
      const hjMerged = { ...hj, heroBuffs: mergedToggleHeroBuffs };
      store.applyServerSync(
        {
          hp: br.hp,
          mp: br.mp,
          cp: br.cp,
          heroJson: { ...prevHj, ...hjMerged },
        } as any,
        {
          heroRevision: hj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        },
      );

      const heroName = store.hero?.name;
      if (!heroName) return;
      const line = (res as any).logLine || `${def.name}`;
      const saved = loadBattle(heroName) || {};
      const heroAfter = useHeroStore.getState().hero;
      const sessAfter = ((heroAfter as any)?.heroJson || {})?.battleSession;
      const bs = battleStoreRef.getState();
      const mobBuffsNext = Array.isArray(sessAfter?.mobBuffs)
        ? cleanupBuffs(sessAfter.mobBuffs as any[], tickNow)
        : bs?.mobBuffs || [];
      const prevCd = { ...(bs?.cooldowns || {}) };
      const nextCooldowns = { ...prevCd, ...createCooldownEntry(skillId, cooldownDurationMs, now) };

      const battlePatch: Record<string, unknown> = {
        mobBuffs: mobBuffsNext,
        log: [line, ...(bs?.log || [])].slice(0, 30),
        cooldowns: nextCooldowns,
      };
      if (typeof sessAfter?.mobStunnedUntil === "number" && Number.isFinite(sessAfter.mobStunnedUntil)) {
        battlePatch.mobStunnedUntil = sessAfter.mobStunnedUntil;
      }

      if (bs && battleStoreRef.setState) {
        battleStoreRef.setState(battlePatch as any);
      }
      const persistPayload: Record<string, unknown> = {
        ...saved,
        mobBuffs: mobBuffsNext,
        log: [line, ...((saved as any).log || [])].slice(0, 30),
        cooldowns: nextCooldowns,
      };
      if (typeof sessAfter?.mobStunnedUntil === "number" && Number.isFinite(sessAfter.mobStunnedUntil)) {
        persistPayload.mobStunnedUntil = sessAfter.mobStunnedUntil;
      }
      persistBattle(persistPayload as any, heroName);
    } catch (e: any) {
      const st = Number(e?.status);
      if (st === 409) applyRevisionConflictFromApiError(e);
      const errCode = String((e as any)?.body?.error ?? "");
      const tryLocal =
        typeof onFallback === "function" &&
        (st === 404 || (st === 400 && errCode === "no_effect"));
      if (tryLocal) {
        try {
          onFallback();
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[pve-battle-debuff] fallback failed", err);
        }
        return;
      }
      void import("../../toastStore").then(({ showToast }) => {
        showToast("Не вдалося накласти дебаф. Оновіть або спробуйте знову.", "error");
      });
      void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
    }
  });
}
