import { create } from "zustand";
import { initialState } from "./initialState";
import { createBattleActions } from "./actions";
import type { BattleState } from "./types";
import { loadBattle, BATTLE_VERSION } from "./persist";
import { useHeroStore } from "../heroStore";

// Відновлюємо стан бою з localStorage при ініціалізації
// Отримуємо нік поточного героя для перевірки
const hero = useHeroStore.getState().hero;
const heroName = hero?.name;
const saved = loadBattle(heroName);

// ❗ ВАЖЛИВО: Перевіряємо, чи battle state належить поточному герою
// Якщо hero = null (ще не завантажений), НЕ завантажуємо дані з fallback ключа,
// бо вони можуть належати іншому герою
// Завантажуємо дані ТІЛЬКИ якщо:
// 1. hero існує (heroName встановлено) І
// 2. (saved не має heroName АБО saved.heroName === heroName)
const belongsToCurrentHero = heroName 
  ? (!saved?.heroName || saved.heroName === heroName)
  : false; // Якщо hero = null, не завантажуємо дані

// Перевіряємо версію збереженого стану
const isVersionCompatible = saved?.version === BATTLE_VERSION || !saved?.version;

const restoredSummon = saved?.summon && saved.summon.hp > 0 ? saved.summon : null;
const restoredState: Partial<BattleState> = saved && belongsToCurrentHero && isVersionCompatible ? {
  // Відновлюємо summon, якщо він живий і battle state належить поточному герою
  heroName: saved.heroName,
  summon: restoredSummon,
  summonLastAttackAt: saved.summonLastAttackAt,
  summonBuffs: saved.summonBuffs || [],
  baseSummonStats: saved.baseSummonStats,
  // Remove Transfer Pain (1262) and Unicorn Seraphim master buff (1332) if summon is dead
  heroBuffs: restoredSummon ? (saved.heroBuffs || []) : (saved.heroBuffs || []).filter((b: any) => b.id !== 1262 && b.id !== 1332),
  cooldowns: saved.cooldowns || {},
  loadoutSlots: saved.loadoutSlots || initialState.loadoutSlots,
  activeChargeSlots: saved.activeChargeSlots ?? initialState.activeChargeSlots,
  log: saved.log || [],
} : {};

// Dev logging для дебагу
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
    restoredFields: Object.keys(restoredState),
  });
}

export const useBattleStore = create<BattleState>((set, get, api) => ({
  ...initialState,
  ...restoredState,
  ...createBattleActions(set, get, api),
}));
