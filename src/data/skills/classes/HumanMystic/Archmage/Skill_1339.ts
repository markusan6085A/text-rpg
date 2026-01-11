import { SkillDefinition } from "../../../types";

export const skill_1339: SkillDefinition = {
  id: 1339,
  code: "HM_1339",
  name: "Fire Vortex",
  description: "Creates a vortex that connects to the dimension of fire. While launching a fire attack, it instantly decreases the enemy's resistance to fire attack, Speed, Atk. Spd. And Casting Spd at the same time. Decreases MP continuously. Over-hit is possible. Power 140. РђС‚",
  icon: "/skills/skill1339.gif",
  category: "magic_attack",
  element: "fire",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 60,
  duration: 30,
  chance: 80,
  tickInterval: 5,
  mpPerTick: -60,
  effects: [
    { stat: "runSpeed", mode: "percent", value: -10 },
    { stat: "atkSpeed", mode: "percent", value: -30 },
    { stat: "castSpeed", mode: "percent", value: -10 },
    { stat: "fireResist", mode: "percent", value: -20 },
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 20000000,
      mpCost: 105,
      power: 140,
    },
  ],
};

