import { SkillDefinition } from "../../../types";

const levels = [
  { level: 3, requiredLevel: 58, spCost: 180000, mpCost: 55, power: 9 }
];

export const skill_1228: SkillDefinition = {
  id: 1012,
  code: "DME_1012",
  name: "Cure Poison",
  description: "Cures poisoning.\n\nИзлечивает отравление.",
  icon: "/skills/skill1012.gif",
  category: "heal",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels,
};
