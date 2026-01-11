import { SkillDefinition } from "../../../types";

// Poison Recovery - self-cures poison (continuation, lv.2-3)
export const skill_0021: SkillDefinition = {
  id: 21,
  code: "SS_0021",
  name: "Poison Recovery",
  description: "Self-cures poison. Effect less than 7.\n\nЛечит отравление. Эффект менее 7.",
  icon: "/skills/skill0021.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 2, requiredLevel: 40, spCost: 49000, mpCost: 35, power: 0 },
    { level: 3, requiredLevel: 60, spCost: 410000, mpCost: 55, power: 0 },
  ],
};

