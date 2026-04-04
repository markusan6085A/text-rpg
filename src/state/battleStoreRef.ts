import type { BattleState } from "./battle/types";

/**
 * Легкий ref на zustand battle store без імпорту heroStore в battle/store (цикли).
 * heroStore читає status === "fighting" надійніше, ніж loadBattle() з localStorage.
 */
export const battleStoreRef: {
  getState: () => BattleState | null;
  setState: ((partial: Partial<BattleState>) => void) | null;
} = {
  getState: () => null,
  setState: null,
};
