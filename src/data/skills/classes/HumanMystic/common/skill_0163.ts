import { SkillDefinition } from "../../../types";

export const skill_0163: SkillDefinition = {
  id: 163,
  code: "HM_0163",
  name: "Spellcraft",
  description: "Doubles spell casting speed when wearing a robe jacket and robe pants.\n\nУдваивает скорость каста заклинаний при ношении мантии и штанов мантии. Пассивный навык.",
  icon: "/skills/Skill0163_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 5 },
  ],
};


