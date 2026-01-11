import { SkillDefinition } from "../../../types";

// Dance of Mystic - temporarily increases party members' M. Atk
export const skill_0273: SkillDefinition = {
  id: 273,
  code: "BD_0273",
  name: "Dance of Mystic",
  description: "Temporarily increases party members' M. Atk. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно увеличивает магическую атаку членов группы. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0273.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "mAtk", mode: "multiplier", multiplier: 1.2 }, // Increases by 20%
  ],
  levels: [
    { level: 1, requiredLevel: 49, spCost: 89000, mpCost: 60, power: 1 },
  ],
};

