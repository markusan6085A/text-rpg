import { SkillDefinition } from "../../../types";

// Song of Wind - temporarily increases party's movement
export const skill_0268: SkillDefinition = {
  id: 268,
  code: "SS_0268",
  name: "Song of Wind",
  description: "Temporarily increases party's movement. Continuous singing consumes additional MP.\n\nВременно увеличивает скорость передвижения партии на 20 на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0268.gif",
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
    { stat: "runSpeed", mode: "flat", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 85000, mpCost: 60, power: 0 },
  ],
};

