import { SkillDefinition } from "../../../types";

// Song of Warding - temporarily increases party members' M. Def
export const skill_0267: SkillDefinition = {
  id: 267,
  code: "SS_0267",
  name: "Song of Warding",
  description: "Temporarily increases party members' M. Def. When singing continuously, additional MP is consumed.\n\nВременно увеличивает магическую защиту членов партии на 30% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0267.gif",
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
    { stat: "mDef", mode: "multiplier", multiplier: 1.3 }, // 30% increase
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 49000, mpCost: 60, power: 0 },
  ],
};

