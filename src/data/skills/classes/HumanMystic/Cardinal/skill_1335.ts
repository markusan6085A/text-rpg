import { SkillDefinition } from "../../../types";

export const skill_1335: SkillDefinition = {
  id: 1335,
  code: "HM_1335",
  name: "Mass Resurrection",
  description: "Resurrects party members.\n\nВоскрешает членов группы.",
  icon: "/skills/skill1335.gif",
  category: "special",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 5,
  cooldown: 120,
  duration: 0,
  effects: [],
  levels: [
    {
      level: 1,
      requiredLevel: 76,
      spCost: 10000000,
      mpCost: 62,
      power: 0,
    },
  ],
};

