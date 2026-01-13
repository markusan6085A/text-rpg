import { SkillDefinition } from "../../../types";

// Bandage - heals bleeding
// XML: mpConsume: 19, magicLvl: 20, power: 3
export const skill_0034: SkillDefinition = {
  id: 34,
  code: "AR_0034",
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
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 19, power: 3 },
  ],
};

