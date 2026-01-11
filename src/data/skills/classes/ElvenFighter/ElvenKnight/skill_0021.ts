import { SkillDefinition } from "../../../types";

// Poison Recovery - self-cures poison
export const skill_0021: SkillDefinition = {
  id: 21,
  code: "EK_0021",
  name: "Poison Recovery",
  description: "Self-cures poison. Effect less than 3.\n\nЛечит отравление. Эффект менее 3.",
  icon: "/skills/skill0021.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4100, mpCost: 20, power: 0 },
  ],
};

