import { SkillDefinition } from "../../../types";

// Bandage - level 1
// XML: power: 3, mpConsume: 19, magicLvl: 20
export const skill_0034: SkillDefinition = {
  id: 34,
  code: "SC_0034",
  name: "Bandage",
  description: "Heals one's own bleeding up to Effect 3.\n\nИзлечивает собственное кровотечение до эффекта 3.",
  icon: "/skills/skill0034.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 3,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4100, mpCost: 19, power: 3 },
  ],
};

