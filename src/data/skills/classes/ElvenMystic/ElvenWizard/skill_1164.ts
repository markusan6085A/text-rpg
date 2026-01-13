import { SkillDefinition } from "../../../types";

// Curse: Weakness - instantaneous curse that reduces target's P. Atk. (continues from common level 1)
export const skill_1164: SkillDefinition = {
  id: 1164,
  code: "EW_1164",
  name: "Curse: Weakness",
  description: "Instantaneous curse that reduces target's P. Atk. Effect 2.\n\nМгновенное проклятие, которое снижает физическую атаку цели на 20% на 10 сек. Шанс 80% (зависит от WIT стата). Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/skill1164.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 10,
  castTime: 1.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "pAtk", mode: "percent", value: -20, resistStat: "wit" },
  ],
  levels: [
    { level: 2, requiredLevel: 20, spCost: 3300, mpCost: 10, power: 0 },
    { level: 3, requiredLevel: 25, spCost: 6100, mpCost: 12, power: 0 },
    { level: 4, requiredLevel: 30, spCost: 12000, mpCost: 14, power: 0 },
    { level: 5, requiredLevel: 35, spCost: 21000, mpCost: 15, power: 0 },
  ],
};

