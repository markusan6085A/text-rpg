import { SkillDefinition } from "../../../types";

export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "HM_1078",
  name: "Concentration",
  description: "Temporarily increases Casting Spd. and resistance to mental attacks.\n\nВременно увеличивает скорость каста и сопротивление к ментальным атакам.",
  icon: "/skills/skill1078.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "castSpeed", mode: "percent", value: 5 },
    { stat: "mentalResist", mode: "percent", value: 10 },
  ],
  stackType: "concentration",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 18 },
    { level: 2, requiredLevel: 30, spCost: 13000, mpCost: 27, power: 18 },
  ],
};

