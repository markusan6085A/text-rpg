import { SkillDefinition } from "../../../types";

// Dance of Inspiration - temporarily increases party members' accuracy
export const skill_0272: SkillDefinition = {
  id: 272,
  code: "BD_0272",
  name: "Dance of Inspiration",
  description: "Temporarily increases party members' accuracy. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает точность членов группы. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0272.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "accuracy", mode: "flat", value: 4 },
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 66000, mpCost: 60, power: 1 },
  ],
};

