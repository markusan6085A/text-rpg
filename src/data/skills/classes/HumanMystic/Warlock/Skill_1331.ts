import { SkillDefinition } from "../../../types";

// Summon Feline Queen (Призвать Королеву Кошек) - Buff skill
export const skill_1331: SkillDefinition = {
  id: 1331,
  code: "HM_1331",
  name: "Summon Feline Queen",
  description: "Increases attack speed, vampirism, physical attack and physical defense.\n\nУвеличивает скорость атаки, вампиризм, физическую атаку и физическую защиту.",
  icon: "/skills/Skill1331.jpg",
  category: "buff",
  powerType: "percent",
  target: "ally", // Можна бафати інших гравців та сумонів
  scope: "single",
  castTime: 3,
  cooldown: 300,
  duration: 1200, // 20 хвилин
  effects: [
    { stat: "atkSpeed", mode: "percent" }, // Значення з level.power
    { stat: "vampirism", mode: "percent" }, // Значення з level.power
    { stat: "pAtk", mode: "percent" }, // Значення з level.power
    { stat: "pDef", mode: "percent" }, // Значення з level.power
  ],
  levels: [
    { level: 1, requiredLevel: 56, spCost: 105000, mpCost: 0, power: 5 }, // attackSpeed: 5%, vampirism: 5%, pAtk: 5%, pDef: 5%
    { level: 2, requiredLevel: 68, spCost: 520000, mpCost: 0, power: 7 }, // attackSpeed: 7%, vampirism: 7%, pAtk: 7%, pDef: 7%
    { level: 3, requiredLevel: 74, spCost: 1400000, mpCost: 0, power: 10 }, // attackSpeed: 10%, vampirism: 10%, pAtk: 10%, pDef: 10%
  ],
};

