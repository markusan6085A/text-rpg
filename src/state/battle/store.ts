import { create } from "zustand";
import { initialState } from "./initialState";
import { createBattleActions } from "./actions";
import type { BattleState } from "./types";
import { loadBattle, BATTLE_VERSION } from "./persist";
import { useHeroStore } from "../heroStore";

/** Відновлення стану бою з localStorage. Викликається всередині create(), щоб useHeroStore вже був ініціалізований (уникаємо циклу та "Cannot access before initialization"). */
function getRestoredState(): Partial<BattleState> {
  const hero = useHeroStore.getState().hero;
  const heroName = hero?.name;
  const saved = loadBattle(heroName);

  const belongsToCurrentHero = heroName
    ? (!saved?.heroName || saved.heroName === heroName)
    : false;
  const isVersionCompatible = saved?.version === BATTLE_VERSION || !saved?.version;
  const restoredSummon = saved?.summon && saved.summon.hp > 0 ? saved.summon : null;

  if (import.meta.env.DEV) {
    console.log("[battleStore] init", {
      heroName: heroName || "null",
      hasHero: !!hero,
      hasSavedState: !!saved,
      savedHeroName: saved?.heroName || "none",
      savedVersion: saved?.version || "none",
      belongsToCurrentHero,
      isVersionCompatible,
      willRestore: !!(saved && belongsToCurrentHero && isVersionCompatible),
    });
  }

  if (!saved || !belongsToCurrentHero || !isVersionCompatible) return {};

  return {
    heroName: saved.heroName,
    summon: restoredSummon,
    summonLastAttackAt: saved.summonLastAttackAt,
    summonBuffs: saved.summonBuffs || [],
    baseSummonStats: saved.baseSummonStats,
    heroBuffs: restoredSummon ? (saved.heroBuffs || []) : (saved.heroBuffs || []).filter((b: any) => b.id !== 1262 && b.id !== 1332),
    cooldowns: saved.cooldowns || {},
    loadoutSlots: saved.loadoutSlots || initialState.loadoutSlots,
    activeChargeSlots: saved.activeChargeSlots ?? initialState.activeChargeSlots,
    log: saved.log || [],
  };
}

export const useBattleStore = create<BattleState>((set, get, api) => ({
  ...initialState,
  ...getRestoredState(),
  ...createBattleActions(set, get, api),
}));
