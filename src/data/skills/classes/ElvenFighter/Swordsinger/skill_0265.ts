import { SkillDefinition } from "../../../types";

// Song of Life - temporarily increases party members' HP regeneration
export const skill_0265: SkillDefinition = {
  id: 265,
  code: "SS_0265",
  name: "Song of Life",
  description: "Temporarily increases party members' HP regeneration. Continuous singing consumes additional MP.\n\nВременно увеличивает регенерацию HP членов партии на 20% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0265.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "party",
  toggle: true,
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 minutes (changed from 120)
  mpPerTick: -30, // Consumes 30 MP per second
  tickInterval: 1,
  effects: [
    { stat: "hpRegen", mode: "multiplier", multiplier: 1.2 }, // 20% increase
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 210000, mpCost: 60, power: 0 },
  ],
};

