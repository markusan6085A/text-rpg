import { SkillDefinition } from "../../../types";

export const Skill_0056: SkillDefinition = {
  id: 56,
  code: "HF_0056",
  name: "Power Shot",
  description: "A deadly damage-dealing volley from a bow. Over-hit possible.\n\nСмертельный залп из лука, наносящий урон. Возможен оверхит.",
  icon: "/skills/Skill0056.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3.2,
  cooldown: 25,
  levels: [
    { level: 1, requiredLevel: 3, spCost: 0, mpCost: 19, power: 65 },
    { level: 2, requiredLevel: 4, spCost: 0, mpCost: 20, power: 71 },
    { level: 3, requiredLevel: 5, spCost: 0, mpCost: 21, power: 78 },
    { level: 4, requiredLevel: 8, spCost: 0, mpCost: 25, power: 102 },
    { level: 5, requiredLevel: 9, spCost: 0, mpCost: 26, power: 112 },
    { level: 6, requiredLevel: 10, spCost: 0, mpCost: 27, power: 122 },
    { level: 7, requiredLevel: 13, spCost: 0, mpCost: 34, power: 158 },
    { level: 8, requiredLevel: 14, spCost: 0, mpCost: 36, power: 172 },
    { level: 9, requiredLevel: 15, spCost: 0, mpCost: 37, power: 187 },
  ],
};

