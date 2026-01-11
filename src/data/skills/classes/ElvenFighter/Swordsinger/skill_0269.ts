import { SkillDefinition } from "../../../types";

// Song of Hunter - temporarily increases party members' critical rate
export const skill_0269: SkillDefinition = {
  id: 269,
  code: "SS_0269",
  name: "Song of Hunter",
  description: "Temporarily increases party members' critical rate. Continuous singing consumes additional MP.\n\nВременно увеличивает шанс критического удара членов партии на 100% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0269.gif",
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
  stackType: "song_of_hunter",
  stackOrder: 1,
  effects: [
    { stat: "critRate", mode: "multiplier", multiplier: 2 }, // 100% increase = doubles crit rate
  ],
  levels: [
    { level: 1, requiredLevel: 49, spCost: 120000, mpCost: 60, power: 0 },
  ],
};

