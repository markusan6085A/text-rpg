import { SkillDefinition } from "../../../types";

export const skill_1157: SkillDefinition = {
  id: 1157,
  code: "HM_1157",
  name: "Body To Mind",
  description: "Regenerates the MP of others by sacrificing one's own HP.\n\nВосстанавливает MP других, жертвуя своим HP. Эффект Body To Mind, кастуется на себя: прибавляет 22 MP цели. Каст: 4 сек. Перезарядка: 20 сек.",
  icon: "/skills/skill1157.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 25,
    "spCost": 5500,
    "mpCost": 0,
    "power": 0
  }
]
};
