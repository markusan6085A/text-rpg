import { SkillDefinition } from "../../../types";

export const Skill_0287: SkillDefinition = {
  id: 287,
  code: "OR_0287",
  name: "Lionheart",
  description: "Temporarily and significantly increases resistance to Paralysis, Hold, Sleep or Shock attack. Effect 1.\n\nВременно и значительно увеличивает сопротивление к параличу, удержанию, сну или шоку.",
  icon: "/skills/skill0287.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 900,
  duration: 60,
  effects: [
    { stat: "holdResist", mode: "multiplier", multiplier: 0.6 },
    { stat: "sleepResist", mode: "multiplier", multiplier: 0.6 },
    { stat: "stunResist", mode: "multiplier", multiplier: 0.6 },
    { stat: "shockResist", mode: "multiplier", multiplier: 0.6 },
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 17000, mpCost: 16, power: 0 },
  ],
};

