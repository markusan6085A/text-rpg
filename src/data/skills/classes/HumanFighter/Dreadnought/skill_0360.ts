import { SkillDefinition } from "../../../types";

export const skill_0360: SkillDefinition = {
  id: 360,
  code: "DN_0360",
  name: "Eye of Slayer",
  description: "Temporarily increases P. Atk. against the beasts/magic creatures/giants/dragons.\n\nВременно увеличивает физ. атаку против зверей/магических существ/гигантов/драконов на 40% на 10 мин. Каст: 2 сек. Перезарядка: 2 сек.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0360.gif",
  castTime: 2,
  cooldown: 10,
  duration: 600,
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 71, power: 0 },
  ],
};

