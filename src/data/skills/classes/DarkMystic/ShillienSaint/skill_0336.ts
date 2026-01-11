import { SkillDefinition } from "../../../types";

// Arcane Wisdom - from XML
// mAtkSpd 0.9 = -10% cast speed (multiplier)
// MagicalMpConsumeRate 0.7 = -30% MP consumption (multiplier)
// hpPerTick: 150 HP every 3 seconds (50HP/sec * 3 sec)
export const skill_0336: SkillDefinition = {
  id: 336,
  code: "DMS_0336",
  name: "Arcane Wisdom",
  description: "Significantly increases efficiency of magic and decreases MP consumption of skills. Casting Spd. is decreased and HP will be continuously consumed while in effect.\n\nЗначительно увеличивает эффективность магии и снижает потребление MP скілами на 30%. Скорость каста снижена на 10%. Потребляет 150 HP каждые 3 сек.",
  icon: "/skills/skill0336.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0,
  toggle: true,
  hpPerTick: 150, // 150 HP every 3 seconds (from XML: 50HP/sec, stat update every 3 sec)
  tickInterval: 3,
  effects: [
    { stat: "castSpeed", mode: "multiplier", multiplier: 0.9 }, // mAtkSpd 0.9 = -10% cast speed
    // MagicalMpConsumeRate 0.7 = -30% MP consumption (handled by game logic)
  ],
  stackType: "arcane_wisdom",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 36,
      power: 0,
    },
  ],
};

