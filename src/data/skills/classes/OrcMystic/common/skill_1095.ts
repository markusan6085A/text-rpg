import { SkillDefinition } from "../../../types";

// Venom - debuff skill that poisons the target
export const skill_1095: SkillDefinition = {
  id: 1095,
  code: "OM_1095",
  name: "Venom",
  description: "Instantaneous poison attack. Effect 1.\n\nМгновенная отравляющая атака.",
  icon: "/skills/skill1095.gif",
  category: "debuff",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  duration: 30,
  chance: 70,
  hpPerTick: -40, // Damages 40 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0 }, // Effectively poisons target
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 40 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 15, power: 60 },
  ],
};

