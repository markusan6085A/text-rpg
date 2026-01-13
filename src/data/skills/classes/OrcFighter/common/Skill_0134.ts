import { SkillDefinition } from "../../../types";

export const Skill_0134: SkillDefinition = {
  id: 134,
  code: "OF_0134",
  name: "Toughness",
  description: "Has tolerance for various irregularities.\n\nСнижает урон от оглушения на 20%.\nСнижает урон от удержания на 20%.\nСнижает урон от яда на 20%.",
  icon: "/skills/skill0134.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0.8 },
    { stat: "holdResist", mode: "multiplier", multiplier: 0.8 },
    { stat: "poisonResist", mode: "multiplier", multiplier: 0.8 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

