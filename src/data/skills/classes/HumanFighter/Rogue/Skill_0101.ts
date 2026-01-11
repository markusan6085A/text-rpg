import { SkillDefinition } from "../../../types";

export const Skill_0101: SkillDefinition = {
  id: 101,
  code: "HF_0101",
  name: "Stun Shot",
  description: "Stunning attack that inflicts shock and damage simultaneously by shooting an arrow into a target. Usable when equipped with a bow. Over-hit possible.\n\nОглушающая атака, наносящая шок и урон одновременно, стреляя стрелой в цель. Требуется лук. Возможен оверхит.",
  icon: "/skills/skill0101.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 0, mpCost: 49, power: 344 },
    { level: 2, requiredLevel: 24, spCost: 0, mpCost: 51, power: 367 },
    { level: 3, requiredLevel: 28, spCost: 0, mpCost: 53, power: 391 },
  ],
};

