import { SkillDefinition } from "../../../types";

// Arcane Agility - Toggle skill that increases Casting Spd. and decreases cooldown, but increases MP consumption and continuously consumes HP
export const skill_0338: SkillDefinition = {
  id: 338,
  code: "EM_0338",
  name: "Arcane Agility",
  description: "Significantly increases Casting Spd. and decreases skill re-use time at an increased MP consumption per skill. HP will be continuously consumed while in effect.\n\nЗначительно увеличивает скорость каста на 20% и уменьшает время перезарядки навыков на 10% при увеличенном потреблении MP за навык на 10%. HP будет постоянно расходоваться (250 HP каждые 5 сек) во время действия.",
  icon: "/skills/skill0338.gif",
  category: "toggle",
  toggle: true,
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 0, // Toggle skills have no duration
  castTime: 0,
  cooldown: 1, // 1 second cooldown for toggling
  hpPerTick: 250, // Consumes 250 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "castSpeed", mode: "percent", value: 20 },
    { stat: "cooldownReduction", mode: "percent", value: 10 },
    { stat: "mpRegen", mode: "percent", value: -10 }, // Increases MP consumption by 10% (negative mpRegen increases consumption)
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

