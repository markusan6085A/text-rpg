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
    const idx = Math.max(0, Math.floor(Number(slotIndex)));
    const current = (state.activeChargeSlots || []).map((i) =>
      typeof i === "string" ? parseInt(i, 10) : Number(i)
    ).filter((n) => Number.isFinite(n) && n >= 0) as number[];
    const has = current.includes(idx);
    const next = has ? current.filter((i) => i !== idx) : [...current, idx];
    set({ activeChargeSlots: next });
    persistSnapshot(get, persistBattle, { activeChargeSlots: next });
  };
