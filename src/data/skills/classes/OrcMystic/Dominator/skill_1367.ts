import { SkillDefinition } from "../../../types";

// Seal of Disease - debuff skill that temporarily decreases enemy's alliance members' healing from heal spells and increases chance of buffs being removed
export const skill_1367: SkillDefinition = {
  id: 1367,
  code: "DOM_1367",
  name: "Seal of Disease",
  description: "Temporarily decreases enemy's alliance members' healing from heal spells and increases chance of buffs being removed.\n\nВременно уменьшает лечение от заклинаний исцеления членов альянса врага и увеличивает шанс снятия бафов.",
  icon: "/skills/skill1367.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 60,
  duration: 120, // 2 minutes
  chance: 40,
  stackType: "seal_disease", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  effects: [
    { stat: "healPower", mode: "multiplier", multiplier: 0.5 }, // Decreases healing by 50%
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 105, power: 50 },
  ],
};

