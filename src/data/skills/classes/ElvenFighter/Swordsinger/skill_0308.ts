import { SkillDefinition } from "../../../types";

// Song of Storm Guard - temporarily increases party members' resistance to attacks by wind
export const skill_0308: SkillDefinition = {
  id: 308,
  code: "SS_0308",
  name: "Song of Storm Guard",
  description: "Temporarily increases party members' resistance to attacks by wind. Continuous singing consumes additional MP.\n\nВременно увеличивает сопротивление членов партии к ветряным атакам на 30% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0308.gif",
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
    { stat: "windResist", mode: "multiplier", multiplier: 1.3 }, // 30% increase
  ],
  levels: [
    { level: 1, requiredLevel: 70, spCost: 1500000, mpCost: 60, power: 0 },
  ],
};

