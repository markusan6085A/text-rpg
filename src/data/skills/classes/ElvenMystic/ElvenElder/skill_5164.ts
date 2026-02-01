import { SkillDefinition } from "../../../types";

// Wild Magic - Temporarily increases critical attack rate of magic attacks
// З XML: levels="10", rate: 1.1-1.19
// Для Elven Elder: рівні 1-2 (requiredLevel: 62, 70)
export const skill_5164: SkillDefinition = {
  id: 5164,
  code: "EE_5164",
  name: "Wild Magic",
  description: "Temporarily increases critical attack rate of magic attacks. Effect 1.\n\nВременно увеличивает шанс критической атаки магических атак на 200-300% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill5164.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "skillCritRate", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 200 },
    { level: 2, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 300 },
  ],
};

