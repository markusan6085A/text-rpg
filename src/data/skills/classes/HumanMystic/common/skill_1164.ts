import { SkillDefinition } from "../../../types";

export const skill_1164: SkillDefinition = {
  id: 1164,
  code: "HM_1164",
  name: "Curse: Weakness",
  description: "Instantaneous curse that reduces target's P. Atk. Effect 2.\n\nМгновенное проклятие, которое снижает физ. атаку цели на 17-23% (зависит от уровня) на 15 сек. Каст: 1.5 сек. Перезарядка: 8 сек.",
  icon: "/skills/Skill1164_0.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 120,
  castTime: 1.5,
  cooldown: 8,
  effects: [{ stat: "pAtk", mode: "percent", value: -25 }],
  levels: [{ level: 1, requiredLevel: 14, spCost: 2100, mpCost: 3, power: 0 }],
};


