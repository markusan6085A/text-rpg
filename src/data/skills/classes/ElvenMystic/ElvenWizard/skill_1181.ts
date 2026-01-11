import { SkillDefinition } from "../../../types";

// Flame Strike - toss flame that causes wide area to catch fire
export const skill_1181: SkillDefinition = {
  id: 1181,
  code: "EW_1181",
  name: "Flame Strike",
  description: "Toss flame that causes wide area to catch fire. Power 13.\n\nБросает пламя, которое поджигает широкую область. Сила: 13-19 (зависит от уровня). Атака огнем, кастуется на врагов, действует на врагов в радиусе 200 вокруг выбранной цели в пределах дальности 500. Каст: 4 сек. Перезарядка: 15 сек.",
  icon: "/skills/skill1181.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  element: "fire",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 29, power: 13 },
    { level: 2, requiredLevel: 25, spCost: 6100, mpCost: 34, power: 16 },
    { level: 3, requiredLevel: 30, spCost: 12000, mpCost: 40, power: 19 },
  ],
};

