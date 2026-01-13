import { SkillDefinition } from "../../../types";

// Arcane Agility
export const skill_0338: SkillDefinition = {
  id: 338,
  code: "DMSM_0338",
  name: "Arcane Agility",
  description: "Significantly increases Casting Spd. and decreases skill re-use time at an increased MP consumption per skill. HP will be continuously consumed while in effect.\n\nЗначно збільшує швидкість кастування та зменшує час повторного використання скілів при збільшеній витраті MP на скіл. HP буде постійно споживатися під час дії.",
  icon: "/skills/skill0338.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  hpPerTick: 250, // 150 HP per 3 seconds ≈ 250 HP per 5 seconds
  tickInterval: 5,
  effects: [
    { stat: "castSpeed", mode: "percent", value: 20 },
    { stat: "cooldownReduction", mode: "percent", value: 10 }, // mReuse reduction = cooldown reduction
    // magicalMpConsumeRate is handled by game logic, not as a stat modifier
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      power: 0,
      mpCost: 36,
      spCost: 32000000,
    },
  ],
};

