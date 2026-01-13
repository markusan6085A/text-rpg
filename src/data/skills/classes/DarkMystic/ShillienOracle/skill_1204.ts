import { SkillDefinition } from "../../../types";

// Wind Walk - 2 levels from XML
// runSpd: 20, 33 (flat addition)
// mpConsume: 16, 21
export const skill_1204: SkillDefinition = {
  id: 1204,
  code: "DMO_1204",
  name: "Wind Walk",
  description: "Increases movement speed for 20 minutes.\n\nУвеличивает скорость передвижения на 20 минут.",
  icon: "/skills/Skill1204_0.jpg",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "runSpeed", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 16, power: 20 },
    { level: 2, requiredLevel: 35, spCost: 23000, mpCost: 21, power: 33 },
  ],
};

