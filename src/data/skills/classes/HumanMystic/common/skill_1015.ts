import { SkillDefinition } from "../../../types";

export const skill_1015: SkillDefinition = {
  id: 1015,
  code: "HM_1015",
  name: "Battle Heal",
  description: "Quickly recovers HP. Power 83.\n\nБыстро восстанавливает HP. Сила: 83-301 (зависит от уровня). Каст: 2 сек. Перезарядка: 3 сек.",
  icon: "/skills/Skill1015_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
    { level: 1, requiredLevel: 14, spCost: 700, mpCost: 25, power: 83 },
    { level: 2, requiredLevel: 14, spCost: 700, mpCost: 28, power: 95 },
    { level: 3, requiredLevel: 14, spCost: 700, mpCost: 32, power: 107 },
  ],
};

