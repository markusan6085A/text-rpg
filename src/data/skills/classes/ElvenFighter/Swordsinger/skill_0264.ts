import { SkillDefinition } from "../../../types";

// Song of Earth - temporarily increases P. Def. of party members
export const skill_0264: SkillDefinition = {
  id: 264,
  code: "SS_0264",
  name: "Song of Earth",
  description: "Temporarily increases P. Def. of party members. Continuous singing consumes additional MP.\n\nВременно увеличивает физическую защиту членов партии на 25% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0264.gif",
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
    { stat: "pDef", mode: "multiplier", multiplier: 1.25 }, // 25% increase
  ],
  levels: [
    { level: 1, requiredLevel: 55, spCost: 270000, mpCost: 60, power: 0 },
  ],
};

