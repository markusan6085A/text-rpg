import { SkillDefinition } from "../../../types";

// Song of Vengeance - temporarily reflects damage received by party members back upon the enemy
export const skill_0305: SkillDefinition = {
  id: 305,
  code: "SS_0305",
  name: "Song of Vengeance",
  description: "Temporarily reflects damage received by party members back upon the enemy. Excludes damage received from skill or remote attack. Continuous singing consumes additional MP.\n\nВременно отражает 20% полученного урона членов партии обратно на врага. Исключает урон от навыков или удаленных атак. На 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0305.gif",
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
    { stat: "reflect", mode: "percent", value: 20 }, // 20% damage reflect
  ],
  levels: [
    { level: 1, requiredLevel: 74, spCost: 3900000, mpCost: 60, power: 0 },
  ],
};

