import { getJSON, setJSON, removeItem } from "./persistence";
import { GAME_SETTINGS_KEY } from "../constants/storageKeys";

export const TUTORIAL_HINT_KEY = "l2_tutorial_hint_seen";

/** Подія для перемальовування екранів після зміни мови/інших опцій. */
export const GAME_SETTINGS_CHANGED_EVENT = "l2-game-settings-changed";

export type Language = "ru" | "uk";
export type MobsPerPage = 10 | 15 | 20 | 25 | 30;

export interface GameSettings {
  compactMode?: boolean;
  largeFont?: boolean;
  language?: Language;
  mobsPerPage?: MobsPerPage;
  expEnabled?: boolean;
}

const MOBS_PER_PAGE_OPTIONS: MobsPerPage[] = [10, 15, 20, 25, 30];

const defaults: GameSettings = {
  compactMode: false,
  largeFont: false,
  language: "ru",
  mobsPerPage: 15,
  expEnabled: true,
};

export { MOBS_PER_PAGE_OPTIONS };

export function getGameSettings(): GameSettings {
  const raw = getJSON<GameSettings | null>(GAME_SETTINGS_KEY, null);
  return raw ? { ...defaults, ...raw } : defaults;
}

export function setGameSettings(settings: Partial<GameSettings>) {
  const current = getGameSettings();
  setJSON(GAME_SETTINGS_KEY, { ...current, ...settings });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GAME_SETTINGS_CHANGED_EVENT));
  }
}

export function resetTutorialHint() {
  removeItem(TUTORIAL_HINT_KEY);
}
