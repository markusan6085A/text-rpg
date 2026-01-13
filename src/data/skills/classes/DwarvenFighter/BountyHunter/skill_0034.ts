import { SkillDefinition } from "../../../types";

// Bandage - levels 2-3
// XML: power: 7 9, mpConsume: 41 55, magicLvl: 46 62
export const skill_0034: SkillDefinition = {
  id: 34,
  code: "BH_0034",
  name: "Bandage",
  description: "Heals one's own bleeding up to Effect 7/9.\n\nИзлечивает собственное кровотечение до эффекта 7/9.",
  icon: "/skills/skill0034.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 3,
  levels: [
    { level: 2, requiredLevel: 46, spCost: 67000, mpCost: 41, power: 7 },
    { level: 3, requiredLevel: 62, spCost: 440000, mpCost: 55, power: 9 },
  ],
};

