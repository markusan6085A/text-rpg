import { SkillDefinition } from "../../../types";

// Dance of Siren - temporarily increases party members' critical rate of magic attacks significantly
export const skill_0365: SkillDefinition = {
  id: 365,
  code: "SD_0365",
  name: "Dance of Siren",
  description: "Temporarily increases party members' critical rate of magic attacks significantly. Continuous singing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно значительно увеличивает шанс критического удара магических атак членов группы. Постоянное пение расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0365.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30, // Continuous MP consumption
  effects: [
    { stat: "skillCritRate", mode: "multiplier", multiplier: 3.0 }, // Increases magic critical rate by 200%
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 64000000, mpCost: 60, power: 1 },
  ],
};

