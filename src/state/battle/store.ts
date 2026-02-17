import { create } from "zustand";
import { initialState } from "./initialState";
import { createBattleActions } from "./actions";
import type { BattleState } from "./types";

/**
 * Battle store створюється без звернення до heroStore, щоб уникнути "Cannot access 'Z' before initialization"
 * при code-splitting (battle chunk завантажується окремо). Відновлення з localStorage — у hydrateFromStorage.ts,
 * викликається з App після готовності hero.
 */
export const useBattleStore = create<BattleState>((set, get, api) => ({
  ...initialState,
  ...createBattleActions(set, get, api),
}));
