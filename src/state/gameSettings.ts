import { getJSON, setJSON, removeItem } from "./persistence";
import { GAME_SETTINGS_KEY } from "../constants/storageKeys";

export const TUTORIAL_HINT_KEY = "l2_tutorial_hint_seen";

export interface GameSettings {
  compactMode?: boolean;
  largeFont?: boolean;
}

const defaults: GameSettings = { compactMode: false, largeFont: false };

export function getGameSettings(): GameSettings {
  const raw = getJSON<GameSettings | null>(GAME_SETTINGS_KEY, null);
  return raw ? { ...defaults, ...raw } : defaults;
}

export function setGameSettings(settings: Partial<GameSettings>) {
  const current = getGameSettings();
  setJSON(GAME_SETTINGS_KEY, { ...current, ...settings });
}

export function resetTutorialHint() {
  removeItem(TUTORIAL_HINT_KEY);
}
