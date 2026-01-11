import { SkillDefinition } from "../../../types";

export const skill_1043: SkillDefinition = {
  id: 1043,
  code: "HM_1043",
  name: "Holy Weapon",
  description: "A temporary holy enhancement of a physical attack. Can be used on one's party members.\n\nВременное святое усиление физической атаки. Можно использовать на членах группы. Длительность: 20 мин.",
  icon: "/skills/skill1043.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "holyAttack", mode: "multiplier", value: 1.3 }],
  stackType: "holy_weapon",
  stackOrder: 1,
  levels: [{ level: 1, requiredLevel: 25, spCost: 6900, mpCost: 23, power: 1.3 }],
};

