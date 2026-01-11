import { SkillDefinition } from "../../../types";

export const Skill_0027: SkillDefinition = {
  id: 27,
  code: "HF_0027",
  name: "Unlock",
  description: "Opens doors and chests. Requires Keys of a Thief.\n\nОткрывает двери и сундуки. Требуются Ключи вора.",
  icon: "/skills/skill0027.gif",
  category: "special",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 120,
  // itemConsumeId: 1661, // Key of Thief - TODO: implement item consumption
  levels: [
    { level: 6, requiredLevel: 40, spCost: 35000, mpCost: 35, power: 0 },
    { level: 7, requiredLevel: 43, spCost: 0, mpCost: 39, power: 0 },
    { level: 8, requiredLevel: 46, spCost: 0, mpCost: 43, power: 0 },
    { level: 9, requiredLevel: 49, spCost: 0, mpCost: 47, power: 0 },
    { level: 10, requiredLevel: 52, spCost: 0, mpCost: 51, power: 0 },
    { level: 11, requiredLevel: 55, spCost: 0, mpCost: 55, power: 0 },
    { level: 12, requiredLevel: 60, spCost: 0, mpCost: 59, power: 0 },
    { level: 13, requiredLevel: 64, spCost: 0, mpCost: 63, power: 0 },
    { level: 14, requiredLevel: 68, spCost: 0, mpCost: 67, power: 0 },
  ],
};

