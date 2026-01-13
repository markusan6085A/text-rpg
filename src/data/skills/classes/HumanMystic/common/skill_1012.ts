import { SkillDefinition } from "../../../types";

export const skill_1012: SkillDefinition = {
  id: 1012,
  code: "HM_1012",
  name: "Cure Poison",
  description: "Cures poisoning up to Effect 3.\n\nЛечит отравление до эффекта 3. Сила: 3-9 (зависит от уровня). Каст: 4 сек. Перезарядка: 15 сек.",
  icon: "/skills/Skill1012_0.jpg",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 10, power: 3 },
    { level: 2, requiredLevel: 14, spCost: 2100, mpCost: 24, power: 7 },
    { level: 3, requiredLevel: 20, spCost: 6900, mpCost: 44, power: 9 },
  ],
};


