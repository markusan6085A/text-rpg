import { SkillDefinition } from "../../../types";

export const skill_1191: SkillDefinition = {
  id: 1191,
  code: "HM_1191",
  name: "Resist Fire",
  description: "Temporarily increases resistance to fire attacks.\n\nВременно увеличивает сопротивление к огненным атакам.",
  icon: "/skills/skill1191.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "fireResist", mode: "flat", value: 30 }],
  stackType: "resist_fire",
  stackOrder: 1,
  levels: [{ level: 1, requiredLevel: 30, spCost: 13000, mpCost: 27, power: 0.85 }],
};

