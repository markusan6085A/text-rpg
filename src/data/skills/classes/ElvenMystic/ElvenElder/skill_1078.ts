import { SkillDefinition } from "../../../types";

// Concentration - temporarily lowers the probability of magic being canceled due to damage (continuation for Elven Elder)
// З XML: levels="6", mpConsume: 20-27, power: 18-25
// Для Elven Elder: рівні 3-6 (requiredLevel: 44-68)
export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "EE_1078",
  name: "Concentration",
  description: "Temporarily lowers the probability of magic being canceled due to damage. Effect 3.\n\nВременно снижает вероятность прерывания магии при получении урона на 36-53% (зависит от уровня) на 20 сек. Кастуется на себя и союзников, действует в пределах дальности 400. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1078.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "cancelResist", mode: "percent" },
  ],
  levels: [
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 39, power: 36 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 42 },
    { level: 5, requiredLevel: 60, spCost: 210000, mpCost: 55, power: 48 },
    { level: 6, requiredLevel: 68, spCost: 590000, mpCost: 64, power: 53 },
  ],
};













