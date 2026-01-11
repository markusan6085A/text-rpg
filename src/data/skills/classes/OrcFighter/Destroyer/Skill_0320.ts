import { SkillDefinition } from "../../../types";

export const Skill_0320: SkillDefinition = {
  id: 320,
  code: "OR_0320",
  name: "Wrath",
  description: "By swinging a spear, decreases CP of near enemies. Usable when a spear is equipped. Power 7%.\n\nРазмахивая копьем, уменьшает CP ближайших врагов. Используется при экипировке копья. Сила 7%.",
  icon: "/skills/skill0320.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 1.08,
  cooldown: 120,
  effects: [
    { stat: "maxCp", mode: "multiplier" },
  ],
  levels: [
    { level: 1, requiredLevel: 66, spCost: 290000, mpCost: 73, power: 0.93 },
    { level: 2, requiredLevel: 66, spCost: 290000, mpCost: 74, power: 0.9 },
    { level: 3, requiredLevel: 68, spCost: 330000, mpCost: 75, power: 0.88 },
    { level: 4, requiredLevel: 68, spCost: 330000, mpCost: 77, power: 0.85 },
    { level: 5, requiredLevel: 70, spCost: 360000, mpCost: 78, power: 0.83 },
    { level: 6, requiredLevel: 70, spCost: 360000, mpCost: 79, power: 0.8 },
    { level: 7, requiredLevel: 72, spCost: 630000, mpCost: 80, power: 0.78 },
    { level: 8, requiredLevel: 72, spCost: 630000, mpCost: 81, power: 0.75 },
    { level: 9, requiredLevel: 74, spCost: 880000, mpCost: 82, power: 0.73 },
    { level: 10, requiredLevel: 74, spCost: 880000, mpCost: 83, power: 0.7 },
  ],
};
