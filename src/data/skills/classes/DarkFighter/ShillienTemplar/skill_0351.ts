import { SkillDefinition } from "../../../types";

// Magical Mirror - shield power that reflects back buffs/de-buffs from magic skill attacks
export const skill_0351: SkillDefinition = {
  id: 351,
  code: "ST_0351",
  name: "Magical Mirror",
  description: "A shield power that reflects back buffs/de-buffs one receives from magic skill attacks. Available when one is equipped with a shield.\n\nСила щита, которая отражает бафы/дебафы, полученные от магических атак. Доступно при экипировке щита.",
  icon: "/skills/skill0351.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 600,
  duration: 5,
  effects: [
    { stat: "reflectSkillMagic", mode: "percent", value: 30 }, // 30% chance to reflect magic skills
    { stat: "reflectSkillPhysic", mode: "percent", value: 10 }, // 10% chance to reflect physical skills
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 71, power: 0 },
  ],
};

