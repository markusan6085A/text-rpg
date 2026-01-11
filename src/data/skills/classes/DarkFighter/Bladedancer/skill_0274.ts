import { SkillDefinition } from "../../../types";

// Dance of Fire - temporarily increases party members' critical damage
export const skill_0274: SkillDefinition = {
  id: 274,
  code: "BD_0274",
  name: "Dance of Fire",
  description: "Temporarily increases party members' critical damage. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает критический урон членов группы. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0274.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30, // Continuous MP consumption
  effects: [
    { stat: "critDamage", mode: "multiplier", multiplier: 1.35 }, // Increases by 35%
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 43000, mpCost: 60, power: 1 },
  ],
};

