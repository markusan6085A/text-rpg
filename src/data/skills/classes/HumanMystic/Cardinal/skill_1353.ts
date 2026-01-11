import { SkillDefinition } from "../../../types";

export const skill_1353: SkillDefinition = {
  id: 1353,
  code: "HM_1353",
  name: "Divine Protection",
  description: "Temporarily increases resistance to dark attacks.\n\nВременно увеличивает сопротивление к темным атакам.",
  icon: "/skills/skill1353.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200,
  effects: [{ stat: "darkResist", mode: "percent", value: 30 }],
  stackType: "divine_protection",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 13000000,
      mpCost: 70,
      power: 0,
    },
  ],
};

