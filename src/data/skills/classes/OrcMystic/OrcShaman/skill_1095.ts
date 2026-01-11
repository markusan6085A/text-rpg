import { SkillDefinition } from "../../../types";

// Venom - debuff skill (Level 3 for OrcShaman)
export const skill_1095: SkillDefinition = {
  id: 1095,
  code: "OS_1095",
  name: "Venom",
  description: "Instantaneous poison attack. Effect 3.\n\nМгновенная отравляющая атака.",
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
  hpPerTick: -90, // Damages 90 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0 }, // Effectively poisons target
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 2900, mpCost: 20, power: 90 },
  ],
};

