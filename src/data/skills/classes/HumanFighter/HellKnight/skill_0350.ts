import { SkillDefinition } from "../../../types";

// Physical Mirror для HellKnight (рівень 1)
export const skill_0350: SkillDefinition = {
  id: 350,
  code: "HKN_0350",
  name: "Physical Mirror",
  description: "A shield power that reflects back buffs/de-buffs one receives from physical skill attacks. An equipped shield is required to use this skill.\n\nСила щита, которая отражает бафы/дебафы от физических атак обратно на атакующего. Длительность: 5 мин. Шанс: 30% для физических навыков, 10% для магических. Каст: 2 сек. Перезарядка: 10 мин. Требуется щит.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 600, // 10 хвилин
  duration: 300, // 5 хвилин
  icon: "/skills/skill0350.gif",
  effects: [
    { stat: "reflectSkillPhysic", mode: "flat", value: 30, duration: 300 }, // 30% шанс відбити фізичні скіли
    { stat: "reflectSkillMagic", mode: "flat", value: 10, duration: 300 }, // 10% шанс відбити магічні скіли
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

