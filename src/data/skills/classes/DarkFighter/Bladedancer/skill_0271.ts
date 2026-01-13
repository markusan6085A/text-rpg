import { SkillDefinition } from "../../../types";

// Dance of Warrior - temporarily boosts party members' P. Atk
export const skill_0271: SkillDefinition = {
  id: 271,
  code: "BD_0271",
  name: "Dance of Warrior",
  description: "Temporarily boosts party members' P. Atk. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает физическую атаку членов группы. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0271.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.12 }, // Increases by 12%
  ],
  levels: [
    { level: 1, requiredLevel: 55, spCost: 200000, mpCost: 60, power: 1 },
  ],
};

