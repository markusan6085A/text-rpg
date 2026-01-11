import { SkillDefinition } from "../../../types";

// Sonic Guard   ,  4  Sonic Focus   10 .
export const Skill_0442: SkillDefinition = {
  id: 442,
  code: "GL_0442",
  name: "Sonic Guard",
  description: "Uses sonic force to create a temporary protective barrier that is impervious to normal strikes, skills, buffs/debuffs.\n\nИспользует звуковую силу для создания временного защитного барьера, непроницаемого для обычных ударов, навыков, бафов/дебафов на 10 сек. Требуется заряд Sonic Focus 5 уровня. Требуется парное оружие. Каст: 2 сек. Перезарядка: 15 мин.",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  cooldown: 180, // 3 minutes
  icon: "/skills/Skill0442_0.jpg",
  duration: 10, // 10 seconds
  effects: [
    { stat: "pDef", mode: "multiplier", value: 1000 },
    { stat: "mDef", mode: "multiplier", value: 1000 },
    { stat: "invulnerable", mode: "flat", value: 1 },
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 70,
      spCost: 500000,
      mpCost: 40,
      power: 0,
    },
  ],
};

