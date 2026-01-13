import { SkillDefinition } from "../../../types";

// Cure Poison - cures poisoning up to Effect 9 (continuation for Elven Elder)
// З XML: levels="3", mpConsume: 8-44, power: 3-9
// Для Elven Elder: рівень 3 (requiredLevel: 58)
export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "EE_1012",
  name: "Cure Poison",
  description: "Cures poisoning up to Effect 9.\n\nЛечит отравление до эффекта 9. Сила: 9. Каст: 4 сек. Перезарядка: 15 сек.",
  icon: "/skills/skill1012.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  effects: [],
  levels: [
    { level: 3, requiredLevel: 58, spCost: 160000, mpCost: 55, power: 9 },
  ],
};













