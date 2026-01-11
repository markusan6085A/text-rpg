import { SkillDefinition } from "../../../types";

// Mana Recovery  passive MP regen with robes
export const skill_0214: SkillDefinition = {
  id: 214,
  code: "HM_0214",
  name: "Mana Recovery",
  description: "Increases MP regeneration when wearing a robe jacket and robe pants.\n\nУскоряет регенерацию MP на 8% при ношении мантии и штанов мантии. Пассивный навык.",
  icon: "/skills/Skill0214_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 8 },
  ],
};


