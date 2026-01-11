import type { BattleState } from "./types";
import { BASE_ATTACK } from "./loadout";

export const initialState: BattleState = {
  zoneId: undefined,
  mob: undefined,
  mobIndex: undefined,
  mobHP: 0,
  // ❗ Ресурси (HP/MP/CP) тепер ТІЛЬКИ в heroStore.hero - не дублюємо тут
  mobStunnedUntil: undefined,
  heroStunnedUntil: undefined,
  heroBuffsBlockedUntil: undefined,
  heroSkillsBlockedUntil: undefined,
  mobNextAttackAt: undefined,
  heroNextAttackAt: undefined,
  status: "idle",
  log: [],
  regenTick: () => {},
  cooldowns: {},
  loadoutSlots: [BASE_ATTACK.id, null] as (number | string | null)[],
  lastReward: undefined,
  heroBuffs: [],
  mobBuffs: [],
  summonBuffs: [],
  summon: null,
  resurrection: null,
  summonLastAttackAt: undefined,
  startBattle: () => {},
  useSkill: () => {},
  setLoadoutSkill: () => {},
  processMobAttack: () => {},
  resurrect: () => {},
  reset: () => {},
};
