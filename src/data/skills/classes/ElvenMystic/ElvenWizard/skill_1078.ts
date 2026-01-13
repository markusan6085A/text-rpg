import { SkillDefinition } from "../../../types";

// Concentration - temporarily lowers the probability of magic being canceled due to damage
export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "EW_1078",
  name: "Concentration",
  description: "Temporarily lowers the probability of magic being canceled due to damage. Effect 1.\n\nВременно снижает вероятность прерывания магии при получении урона на 18-25% (зависит от уровня) на 20 сек. Кастуется на себя и союзников, действует в пределах дальности 400. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1078.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "cancelResist", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 18 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 27, power: 25 },
  ],
};

