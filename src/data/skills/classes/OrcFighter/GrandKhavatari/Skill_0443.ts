import { SkillDefinition } from "../../../types";

export const Skill_0443: SkillDefinition = {
  id: 443,
  code: "GK_0443",
  name: "Force Barrier",
  description: "С помощью силы духа на 10 сек. создается временный защитный барьер, непроницаемый для нормальных ударов, умений, усиливающих и ослабляющих заклинаний. Применяется с кастетом. Необходима зарядка энергией до 4-го уровня.\n\nUses spiritual forces to create a temporary protective barrier that is impervious to normal strikes, skills, buffs/debuffs. An equipped hand-to-hand combat weapon is required to use this skill. Level 4 Focused Force charge required.",
  icon: "/skills/skill0443.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 180, // 3 minutes
  duration: 10, // 10 seconds
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1000 },
    { stat: "mDef", mode: "multiplier", multiplier: 1000 },
    { stat: "invulnerable", mode: "flat", value: 1 },
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 79,
      spCost: 60000000,
      mpCost: 72,
      power: 0,
    },
  ],
};

