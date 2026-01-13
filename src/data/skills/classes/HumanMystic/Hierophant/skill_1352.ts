import { SkillDefinition } from "../../../types";

export const skill_1352: SkillDefinition = {
  id: 1352,
  code: "HM_1352",
  name: "Elemental Protection",
  description: "Temporarily increases resistance to fire/water/wind/earth attack. Effect 3.\n\nВременно увеличивает сопротивление к атакам огнем/водой/ветром/землей. Эффект 3.",
  category: "buff",
  powerType: "percent",
  icon: "/skills/skill1352.gif",
  target: "party",
  duration: 1200,
  castTime: 4,
  cooldown: 10,
  effects: [
    { stat: "fireResist", mode: "percent", value: 30 },
    { stat: "waterResist", mode: "percent", value: 20 },
    { stat: "windResist", mode: "percent", value: 20 },
    { stat: "earthResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 70, power: 0.8 },
  ],
};

