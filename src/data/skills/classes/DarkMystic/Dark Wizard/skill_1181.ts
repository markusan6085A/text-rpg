import { SkillDefinition } from "../../../types";

// Flame Strike
export const skill_1181: SkillDefinition = {
  id: 1181,
  code: "DW_1181",
  name: "Flame Strike",
  description: "Toss flame that causes wide area to catch fire. Power 13.\n\nАтака огнем, кастуется на врагов, действует на врагов в радиусе 200 вокруг выбранной цели в пределах дальности 500: - Магическая атака силой 13.",
  icon: "/skills/skill1181.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 15,
  element: "fire",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 29, power: 13.0 },
    { level: 2, requiredLevel: 25, spCost: 5500, mpCost: 34, power: 16.0 },
    { level: 3, requiredLevel: 30, spCost: 11000, mpCost: 40, power: 19.0 },
  ],
};

