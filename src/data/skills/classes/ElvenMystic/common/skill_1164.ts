import { SkillDefinition } from "../../../types";

// Curse: Weakness - instantaneous curse that reduces target's P. Atk.
export const skill_1164: SkillDefinition = {
  id: 1164,
  code: "EM_1164",
  name: "Curse: Weakness",
  description: "Instantaneous curse that reduces target's P. Atk. Effect 1. Lasts for 5 sec with base chance 80% (resistance depends on WIT stat).\n\nМгновенное проклятие, которое снижает физическую атаку цели на 17% на 5 сек. Шанс 80% (зависит от WIT стата). Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/Skill1164_0.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 5,
  castTime: 1.5,
  cooldown: 8,
  chance: 80,
  effects: [
    { stat: "pAtk", mode: "percent", value: -17, resistStat: "wit" },
  ],
  levels: [
    { level: 1, requiredLevel: 14, spCost: 2100, mpCost: 3, power: 0 },
  ],
};

