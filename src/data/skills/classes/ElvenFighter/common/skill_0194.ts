import { SkillDefinition } from "../../../types";

// Lucky - passive skill that prevents death penalty
export const skill_0194: SkillDefinition = {
  id: 194,
  code: "ELF_0194",
  name: "Lucky",
  description: "Removes the death penalty and item drop while you are Level 4 and under.\n\nУдаляет штраф за смерть и потерю предметов на уровнях до 4 включительно.",
  icon: "/skills/skill0194.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

