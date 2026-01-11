import { SkillDefinition } from "../../../types";

const levels = [
  { level: 2, requiredLevel: 40, spCost: 39000, mpCost: 35, power: 0 },
  { level: 3, requiredLevel: 44, spCost: 43000, mpCost: 39, power: 0 }
];

export const skill_1214: SkillDefinition = {
  id: 1214,
  code: "DME_1214",
  name: "Resist Wind",
  description: "Temporarily increases resistance to attack by wind.\n\nВременно увеличивает сопротивление к атакам ветром.",
  icon: "/skills/skill1189.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "windResist", mode: "flat", value: 30 }],
  stackType: "resist_wind",
  stackOrder: 1,
  levels,
};
