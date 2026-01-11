import { SkillDefinition } from "../../../types";

// Mana Recovery - increases MP recovery speed when wearing robes
export const skill_0214: SkillDefinition = {
  id: 214,
  code: "EM_0214",
  name: "Mana Recovery",
  description: "Increases MP recovery speed when wearing a robe jacket and robe pants. Increases MP regeneration when wearing Robe by 20%.\n\nУскоряет регенерацию MP при ношении мантии и штанов мантии на 20%. Пассивный навык.",
  icon: "/skills/Skill0214_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 20 },
  ],
};

