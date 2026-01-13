import { SkillDefinition } from "../../../types";

// Cure Bleeding - heals one's wounds (continuation, lv.2-3)
export const skill_0061: SkillDefinition = {
  id: 61,
  code: "SS_0061",
  name: "Cure Bleeding",
  description: "Heals one's wounds. Effect less than 7.\n\nЛечит раны. Эффект менее 7.",
  icon: "/skills/skill0061.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 46, spCost: 85000, mpCost: 42, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 570000, mpCost: 55, power: 0 },
  ],
};

