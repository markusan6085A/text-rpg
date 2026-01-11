import { SkillDefinition } from "../../../types";

// Magician's Movement  passive cast/attack speed with robes
export const skill_0118: SkillDefinition = {
  id: 118,
  code: "HM_0118",
  name: "Magician's Movement",
  description: "Increases Casting Spd. and Atk. Spd. when wearing robes.\n\nУвеличивает скорость каста и скорость атаки на 5% при ношении мантии. Пассивный навык.",
  icon: "/skills/Skill0118_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent" },
    { stat: "atkSpeed", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 5 },
  ],
};


