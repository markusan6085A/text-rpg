/**
 * Відновлення battle store з localStorage. Викликається з App після того, як heroStore готовий.
 * Винесено в окремий модуль, щоб у store.ts взагалі не імпортувати heroStore — інакше при
 * code-splitting (battle chunk) виникає "Cannot access 'Z' before initialization".
 */
import { useHeroStore } from "../heroStore";
import { useBattleStore } from "./store";
import { loadBattle, persistBattle, BATTLE_VERSION } from "./persist";
import {
  clearLoadout,
  filterBuffsForHeroProfession,
  loadLoadout,
  professionOrLoadoutMismatchForBattle,
} from "./loadout";
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

    // Професія / панель розійшлись із героєм (адмінка, невивчені скіли на bar)
    const professionChanged = professionOrLoadoutMismatchForBattle(heroName, hero, saved);
    const restoredSummon =
      professionChanged ? null : saved.summon && saved.summon.hp > 0 ? saved.summon : null;

    let heroBuffsToRestore: any[];
    let loadoutSlotsToRestore: (number | string | null)[];
    if (professionChanged) {
      heroBuffsToRestore = [];
      clearLoadout(heroName);
      loadoutSlotsToRestore = loadLoadout(heroName);
      // Зберігаємо очищений стан, щоб loadBattle повертав актуальні дані
      persistBattle(
        {
          ...saved,
          heroBuffs: [],
          summon: undefined,
          summonBuffs: [],
          baseSummonStats: undefined,
          summonLastAttackAt: undefined,
          loadoutSlots: loadoutSlotsToRestore,
          professionForLoadout: hero.profession,
        },
        heroName
      );
    } else {
      const rawBuffs = restoredSummon
        ? (saved.heroBuffs ?? [])
        : (saved.heroBuffs ?? []).filter((b: any) => b.id !== 1262 && b.id !== 1332);
      heroBuffsToRestore = filterBuffsForHeroProfession(hero, rawBuffs);
      loadoutSlotsToRestore = saved.loadoutSlots ?? initialState.loadoutSlots;
    }

    const restored: Partial<BattleState> = {
      heroName: saved.heroName,
      summon: restoredSummon,
      summonLastAttackAt: professionChanged ? undefined : saved.summonLastAttackAt,
      summonBuffs: professionChanged ? [] : saved.summonBuffs ?? [],
      baseSummonStats: professionChanged ? undefined : saved.baseSummonStats,
      heroBuffs: heroBuffsToRestore,
      cooldowns: saved.cooldowns ?? {},
      loadoutSlots: loadoutSlotsToRestore,
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
