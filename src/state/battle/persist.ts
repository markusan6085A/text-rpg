import type { BattleState } from "./types";
import { getJSON, removeItem, setJSON } from "../persistence";

// Версія battle state для міграцій
export const BATTLE_VERSION = 1;

// Тип для збереженого стану (включає version для міграцій)
export type PersistedBattleState = Partial<BattleState> & {
  version?: number;
  professionForLoadout?: string; // Професія, для якої збережено loadout; при зміні професії — скидаємо loadout
};

// Battle state persistence key - тепер включає нік героя
// Не імпортуємо heroStore тут, щоб уникнути циклу: heroStore → heroLoadAPI → battle/persist → heroStore
const getBattleKey = (heroName?: string | null): string => {
  if (heroName) {
    return `l2_battle_state_v7_${heroName}`;
  }
  // Fallback для сумісності зі старими даними
  return "l2_battle_state_v7";
};

export const persistBattle = (data: Partial<BattleState>, heroName?: string | null) => {
  const key = getBattleKey(heroName);
  const resolvedHeroName = heroName || data.heroName;
  // Мерджимо з уже збереженим станом, щоб ніколи не втратити activeChargeSlots при частковому оновленні
  const existing = resolvedHeroName ? getJSON<PersistedBattleState | null>(key, null) : null;
  const base = existing && typeof existing === "object" ? existing : {};
  const dataWithHeroName = {
    ...base,
    ...data,
    heroName: resolvedHeroName,
    version: BATTLE_VERSION,
  };
  setJSON(key, dataWithHeroName);
};

export const loadBattle = (heroName?: string | null): PersistedBattleState | null => {
  // heroName передається викликачем (heroLoadAPI, heroLoad, store.ts) — не читаємо heroStore, щоб уникнути циклічного імпорту
  const currentHeroName = heroName ?? null;
  const key = getBattleKey(currentHeroName);
  const parsed = getJSON<PersistedBattleState | null>(key, null);
  
  if (!parsed || typeof parsed !== "object") {
    // Спробуємо завантажити зі старого глобального ключа для сумісності
    if (currentHeroName) {
      const oldKey = "l2_battle_state_v7";
      const oldParsed = getJSON<PersistedBattleState | null>(oldKey, null);
      if (oldParsed && typeof oldParsed === "object") {
        // Мігруємо старі дані на новий ключ з версією
        const migrated = { ...oldParsed, heroName: currentHeroName, version: BATTLE_VERSION };
        setJSON(key, migrated);
        removeItem(oldKey);
        return migrated;
      }
    }
    return null;
  }
  
  // Перевіряємо, чи battle state належить поточному герою
  if (currentHeroName && parsed.heroName && parsed.heroName !== currentHeroName) {
    // Battle state належить іншому герою - очищаємо його
    removeItem(key);
    return null;
  }
  
  // Перевіряємо версію - якщо не відповідає, очищаємо старі дані
  if (parsed.version !== undefined && parsed.version !== BATTLE_VERSION) {
    if (import.meta.env.DEV) {
      console.warn(`[battleStore] Incompatible version: ${parsed.version} (current: ${BATTLE_VERSION}). Clearing old state.`);
    }
    removeItem(key);
    return null;
  }
  
  // Додаємо версію до старих збережень (міграція)
  if (!parsed.version) {
    const migrated = { ...parsed, version: BATTLE_VERSION };
    setJSON(key, migrated);
    return migrated;
  }
  
  return parsed;
};

export const clearBattlePersist = (heroName?: string | null) => {
  const key = getBattleKey(heroName);
  removeItem(key);
  // Також очищаємо старий глобальний ключ для сумісності
  removeItem("l2_battle_state_v7");
};

