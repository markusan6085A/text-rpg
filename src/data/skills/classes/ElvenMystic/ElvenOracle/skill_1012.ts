import { SkillDefinition } from "../../../types";

// Cure Poison - cures poisoning up to Effect 3
// З XML: levels="3", mpConsume: 8-44, power: 3-9
// Для Elven Oracle: рівень 2 (requiredLevel: 35)
export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "EO_1012",
  name: "Cure Poison",
  description: "Cures poisoning up to Effect 3.\n\nЛечит отравление до эффекта 7. Сила: 7 (зависит от уровня). Каст: 4 сек. Перезарядка: 15 сек.",
  icon: "/skills/skill1012.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  effects: [],
  levels: [
    { level: 2, requiredLevel: 35, spCost: 21000, mpCost: 24, power: 7 },
  ],
};

