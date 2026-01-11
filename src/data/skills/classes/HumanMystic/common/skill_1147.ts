import { SkillDefinition } from "../../../types";

export const skill_1147: SkillDefinition = {
  id: 1147,
  code: "HM_1147",
  name: "Vampiric Touch",
  description: "Absorbs HP. Power 23.\n\nПоглощает HP. Сила: 18-32 (зависит от уровня). Поглощает 40% урона. Каст: 4 сек. Перезарядка: 12 сек.",
  icon: "/skills/Skill1147_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  effects: [{ stat: "vampirism", mode: "percent", value: 40 }],
  levels: [
    { level: 1, requiredLevel: 14, spCost: 1100, mpCost: 25, power: 18 },
    { level: 2, requiredLevel: 14, spCost: 1100, mpCost: 28, power: 21 },
  ],
};


