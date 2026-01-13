import { SkillDefinition } from "../../../types";

export const Skill_0222: SkillDefinition = {
  id: 222,
  code: "TY_0222",
  name: "Fist Fury",
  description: "Greatly increases one's Atk. Spd. Continuously consumes HP.\n\nЗначительно увеличивает скорость атаки. Постоянно потребляет HP.",
  icon: "/skills/skill0222.gif",
  category: "toggle",
  powerType: "percent",
  target: "self",
  scope: "single",
  toggle: true,
  hpPerTick: 13,
  effects: [
    { stat: "attackSpeed", mode: "multiplier", multiplier: 1.25 },
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 51000, mpCost: 8, power: 25 },
  ],
};

