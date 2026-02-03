import { persistBattle } from "../persist";
import { persistSnapshot } from "../helpers";
import type { BattleState } from "../types";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

/** Увімкнути/вимкнути заряд у слоті (soulshot/spiritshot). Клік по слоту з зарядом перемикає активність. */
export const createToggleChargeSlot =
  (set: Setter, get: () => BattleState): BattleState["toggleChargeSlot"] =>
  (slotIndex: number) => {
    const state = get();
    const current = state.activeChargeSlots || [];
    const has = current.includes(slotIndex);
    const next = has ? current.filter((i) => i !== slotIndex) : [...current, slotIndex];
    set({ activeChargeSlots: next });
    persistSnapshot(get, persistBattle, { activeChargeSlots: next });
  };
