import { SkillDefinition } from "../../../types";

// Arcane Wisdom - toggle skill that significantly increases efficiency of magic and decreases MP consumption of skills. Casting Spd. is decreased and HP will be continuously consumed while in effect.
export const skill_0336: SkillDefinition = {
  id: 336,
  code: "DC_0336",
  name: "Arcane Wisdom",
  description: "Significantly increases efficiency of magic and decreases MP consumption of skills by 30%. Casting Spd. is decreased by 10% and HP will be continuously consumed (250 HP every 5 seconds) while in effect.\n\nЗначительно увеличивает эффективность магии и уменьшает расход MP на навыки на 30%. Скорость каста уменьшается на 10% и HP будет непрерывно расходоваться (250 HP каждые 5 секунд) во время действия.",
  icon: "/skills/skill0336.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  hpPerTick: -250, // Consumes 250 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    // Note: MP cost decrease (30%) is handled in skill application logic (MagicalMpConsumeRate in XML)
    { stat: "castSpeed", mode: "percent", value: -10 }, // Decreases cast speed by 10%
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 30 },
  ],
  stackType: "arcane_wisdom", // Unique stackType - different levels replace each other
};

