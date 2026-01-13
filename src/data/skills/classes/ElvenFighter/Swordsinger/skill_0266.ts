import { SkillDefinition } from "../../../types";

// Song of Water - temporarily increases party's Evasion
export const skill_0266: SkillDefinition = {
  id: 266,
  code: "SS_0266",
  name: "Song of Water",
  description: "Temporarily increases party's Evasion. Continuous singing consumes additional MP.\n\nВременно увеличивает уклонение партии на 3 на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0266.gif",
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
    { stat: "evasion", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 350000, mpCost: 60, power: 0 },
  ],
};

