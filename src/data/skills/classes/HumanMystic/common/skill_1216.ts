import { SkillDefinition } from "../../../types";

export const skill_1216: SkillDefinition = {
  id: 1216,
  code: "HM_1216",
  name: "Self Heal",
  description: "Recover HP. Power 42.\n\nВосстанавливает HP. Сила: 42. Каст: 5 сек. Перезарядка: 10 сек.",
  icon: "/skills/Skill1216_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [{ level: 1, requiredLevel: 1, spCost: 0, mpCost: 9, power: 42 }],
};

