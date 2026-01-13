import { SkillDefinition } from "../../../types";

// Dance of Aqua Guard - temporarily increases party members' resistance to attacks by water
export const skill_0307: SkillDefinition = {
  id: 307,
  code: "BD_0307",
  name: "Dance of Aqua Guard",
  description: "Temporarily increases party members' resistance to attacks by water. Continuous singing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает сопротивление членов группы к атакам воды. Постоянное пение расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0307.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "waterResist", mode: "multiplier", multiplier: 1.3 }, // Increases by 30%
  ],
  levels: [
    { level: 1, requiredLevel: 70, spCost: 1000000, mpCost: 60, power: 1 },
  ],
};

