import { SkillDefinition } from "../../../types";

// Dance of Light - temporarily bestows sacred power to party members' physical attack
export const skill_0277: SkillDefinition = {
  id: 277,
  code: "BD_0277",
  name: "Dance of Light",
  description: "Temporarily bestows sacred power to party members' physical attack. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно наделяет физическую атаку членов группы священной силой. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0277.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "holyAttack", mode: "multiplier", multiplier: 1.3 }, // Increases holy attack power by 30%
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 46000, mpCost: 60, power: 1 },
  ],
};

