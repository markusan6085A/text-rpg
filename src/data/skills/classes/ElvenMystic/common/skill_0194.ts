import { SkillDefinition } from "../../../types";

// Lucky - removes death penalty and item drop penalty for low levels
export const skill_0194: SkillDefinition = {
  id: 194,
  code: "EM_0194",
  name: "Lucky",
  description: "Removes the death penalty and item drop penalty while you are Level 4 and under.\n\nУбирает штраф за смерть и выпадение предметов на уровнях до 4 включительно. Пассивный навык.",
  icon: "/skills/Skill0194_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

