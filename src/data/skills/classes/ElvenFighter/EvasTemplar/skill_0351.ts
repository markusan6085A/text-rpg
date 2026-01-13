import { SkillDefinition } from "../../../types";

// Magical Mirror - shield power that reflects back buffs/de-buffs from magic skill attacks
export const skill_0351: SkillDefinition = {
  id: 351,
  code: "ET_0351",
  name: "Magical Mirror",
  description: "A shield power that reflects back buffs/de-buffs one receives from magic skill attacks. Available when one is equipped with a shield.\n\nСила щита на 5 сек., действует на себя:\n- С шансом 10% отражает бафы (от магических навыков) назад.\n- С шансом 30% отражает дебафы (от магических навыков) назад.\n- Требуется щит для экипировки щита.",
  icon: "/skills/skill0351.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 600,
  duration: 5,
  effects: [
    { stat: "reflectSkillMagic", mode: "percent", value: 30 }, // 30% chance to reflect debuffs from magic skills
    { stat: "reflectSkillPhysic", mode: "percent", value: 10 }, // 10% chance to reflect buffs from magic skills
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 71, power: 0 },
  ],
};

