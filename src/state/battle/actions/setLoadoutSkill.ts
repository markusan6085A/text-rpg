import { useHeroStore } from "../../heroStore";
import { MAX_SLOTS, saveLoadout } from "../loadout";
import { persistBattle } from "../persist";
import { persistSnapshot } from "../helpers";
import type { BattleState } from "../types";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createSetLoadoutSkill =
  (set: Setter, get: () => BattleState): BattleState["setLoadoutSkill"] =>
  (slotIndex, skillId) => {
    const state = get();
    const hero = useHeroStore.getState().hero;
    if (!hero) return;

    const allowedSkills = (hero.skills || []).map((s: any) => s.id);
    const targetId = skillId === null ? null : skillId;

    // Перевіряємо чи це расходник (рядковий ID)
    const isConsumable = typeof targetId === "string" && targetId.startsWith("consumable:");
    
    // Перевіряємо скіли (тільки для числових ID)
    if (targetId !== null && targetId !== 0 && typeof targetId === "number" && !allowedSkills.includes(targetId)) return;

    let nextSlots = [...state.loadoutSlots];

    if (targetId === null) {
      if (slotIndex < nextSlots.length) {
        nextSlots[slotIndex] = null;
      }
    } else {
      if (slotIndex >= nextSlots.length) {
        while (nextSlots.length <= slotIndex) nextSlots.push(null);
      }
      nextSlots[slotIndex] = targetId;
    }

    // Compact: drop nulls, keep filled items, trim to MAX_SLOTS.
    const filled = nextSlots.filter((v) => v !== null) as (number | string)[];
    let compacted = filled.slice(0, MAX_SLOTS);
    if (compacted.length < MAX_SLOTS) {
      compacted.push(null);
    }
    nextSlots = compacted;

    nextSlots = nextSlots.slice(0, MAX_SLOTS);

    saveLoadout(hero.name, nextSlots);
    set({ loadoutSlots: nextSlots });
    persistSnapshot(get, persistBattle, { loadoutSlots: nextSlots });
  };
