import { SkillDefinition } from "../../../types";

const levels = [
  { level: 3, requiredLevel: 40, spCost: 39000, mpCost: 35, power: 0 }
];

export const skill_1212: SkillDefinition = {
  id: 1068,
  code: "DME_1068",
  name: "Might",
  description: "Temporarily increases P. Atk.\n\nВременно увеличивает физ. атаку.",
  icon: "/skills/skill1068.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pAtk", mode: "percent" }],
  stackType: "might",
  stackOrder: 1,
  levels,
};
