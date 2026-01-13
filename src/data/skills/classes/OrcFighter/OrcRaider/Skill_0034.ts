import { SkillDefinition } from "../../../types";

export const Skill_0034: SkillDefinition = {
  id: 34,
  code: "OR_0034",
  name: "Bandage",
  description: "Heals one's own bleeding up to Effect 3.\n\nЛечит собственное кровотечение до эффекта 3.",
  icon: "/skills/skill0034.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 3,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3400, mpCost: 19, power: 3 },
  ],
};

