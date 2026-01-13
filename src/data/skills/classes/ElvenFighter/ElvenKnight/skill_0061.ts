import { SkillDefinition } from "../../../types";

// Cure Bleeding - heals one's wounds
export const skill_0061: SkillDefinition = {
  id: 61,
  code: "EK_0061",
  name: "Cure Bleeding",
  description: "Heals one's wounds. Effect less than 3.\n\nЛечит раны. Эффект менее 3.",
  icon: "/skills/skill0061.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 24, spCost: 8800, mpCost: 22, power: 0 },
  ],
};

