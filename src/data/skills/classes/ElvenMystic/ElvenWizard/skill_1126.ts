import { SkillDefinition } from "../../../types";

// Servitor Recharge - recovers a Servitor's MP
export const skill_1126: SkillDefinition = {
  id: 1126,
  code: "EW_1126",
  name: "Servitor Recharge",
  description: "Recovers a Servitor's MP. Power 41.\n\nВосстанавливает MP сервитора. Восстанавливает 41-60 MP (зависит от уровня), зависит от уровня сервитора. Кастуется на сервитора, действует в пределах дальности 400. Каст: 4 сек. Перезарядка: 12 сек.",
  icon: "/skills/skill1126.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 12,
  levels: [
    { level: 1, requiredLevel: 25, spCost: 3100, mpCost: 42, power: 41 },
    { level: 2, requiredLevel: 25, spCost: 3100, mpCost: 44, power: 44 },
    { level: 3, requiredLevel: 30, spCost: 5800, mpCost: 49, power: 49 },
    { level: 4, requiredLevel: 30, spCost: 5800, mpCost: 53, power: 52 },
    { level: 5, requiredLevel: 35, spCost: 10000, mpCost: 57, power: 57 },
    { level: 6, requiredLevel: 35, spCost: 10000, mpCost: 60, power: 60 },
  ],
};

