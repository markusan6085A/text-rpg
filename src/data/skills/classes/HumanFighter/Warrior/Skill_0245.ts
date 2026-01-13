import { SkillDefinition } from "../../../types";

export const Skill_0245: SkillDefinition = {
  id: 245,
  code: "WR_0245",
  name: "Wild Sweep",
  description: "Strike multiple enemies while equiping a pole-arm. Power 90. Over-hit possible.\n\nАтакует нескольких врагов при экипировке древкового оружия. Сила 90. Возможен оверхит.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  cooldown: 4,
  icon: "/skills/0245.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1200, mpCost: 19, power: 108 },
    { level: 2, requiredLevel: 20, spCost: 1200, mpCost: 20, power: 117 },
    { level: 3, requiredLevel: 20, spCost: 1200, mpCost: 20, power: 126 },
    { level: 4, requiredLevel: 24, spCost: 2100, mpCost: 21, power: 147 },
    { level: 5, requiredLevel: 24, spCost: 2100, mpCost: 22, power: 159 },
    { level: 6, requiredLevel: 24, spCost: 2100, mpCost: 23, power: 171 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 25, power: 198 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 26, power: 213 },
    { level: 9, requiredLevel: 28, spCost: 4000, mpCost: 27, power: 229 },
    { level: 10, requiredLevel: 32, spCost: 6100, mpCost: 28, power: 263 },
    { level: 11, requiredLevel: 32, spCost: 6100, mpCost: 28, power: 281 },
    { level: 12, requiredLevel: 32, spCost: 6100, mpCost: 29, power: 301 },
    { level: 13, requiredLevel: 36, spCost: 10000, mpCost: 32, power: 344 },
    { level: 14, requiredLevel: 36, spCost: 10000, mpCost: 33, power: 367 },
    { level: 15, requiredLevel: 36, spCost: 10000, mpCost: 34, power: 391 },
  ],
};

