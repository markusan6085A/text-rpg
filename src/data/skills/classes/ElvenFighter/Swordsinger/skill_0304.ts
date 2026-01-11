import { SkillDefinition } from "../../../types";

// Song of Vitality - instantly increases party members' maximum HP
export const skill_0304: SkillDefinition = {
  id: 304,
  code: "SS_0304",
  name: "Song of Vitality",
  description: "Instantly increases party members' maximum HP. Continuous singing consumes additional MP.\n\nМгновенно увеличивает максимальный HP членов партии на 30% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0304.gif",
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
    { stat: "maxHp", mode: "multiplier", multiplier: 1.3 }, // 30% increase
  ],
  levels: [
    { level: 1, requiredLevel: 66, spCost: 1200000, mpCost: 60, power: 0 },
  ],
};

