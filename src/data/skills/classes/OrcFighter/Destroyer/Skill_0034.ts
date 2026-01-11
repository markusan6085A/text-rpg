import { SkillDefinition } from "../../../types";

export const Skill_0034: SkillDefinition = {
  id: 34,
  code: "OR_0034",
  name: "Bandage",
  description: "Heals one's own bleeding up to Effect 7.\n\nЛечит собственное кровотечение до эффекта 7.",
  icon: "/skills/skill0034.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 3,
  levels: [
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 41, power: 7 },
    { level: 3, requiredLevel: 62, spCost: 310000, mpCost: 55, power: 9 },
  ],
};

