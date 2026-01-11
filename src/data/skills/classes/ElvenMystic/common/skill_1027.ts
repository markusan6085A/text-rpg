import { SkillDefinition } from "../../../types";

// Group Heal - recovers party member's HP
export const skill_1027: SkillDefinition = {
  id: 1027,
  code: "EM_1027",
  name: "Group Heal",
  description: "Recovers party member's HP. Power 66.\n\nВосстанавливает HP членов группы. Сила: 66-86 (зависит от уровня). Каст: 7 сек. Перезарядка: 25 сек.",
  icon: "/skills/Skill1027_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "party",
  castTime: 7,
  cooldown: 25,
  levels: [
    { level: 1, requiredLevel: 14, spCost: 700, mpCost: 33, power: 66 },
    { level: 2, requiredLevel: 14, spCost: 700, mpCost: 38, power: 76 },
    { level: 3, requiredLevel: 14, spCost: 700, mpCost: 43, power: 86 },
  ],
};

