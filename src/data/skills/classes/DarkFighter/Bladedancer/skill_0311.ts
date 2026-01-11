import { SkillDefinition } from "../../../types";

// Dance of Protection - temporarily increases party members' resistance to terrain damage
export const skill_0311: SkillDefinition = {
  id: 311,
  code: "BD_0311",
  name: "Dance of Protection",
  description: "Temporarily increases party members' resistance to terrain damage. Continuous singing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает сопротивление членов группы к урону от местности. Постоянное пение расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0311.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "fallResist", mode: "flat", value: 30 }, // Increases resistance to terrain damage
  ],
  levels: [
    { level: 1, requiredLevel: 66, spCost: 700000, mpCost: 60, power: 1 },
  ],
};

