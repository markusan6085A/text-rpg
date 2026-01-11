import { SkillDefinition } from "../../../types";

const levels = [
  { level: 3, requiredLevel: 52, spCost: 110000, mpCost: 48, power: 0 }
];

export const skill_1226: SkillDefinition = {
  id: 1226,
  code: "DME_1226",
  name: "Greater Empower",
  description: "Temporarily increases M. Atk.\n\nВременно увеличивает маг. атаку.",
  icon: "/skills/skill1059.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "mAtk", mode: "percent", value: 30 }],
  stackType: "greater_empower",
  stackOrder: 1,
  levels,
};
