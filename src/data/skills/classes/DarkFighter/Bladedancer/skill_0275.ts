import { SkillDefinition } from "../../../types";

// Dance of Fury - temporarily increases party members' attack speed
export const skill_0275: SkillDefinition = {
  id: 275,
  code: "BD_0275",
  name: "Dance of Fury",
  description: "Temporarily increases party members' attack speed. Continuous singing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает скорость атаки членов группы. Постоянное пение расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0275.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.15 }, // Increases by 15%
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 240000, mpCost: 60, power: 1 },
  ],
};

