import { SkillDefinition } from "../../../types";

// Arcane Agility
export const skill_0338: SkillDefinition = {
  id: 338,
  code: "AL_0338",
  name: "Arcane Agility",
  description: "Significantly increases Casting Spd. and decreases skill re-use time at an increased MP consumption per skill. HP will be continuously consumed while in effect.\n\nЗначительно увеличивает скорость каста и уменьшает время перезарядки навыков при увеличенном потреблении MP за навык. HP будет постоянно расходоваться во время действия.",
  category: "toggle",
  toggle: true,
  powerType: "none",
  icon: "/skills/skill0338.gif",
  target: "self",
  scope: "single",
  duration: 300,
  tickInterval: 5,
  hpPerTick: -250,
  effects: [
    { stat: "castSpeed", mode: "percent", value: 20 },
    { stat: "cooldownReduction", mode: "percent", value: 10 },
    { stat: "mpRegen", mode: "percent", value: -10 },
  ],
  levels: [{ level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 }],
};

