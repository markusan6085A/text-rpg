import { SkillDefinition } from "../../../types";

// Vicious Stance   ,  . .
export const Skill_0312: SkillDefinition = {
  id: 312,
  code: "GL_0312",
  name: "Vicious Stance",
  description: "Increases one's critical attack power. MP will be consumed continuously.\n\nУвеличивает силу критической атаки. MP потребляется непрерывно.",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  icon: "/skills/0312.jpg",
  effects: [{ stat: "critDamage", mode: "flat" }],
  levels: [
    { level: 6, requiredLevel: 40, spCost: 30000, mpCost: 7, power: 139 },
    { level: 7, requiredLevel: 43, spCost: 32000, mpCost: 8, power: 166 },
    { level: 8, requiredLevel: 46, spCost: 43000, mpCost: 9, power: 196 },
    { level: 9, requiredLevel: 49, spCost: 61000, mpCost: 9, power: 229 },
    { level: 10, requiredLevel: 52, spCost: 100000, mpCost: 10, power: 266 },
    { level: 11, requiredLevel: 55, spCost: 138000, mpCost: 10, power: 306 },
    { level: 12, requiredLevel: 58, spCost: 153000, mpCost: 11, power: 349 },
    { level: 13, requiredLevel: 60, spCost: 181000, mpCost: 11, power: 379 },
    { level: 14, requiredLevel: 62, spCost: 250000, mpCost: 12, power: 410 },
    { level: 15, requiredLevel: 64, spCost: 320000, mpCost: 12, power: 443 },
    { level: 16, requiredLevel: 66, spCost: 410000, mpCost: 13, power: 475 },
    { level: 17, requiredLevel: 68, spCost: 520000, mpCost: 13, power: 509 },
    { level: 18, requiredLevel: 70, spCost: 580000, mpCost: 13, power: 542 },
    { level: 19, requiredLevel: 72, spCost: 800000, mpCost: 14, power: 576 },
    { level: 20, requiredLevel: 74, spCost: 1630000, mpCost: 14, power: 609 },
  ],
};

