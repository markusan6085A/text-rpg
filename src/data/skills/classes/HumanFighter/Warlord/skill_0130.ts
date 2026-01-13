import { SkillDefinition } from "../../../types";

export const skill_0130: SkillDefinition = {
  id: 130,
  code: "WL_0130",
  name: "Thrill Fight",
  description: "Temporarily decreases Speed and increases Atk. Spd.\n\nВременно снижает скорость движения и увеличивает скорость атаки.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 300,
  icon: "/skills/skill0130.gif",
  effects: [{ stat: "atkSpeed", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 55000, mpCost: 21, power: 5 },
    { level: 2, requiredLevel: 55, spCost: 180000, mpCost: 25, power: 10 },
  ],
};

