import { SkillDefinition } from "../../../types";

// Elemental Heal - regenerates HP
export const skill_0058: SkillDefinition = {
  id: 58,
  code: "ELF_0058",
  name: "Elemental Heal",
  description: "Regenerates one's HP. Power 71.\n\nВосстанавливает HP. Сила 71.",
  icon: "/skills/skill0058.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 15, spCost: 1100, mpCost: 40, power: 71 },
    { level: 2, requiredLevel: 15, spCost: 1100, mpCost: 43, power: 75 },
    { level: 3, requiredLevel: 15, spCost: 1100, mpCost: 45, power: 80 },
  ],
};

