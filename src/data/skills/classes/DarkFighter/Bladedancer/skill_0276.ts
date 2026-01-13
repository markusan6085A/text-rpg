import { SkillDefinition } from "../../../types";

// Dance of Concentration - temporarily decreases party members' magic cancel rate and increases Casting Spd
export const skill_0276: SkillDefinition = {
  id: 276,
  code: "BD_0276",
  name: "Dance of Concentration",
  description: "Temporarily decreases party members' magic cancel rate to damage and increases Casting Spd. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nВременно уменьшает шанс прерывания магии у членов группы и увеличивает скорость заклинаний. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0276.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "cancel", mode: "flat", value: -30 }, // Reduces cancel rate
    { stat: "castSpeed", mode: "multiplier", multiplier: 1.4 }, // Increases by 40%
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 170000, mpCost: 60, power: 1 },
  ],
};

