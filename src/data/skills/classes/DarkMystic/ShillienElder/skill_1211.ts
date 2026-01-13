import { SkillDefinition } from "../../../types";

const levels = [
  { level: 2, requiredLevel: 40, spCost: 39000, mpCost: 35, power: 0 },
  { level: 3, requiredLevel: 48, spCost: 85000, mpCost: 44, power: 0 },
  { level: 4, requiredLevel: 56, spCost: 140000, mpCost: 52, power: 0 }
];

export const skill_1211: SkillDefinition = {
  id: 1211,
  code: "DME_1211",
  name: "Mental Shield",
  description: "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks.\n\nВременно увеличивает сопротивление к удержанию, сну, страху и ментальным атакам.",
  icon: "/skills/skill1035.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "holdResist", mode: "percent", value: 60 },
    { stat: "sleepResist", mode: "percent", value: 60 },
    { stat: "fearResist", mode: "percent", value: 60 },
    { stat: "mentalResist", mode: "percent", value: 60 },
  ],
  stackType: "mental_shield",
  stackOrder: 1,
  levels,
};
