import { SkillDefinition } from "../../../types";

// Dance of Earth Guard - temporarily increases party members' resistance to attacks by earth
export const skill_0309: SkillDefinition = {
  id: 309,
  code: "BD_0309",
  name: "Dance of Earth Guard",
  description: "Temporarily increases party members' resistance to attacks by earth. Continuous singing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает сопротивление членов группы к атакам земли. Постоянное пение расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0309.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "earthResist", mode: "multiplier", multiplier: 1.3 }, // Increases by 30%
  ],
  levels: [
    { level: 1, requiredLevel: 62, spCost: 440000, mpCost: 60, power: 1 },
  ],
};

