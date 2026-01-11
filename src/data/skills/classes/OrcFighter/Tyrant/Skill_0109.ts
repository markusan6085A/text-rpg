import { SkillDefinition } from "../../../types";

export const Skill_0109: SkillDefinition = {
  id: 109,
  code: "TY_0109",
  name: "Spirit of Ogre",
  description: "The spirit of the Ogre possesses you, temporarily increasing P. Def. and M. Def. when using hand-to-hand combat weapons. Speed and Evasion are decreased while the effect lasts.\n\nДух огра овладевает вами, временно увеличивая физ. и маг. защиту при использовании оружия для рукопашного боя. Скорость и уклонение уменьшаются, пока действует эффект.",
  icon: "/skills/skill0109.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 120,
  duration: 300,
  stackType: "totem_spirit",
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1.3, duration: 300 },
    { stat: "mDef", mode: "multiplier", multiplier: 1.3, duration: 300 },
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, duration: 300 },
    { stat: "evasion", mode: "flat", value: -9, duration: 300 },
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 60000, mpCost: 5, power: 0 },
  ],
};

