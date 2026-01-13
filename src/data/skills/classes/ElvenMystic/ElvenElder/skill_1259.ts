import { SkillDefinition } from "../../../types";

// Resist Shock - Temporarily increases resistance to stun attack
// З XML: levels="4", vuln: 0.85-0.6
// Для Elven Elder: рівні 1-4 (requiredLevel: 40-72)
export const skill_1259: SkillDefinition = {
  id: 1259,
  code: "EE_1259",
  name: "Resist Shock",
  description: "Temporarily increases resistance to stun attack. Effect 1.\n\nВременно увеличивает сопротивление к оглушению на 15-40% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1259.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "stunVuln", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 15 },
    { level: 2, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 20 },
    { level: 3, requiredLevel: 64, spCost: 340000, mpCost: 58, power: 30 },
    { level: 4, requiredLevel: 72, spCost: 1100000, mpCost: 65, power: 40 },
  ],
};













