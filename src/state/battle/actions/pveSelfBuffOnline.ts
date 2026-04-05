import type { SkillDefinition } from "../../../data/skills/types";
import { pveCastSelfBuffAPI } from "../../../utils/api/characters";
import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { battleStoreRef } from "../../battleStoreRef";
import { cleanupBuffs } from "../helpers";
import { loadBattle, persistBattle } from "../persist";
import { skillDefIsToggle } from "../loadout";
import {
  mergeServerAndClientBuffsForResourceScaling,
  pveSnapshotBaseCaps,
  scalePveSnapshotHpMpCpToBuffed,
} from "../../../utils/heroBuffedResources";
import { filterBuffsForHeroProfession } from "../loadout";
import { applyRevisionConflictFromApiError } from "../../heroStore";
import { runSerializedPveMutation } from "./pveMutationQueue";
import { getMaxResources } from "../helpers/getMaxResources";

function mergeCooldowns(skillId: number, def: SkillDefinition, cleaned: any[], now: number): Record<string, number> {
  const bs = battleStoreRef.getState();
  const prev = (bs?.cooldowns || {}) as Record<string, number>;
  const next = { ...prev };
  const isToggleSkill = skillDefIsToggle(def);
  if (isToggleSkill) {
    const buffOn = cleaned.some(
      (b: any) => Number(b?.id) === skillId && Number(b.expiresAt) === Number.MAX_SAFE_INTEGER
    );
    if (buffOn) {
      delete next[skillId];
    } else {
      next[skillId] = now + (def.cooldown ?? 1) * 1000;
    }
  } else {
    const baseSec = def.cooldown ?? 5;
    next[skillId] = now + baseSec * 1000;
  }
  return next;
}

/**
 * Онлайн: спочатку POST .../pve-self-buff (snapshot). Якщо прод ще без маршруту (404) — onFallback (локальний handleBuffSkill + hero-buffs-sync).
 */
export function schedulePveSelfBuffOnline(
  skillId: number,
  def: SkillDefinition,
  onFallback?: () => void
): void {
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
      const res = await pveCastSelfBuffAPI(cid, { skillId, expectedRevision });
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const hj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      const now = Date.now();
      const clientBattle = cleanupBuffs(battleStoreRef.getState()?.heroBuffs || [], now);
      const heroSync = store.hero;
      const mergedBuffs = mergeServerAndClientBuffsForResourceScaling(hj.heroBuffs, clientBattle);
      const buffsForScale = heroSync
        ? cleanupBuffs(filterBuffsForHeroProfession(heroSync, mergedBuffs), now)
        : cleanupBuffs(mergedBuffs, now);
      const baseCapsSelf = pveSnapshotBaseCaps(hj, heroSync ? getMaxResources(heroSync) : null);
      const scaledRes = scalePveSnapshotHpMpCpToBuffed(hj, buffsForScale, now, baseCapsSelf);
      store.applyServerSync(
        {
          hp: scaledRes.hp,
          mp: scaledRes.mp,
          cp: scaledRes.cp,
          heroJson: { ...prevHj, ...hj },
        } as any,
        {
          heroRevision: hj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        }
      );

      const heroName = store.hero?.name;
      if (!heroName) return;
      const raw = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
      const cleaned = cleanupBuffs(raw as any, now);
      const line = (res as any).logLine || `Вы использовали ${def.name}`;
      const saved = loadBattle(heroName) || {};
      const nextCooldowns = mergeCooldowns(skillId, def, cleaned, now);
      const bs = battleStoreRef.getState();
      if (bs && battleStoreRef.setState) {
        battleStoreRef.setState({
          heroBuffs: cleaned,
          log: [line, ...(bs.log || [])].slice(0, 30),
          cooldowns: nextCooldowns,
        });
      }
      persistBattle(
        {
          ...saved,
          heroBuffs: cleaned,
          log: [line, ...((saved as any).log || [])].slice(0, 30),
          cooldowns: nextCooldowns,
        },
        heroName
      );
    } catch (e: any) {
      const st = Number(e?.status);
      if (st === 409) applyRevisionConflictFromApiError(e);
      if (st === 404 && typeof onFallback === "function") {
        if (import.meta.env.DEV) {
          console.warn("[pve-self-buff] 404 — fallback до локального касту (задеплойте API)");
        }
        try {
          onFallback();
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[pve-self-buff] fallback failed", err);
        }
        return;
      }
      void import("../../toastStore").then(({ showToast }) => {
        showToast("Не вдалося застосувати навик. Оновіть або спробуйте знову.", "error");
      });
      void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
    }
  });
}
