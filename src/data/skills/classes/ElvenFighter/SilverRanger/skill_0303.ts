import { SkillDefinition } from "../../../types";

// Soul of Sagittarius - temporarily increases maximum MP
export const skill_0303: SkillDefinition = {
  id: 303,
  code: "SR_0303",
  name: "Soul of Sagittarius",
  description: "Temporarily increases maximum MP. Effect 1-4.\n\nВременно увеличивает максимальный MP на 10%-25% на 20 мин (зависит от уровня). Потребляет HP при использовании.",
  icon: "/skills/skill0303.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  hpCost: 185, // Consumes HP instead of MP
  stackType: "soul_of_sagittarius",
  effects: [
    { stat: "maxMp", mode: "multiplier" }, // Value from level.power (1.1, 1.15, 1.2, 1.25)
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 50000, mpCost: 0, power: 1.1 }, // 10% increase, consumes 185 HP
    { level: 2, requiredLevel: 58, spCost: 210000, mpCost: 0, power: 1.15 }, // 15% increase, consumes 271 HP
    { level: 3, requiredLevel: 64, spCost: 480000, mpCost: 0, power: 1.2 }, // 20% increase, consumes 316 HP
    { level: 4, requiredLevel: 70, spCost: 930000, mpCost: 0, power: 1.25 }, // 25% increase, consumes 364 HP
  ],
};

