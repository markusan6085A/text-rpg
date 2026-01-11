import { SkillDefinition } from "../../../types";

export const skill_0336: SkillDefinition = {
  id: 336,
  code: "HM_0336",
  name: "Arcane Wisdom",
  description: "Reduces cast speed.\n\nСнижает скорость каста.",
  icon: "/skills/skill0336.gif",
  category: "toggle",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0,
  effects: [
    { stat: "castSpeed", mode: "percent", multiplier: -1 }, // -power
  ],
  stackType: "arcane_wisdom",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 36,
      power: 10, //   -10%   ;  HP       
    },
  ],
};

