import { SkillDefinition } from "../../../types";

// Song of Flame Guard - temporarily increases party members' resistance to attacks by fire
export const skill_0306: SkillDefinition = {
  id: 306,
  code: "SS_0306",
  name: "Song of Flame Guard",
  description: "Temporarily increases party members' resistance to attacks by fire. Continuous singing consumes additional MP.\n\nВременно увеличивает сопротивление членов партии к огненным атакам на 30% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0306.gif",
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
    { stat: "fireResist", mode: "multiplier", multiplier: 1.3 }, // 30% increase
  ],
  levels: [
    { level: 1, requiredLevel: 62, spCost: 570000, mpCost: 60, power: 0 },
  ],
};

