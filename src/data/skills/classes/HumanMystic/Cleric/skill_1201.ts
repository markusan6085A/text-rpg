import { SkillDefinition } from "../../../types";

export const skill_1201: SkillDefinition = {
  id: 1201,
  code: "HM_1201",
  name: "Dryad Root",
  description: "Instantly throws an enemy into a state of hold. While the effect lasts, the target cannot receive any additional hold attack.\n\nМгновенно обездвиживает врага. Пока действует эффект, цель не может быть подвергнута дополнительным атакам удержания.",
  icon: "/skills/skill1201.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 8,
  duration: 30,
  chance: 80,
  effects: [
    {
      stat: "hold",
      mode: "flat",
      value: 1,
    },
  ],
  stackType: "Root",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 25, spCost: 2300, mpCost: 22, power: 80 },
    { level: 2, requiredLevel: 25, spCost: 2300, mpCost: 22, power: 80 },
    { level: 3, requiredLevel: 25, spCost: 2300, mpCost: 23, power: 80 },
    { level: 4, requiredLevel: 30, spCost: 4400, mpCost: 25, power: 80 },
    { level: 5, requiredLevel: 30, spCost: 4400, mpCost: 27, power: 80 },
    { level: 6, requiredLevel: 30, spCost: 4400, mpCost: 27, power: 80 },
    { level: 7, requiredLevel: 35, spCost: 7300, mpCost: 29, power: 80 },
    { level: 8, requiredLevel: 35, spCost: 7300, mpCost: 30, power: 80 },
    { level: 9, requiredLevel: 35, spCost: 7300, mpCost: 30, power: 80 },
  ],
};

