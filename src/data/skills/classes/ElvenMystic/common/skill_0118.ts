import { SkillDefinition } from "../../../types";

// Magician's Movement - increases attack speed when wearing robes
export const skill_0118: SkillDefinition = {
  id: 118,
  code: "EM_0118",
  name: "Magician's Movement",
  description: "Increases attack speed when wearing a robe jacket and robe pants. Increases Casting Spd. and Atk. Spd. when wearing Light armor, and decreases when wearing Heavy armor by 20%.\n\nУвеличивает скорость каста и скорость атаки при ношении мантии, при ношении Light на 20%, при ношении Heavy уменьшает на 20%. Пассивный навык.",
  icon: "/skills/Skill0118_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent", value: 5 },
    { stat: "atkSpeed", mode: "percent", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 5 },
  ],
};

