import { SkillDefinition } from "../../../types";

export const skill_1232: SkillDefinition = {
  id: 1232,
  code: "HM_1232",
  name: "Blazing Skin",
  description: "Temporarily reflects damage back upon the enemy, excluding damage from skill or remote attack. Effect 1. Эффект Blazing Skin на 20 мин., кастуется на себя и других, действует в пределах дальности 400: - Отражает 10% физических повреждений обратно. Вытесняет или вытесняется следующими баффами / дебаффами...",
  icon: "/skills/skill1232.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
  {
    "level": 1,
    "requiredLevel": 40,
    "spCost": 34000,
    "mpCost": 35,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 48,
    "spCost": 67000,
    "mpCost": 44,
    "power": 0
  },
  {
    "level": 3,
    "requiredLevel": 56,
    "spCost": 110000,
    "mpCost": 52,
    "power": 0
  }
]
};
