/**
 * Відновлення battle store з localStorage. Викликається з App після того, як heroStore готовий.
 * Винесено в окремий модуль, щоб у store.ts взагалі не імпортувати heroStore — інакше при
 * code-splitting (battle chunk) виникає "Cannot access 'Z' before initialization".
 */
import { useHeroStore } from "../heroStore";
import { useBattleStore } from "./store";
import { loadBattle, BATTLE_VERSION } from "./persist";
import { initialState } from "./initialState";
import type { BattleState } from "./types";

let hydrated = false;

export function hydrateBattleStoreFromStorage(): void {
  if (hydrated) return;
  try {
    const hero = useHeroStore.getState().hero;
    const heroName = hero?.name ?? null;
    const saved = loadBattle(heroName);
    if (!saved || typeof saved !== "object") return;

    const belongsToCurrentHero = heroName
      ? (!saved.heroName || saved.heroName === heroName)
      : false;
    const isVersionCompatible = saved.version === BATTLE_VERSION || saved.version == null;
    if (!belongsToCurrentHero || !isVersionCompatible) return;

    const restoredSummon = saved.summon && saved.summon.hp > 0 ? saved.summon : null;
    const restored: Partial<BattleState> = {
      heroName: saved.heroName,
      summon: restoredSummon,
      summonLastAttackAt: saved.summonLastAttackAt,
      summonBuffs: saved.summonBuffs ?? [],
      baseSummonStats: saved.baseSummonStats,
      heroBuffs: restoredSummon
        ? (saved.heroBuffs ?? [])
        : (saved.heroBuffs ?? []).filter((b: any) => b.id !== 1262 && b.id !== 1332),
      cooldowns: saved.cooldowns ?? {},
      loadoutSlots: saved.loadoutSlots ?? initialState.loadoutSlots,
      activeChargeSlots: saved.activeChargeSlots ?? initialState.activeChargeSlots,
      log: saved.log ?? [],
    };
    useBattleStore.setState(restored);
    hydrated = true;
    if (import.meta.env.DEV) {
      console.log("[battleStore] hydrated from storage", { heroName, restoredFields: Object.keys(restored) });
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[battleStore] hydrate failed", e);
  }
}
