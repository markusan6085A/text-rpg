import { SkillDefinition } from "../../../types";

// Poison Recovery - self-cures poison
export const skill_0021: SkillDefinition = {
  id: 21,
  code: "ES_0021",
  name: "Poison Recovery",
  description: "Self-cures poison. Effect less than 3.\n\nЛечит для лечения яда эффекта менее 3 в секунду.",
  icon: "/skills/skill0021.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 20, power: 0 },
  ],
};

