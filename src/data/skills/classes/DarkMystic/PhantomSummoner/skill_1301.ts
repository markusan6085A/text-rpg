import { SkillDefinition } from "../../../types";

export const skill_1301: SkillDefinition = {
  id: 1301,
  code: "DMP_1301",
  name: "Servitor Blessing",
  description: "Cancels the reduced state of hold and paralysis. Also cancels the reduced state of Atk. Spd. and Speed of effect 3 or below.\n\nСнимает эффекты удержания и паралича у слуги.",
  icon: "/skills/skill1301.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 62, power: 0, mpCost: 46, spCost: 310000 },
  ],
};

