import { SkillDefinition } from "../../../types";

// Self Heal - 1 level from XML
// power: 42.0, mpConsume: 7
export const skill_1216: SkillDefinition = {
  id: 1216,
  code: "DM_1216",
  name: "Self Heal",
  description: "Recovers HP.\n\nВосстанавливает HP.",
  icon: "/skills/Skill1216_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [{ level: 1, requiredLevel: 1, spCost: 0, mpCost: 7, power: 42.0 }],
};


