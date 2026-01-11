import { SkillDefinition } from "../../../types";

// Lucky  death penalty protection for low levels
export const skill_0194: SkillDefinition = {
  id: 194,
  code: "HM_0194",
  name: "Lucky",
  description: "Removes death penalty and item drop penalty for levels up to 4 inclusive.\n\nУбирает штраф за смерть и выпадение предметов на уровнях до 4 включительно. Пассивный навык.",
  icon: "/skills/Skill0194_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};


