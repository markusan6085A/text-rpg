import { SkillDefinition } from "../../../types";

// Spellcraft - doubles spell casting speed when wearing robes
export const skill_0163: SkillDefinition = {
  id: 163,
  code: "EM_0163",
  name: "Spellcraft",
  description: "Doubles the spell casting speed when wearing a robe jacket and robe pants. Increases Casting Spd. when wearing Light armor and decreases when wearing Heavy armor by 50%.\n\nУдваивает скорость каста заклинаний при ношении мантии и штанов мантии. При ношении Light увеличивает на 50%, при ношении Heavy уменьшает на 50%. Пассивный навык.",
  icon: "/skills/Skill0163_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent", value: 50 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 50 },
  ],
};

