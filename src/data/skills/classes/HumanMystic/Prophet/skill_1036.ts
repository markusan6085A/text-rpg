import { SkillDefinition } from "../../../types";

export const skill_1036: SkillDefinition = {
  id: 1036,
  code: "HM_1036",
  name: "Magic Barrier",
  description: "Temporarily increases M. Def. Effect 2.\n\nВременно увеличивает магическую защиту. Эффект 2.",
  icon: "/skills/skill1036.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "mDef",
      mode: "percent",
      value: 30
    }
  ],
  stackType: "magic_barrier",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 1.23
    },
    {
      level: 2,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 1.3
    }
  ]
};

