import { SkillDefinition } from "../../../types";

export const Skill_0282: SkillDefinition = {
  id: 282,
  code: "TY_0282",
  name: "Totem Spirit Puma",
  description: "The spirit of the puma possesses you, temporarily increasing Accuracy and Atk. Spd. when using hand-to-hand combat weapons.\n\nДух пумы овладевает вами, временно увеличивая точность и скорость атаки при использовании оружия для рукопашного боя.",
  icon: "/skills/skill0282.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 120,
  duration: 300,
  stackType: "totem_spirit",
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.2, duration: 300 },
    { stat: "accuracy", mode: "flat", value: 6, duration: 300 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 39000, mpCost: 4, power: 0 },
  ],
};

