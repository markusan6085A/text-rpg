import { SkillDefinition } from "../../../types";

export const skill_1144: SkillDefinition = {
  id: 1144,
  code: "HM_1144",
  name: "Servitor Wind Walk",
  description: "Увеличивает скорость передвижения саммона.",
  icon: "/skills/skill1144.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  levels: [
  {
    "level": 2,
    "requiredLevel": 48,
    "spCost": 75000,
    "mpCost": 46,
    "power": 0
  }
]
};

