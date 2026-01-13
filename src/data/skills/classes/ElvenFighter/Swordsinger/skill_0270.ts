import { SkillDefinition } from "../../../types";

// Song of Invocation - temporarily increases party members' resistance to dark magic attacks
export const skill_0270: SkillDefinition = {
  id: 270,
  code: "SS_0270",
  name: "Song of Invocation",
  description: "Temporarily increases party members' resistance to dark magic attacks. Continuous singing consumes additional MP.\n\nВременно увеличивает сопротивление членов партии к темной магии на 20% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0270.gif",
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
    { stat: "darkResist", mode: "multiplier", multiplier: 1.2 }, // 20% increase
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 53000, mpCost: 60, power: 0 },
  ],
};

