import { SkillDefinition } from "../../../types";

export const skill_0320: SkillDefinition = {
  id: 320,
  code: "WL_0320",
  name: "Wrath",
  description: "By swinging a spear, decreases CP of near enemies. Usable when a spear is equipped.\n\nРазмахивая копьем, снижает CP ближайших врагов на 7-30% (зависит от уровня). Требуется копье. Каст: 1.08 сек. Перезарядка: 2 мин.",
  category: "physical_attack",
  powerType: "percent",
  target: "enemy",
  scope: "area",
  castTime: 1.08,
  cooldown: 120,
  icon: "/skills/skill0320.gif",
  levels: [
    { level: 1, requiredLevel: 66, spCost: 350000, mpCost: 73, power: 7 },
    { level: 2, requiredLevel: 66, spCost: 350000, mpCost: 74, power: 10 },
    { level: 3, requiredLevel: 68, spCost: 390000, mpCost: 75, power: 12 },
    { level: 4, requiredLevel: 68, spCost: 390000, mpCost: 77, power: 15 },
    { level: 5, requiredLevel: 70, spCost: 420000, mpCost: 78, power: 17 },
    { level: 6, requiredLevel: 70, spCost: 420000, mpCost: 79, power: 20 },
    { level: 7, requiredLevel: 72, spCost: 830000, mpCost: 80, power: 22 },
    { level: 8, requiredLevel: 72, spCost: 830000, mpCost: 81, power: 25 },
    { level: 9, requiredLevel: 74, spCost: 1000000, mpCost: 82, power: 27 },
    { level: 10, requiredLevel: 74, spCost: 1000000, mpCost: 83, power: 30 },
  ],
};

