import { SkillDefinition } from "../../../types";

// Power Shot - continuation from common (lv.10-24)
export const skill_0056_cont: SkillDefinition = {
  id: 56,
  code: "ES_0056",
  name: "Power Shot",
  description: "A deadly damage-dealing volley from a bow. Over-hit possible.\n\nСмертельный залп из лука, наносящий урон. Сила 239-868 (зависит от уровня). Возможен оверхит.",
  icon: "/skills/Skill0056.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3.2,
  cooldown: 25,
  levels: [
    { level: 10, requiredLevel: 20, spCost: 1200, mpCost: 43, power: 239 },
    { level: 11, requiredLevel: 20, spCost: 1200, mpCost: 44, power: 258 },
    { level: 12, requiredLevel: 20, spCost: 1200, mpCost: 44, power: 279 },
    { level: 13, requiredLevel: 24, spCost: 1700, mpCost: 46, power: 326 },
    { level: 14, requiredLevel: 24, spCost: 1700, mpCost: 48, power: 352 },
    { level: 15, requiredLevel: 24, spCost: 1700, mpCost: 50, power: 379 },
    { level: 16, requiredLevel: 28, spCost: 3100, mpCost: 54, power: 440 },
    { level: 17, requiredLevel: 28, spCost: 3100, mpCost: 57, power: 472 },
    { level: 18, requiredLevel: 28, spCost: 3100, mpCost: 59, power: 507 },
    { level: 19, requiredLevel: 32, spCost: 5100, mpCost: 62, power: 584 },
    { level: 20, requiredLevel: 32, spCost: 5100, mpCost: 62, power: 625 },
    { level: 21, requiredLevel: 32, spCost: 5100, mpCost: 65, power: 669 },
    { level: 22, requiredLevel: 36, spCost: 8600, mpCost: 69, power: 763 },
    { level: 23, requiredLevel: 36, spCost: 8600, mpCost: 72, power: 814 },
    { level: 24, requiredLevel: 36, spCost: 8600, mpCost: 74, power: 865 },
  ],
};

