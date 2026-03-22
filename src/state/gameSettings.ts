import { getJSON, setJSON, removeItem } from "./persistence";
import { GAME_SETTINGS_KEY } from "../constants/storageKeys";

export const TUTORIAL_HINT_KEY = "l2_tutorial_hint_seen";
/** id контекстних підказок (рівень / професія / гільдія), JSON string[] */
export const TUTORIAL_DISMISSED_HINT_IDS_KEY = "l2_tutorial_dismissed_hint_ids";

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

export function getDismissedTutorialHintIds(): Set<string> {
  const arr = getJSON<string[]>(TUTORIAL_DISMISSED_HINT_IDS_KEY, []);
  return new Set(Array.isArray(arr) ? arr.map(String) : []);
}

export function dismissTutorialHintId(id: string): void {
  const s = getDismissedTutorialHintIds();
  s.add(id);
  setJSON(TUTORIAL_DISMISSED_HINT_IDS_KEY, [...s]);
}

export function resetTutorialHint() {
  removeItem(TUTORIAL_HINT_KEY);
  removeItem(TUTORIAL_DISMISSED_HINT_IDS_KEY);
}
