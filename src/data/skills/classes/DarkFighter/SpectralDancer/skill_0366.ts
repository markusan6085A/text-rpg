import { SkillDefinition } from "../../../types";

// Dance of Shadow - temporarily decreases party members' speed and bestows the ability to be protected from monsters' preemptive attacks
export const skill_0366: SkillDefinition = {
  id: 366,
  code: "SD_0366",
  name: "Dance of Shadow",
  description: "Temporarily decreases party members' speed and bestows the ability to be protected from monsters' preemptive attacks. Additional song, while other songs/dances are in effect, will consume additional MP. Usable when one is equipped with a two-sword type weapon.\n\nВременно уменьшает скорость членов группы и наделяет способностью быть защищенными от упреждающих атак монстров. Дополнительная песня, пока действуют другие песни/танцы, будет расходовать дополнительный MP. Доступно при экипировке парного меча.",
  icon: "/skills/skill0366.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes
  mpPerTick: 30, // Continuous MP consumption
  effects: [
    { stat: "evasion", mode: "multiplier", multiplier: 2.0 }, // Increases evasion by 100%
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.5 }, // Decreases speed by 50%
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 60, power: 1 },
  ],
};

