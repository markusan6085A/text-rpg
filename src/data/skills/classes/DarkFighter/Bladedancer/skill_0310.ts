import { SkillDefinition } from "../../../types";

// Dance of Vampire - partially restores party members' HP by using damage inflicted upon the enemy
export const skill_0310: SkillDefinition = {
  id: 310,
  code: "BD_0310",
  name: "Dance of Vampire",
  description: "Partially restores party members' HP by using damage inflicted upon the enemy. Damage inflicted by skill or remote attack is excluded. Continuous dancing consumes additional MP. Usable when a dual-sword is equipped.\n\nЧастично восстанавливает HP членов группы, используя урон, нанесенный врагу. Урон от скілов и дальних атак исключается. Постоянный танец расходует дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0310.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30,
  effects: [
    { stat: "vampirism", mode: "percent", value: 8 }, // Restores 8% of physical damage as HP
  ],
  levels: [
    { level: 1, requiredLevel: 74, spCost: 2300000, mpCost: 60, power: 1 },
  ],
};

