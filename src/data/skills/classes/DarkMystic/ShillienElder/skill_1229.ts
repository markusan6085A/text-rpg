import { SkillDefinition } from "../../../types";

const levels = [
  { level: 1, requiredLevel: 62, spCost: 360000, mpCost: 58, power: 40 },
  { level: 2, requiredLevel: 70, spCost: 940000, mpCost: 65, power: 60 } // +40% (Lv.1) + 20% (Lv.2) = +60% всього
];

export const skill_1229: SkillDefinition = {
  id: 1229,
  code: "DME_1229",
  name: "Wild Magic",
  description: "Temporarily increases critical attack rate of magic attacks.\n\nВременно увеличивает шанс критической атаки магических атак.",
  icon: "/skills/skill1303.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "skillCritRate", mode: "percent" }], // value використовується з level.power
  stackType: "wild_magic",
  stackOrder: 1,
  levels,
};
