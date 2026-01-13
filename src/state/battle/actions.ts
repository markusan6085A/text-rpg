import type { StateCreator } from "zustand";
import type { BattleState } from "./types";
import { createStartBattle } from "./actions/startBattle";
import { createUseSkill } from "./actions/useSkill";
import { createReset } from "./actions/reset";
import { createSetLoadoutSkill } from "./actions/setLoadoutSkill";
import { createProcessMobAttack } from "./actions/processMobAttack";
import { createRegenTick } from "./actions/regenTick";
import { createResurrect } from "./actions/resurrect";

export const createBattleActions: StateCreator<BattleState, [], [], Partial<BattleState>> = (
  set,
  get,
  _api
) => ({
  startBattle: createStartBattle(set, get),
  useSkill: createUseSkill(set, get),
  reset: createReset(set, get),
  setLoadoutSkill: createSetLoadoutSkill(set, get),
  processMobAttack: createProcessMobAttack(set, get),
  resurrect: createResurrect(set, get),
  regenTick: createRegenTick(set, get),
});
