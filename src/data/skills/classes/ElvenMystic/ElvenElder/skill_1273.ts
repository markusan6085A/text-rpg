import { SkillDefinition } from "../../../types";

// Serenade of Eva - Calms surrounding enemies such that they lose their will to attack
// З XML: levels="13", power: 30-300
// Для Elven Elder: рівні 1-13 (requiredLevel: 44-74)
export const skill_1273: SkillDefinition = {
  id: 1273,
  code: "EE_1273",
  name: "Serenade of Eva",
  description: "Calms surrounding enemies such that they lose their will to attack.\n\nУспокаивает окружающих врагов, так что они теряют волю к атаке. Снижает агрессию врагов на 40% в радиусе 200 вокруг кастера. Каст: 4 сек. Перезарядка: 20 сек.",
  icon: "/skills/skill1273.gif",
  category: "debuff",
  powerType: "flat",
  target: "area",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 41000, mpCost: 117, power: 30 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 129, power: 50 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 140, power: 70 },
    { level: 4, requiredLevel: 56, spCost: 110000, mpCost: 153, power: 90 },
    { level: 5, requiredLevel: 58, spCost: 160000, mpCost: 159, power: 110 },
    { level: 6, requiredLevel: 60, spCost: 210000, mpCost: 165, power: 130 },
    { level: 7, requiredLevel: 62, spCost: 310000, mpCost: 172, power: 150 },
    { level: 8, requiredLevel: 64, spCost: 340000, mpCost: 178, power: 170 },
    { level: 9, requiredLevel: 66, spCost: 500000, mpCost: 184, power: 190 },
    { level: 10, requiredLevel: 68, spCost: 590000, mpCost: 189, power: 210 },
    { level: 11, requiredLevel: 70, spCost: 720000, mpCost: 194, power: 230 },
    { level: 12, requiredLevel: 72, spCost: 1100000, mpCost: 199, power: 250 },
    { level: 13, requiredLevel: 74, spCost: 1600000, mpCost: 204, power: 300 },
  ],
};





