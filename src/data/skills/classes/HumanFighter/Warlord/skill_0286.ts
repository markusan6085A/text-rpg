import { SkillDefinition } from "../../../types";

export const skill_0286: SkillDefinition = {
  id: 286,
  code: "WL_0286",
  name: "Provoke",
  description: "Draws in monsters towards oneself from a large surrounding area.\n\nПривлекает монстров к себе с большой окружающей области (радиус 500-900, зависит от уровня). Каст: 1.5 сек. Перезарядка: 15 сек.",
  category: "special",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 1.5,
  cooldown: 15,
  icon: "/skills/skill0286.gif",
  levels: [
    { level: 1, requiredLevel: 43, spCost: 46000, mpCost: 57, power: 0 },
    { level: 2, requiredLevel: 55, spCost: 180000, mpCost: 75, power: 0 },
    { level: 3, requiredLevel: 60, spCost: 320000, mpCost: 83, power: 0 },
  ],
};

