import { SkillDefinition } from "../../../types";

export const Skill_0287: SkillDefinition = {
  id: 287,
  code: "OR_0287",
  name: "Lionheart",
  description: "Temporarily and significantly increases resistance to Paralysis, Hold, Sleep or Shock attack. Effect 2.\n\nВременно и значительно увеличивает сопротивление к параличу, удержанию, сну или шоку.",
  icon: "/skills/skill0287.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 900,
  duration: 60,
  effects: [
    { stat: "holdResist", mode: "multiplier", multiplier: 0.4 },
    { stat: "sleepResist", mode: "multiplier", multiplier: 0.4 },
    { stat: "stunResist", mode: "multiplier", multiplier: 0.4 },
    { stat: "shockResist", mode: "multiplier", multiplier: 0.4 },
  ],
  levels: [
    { level: 2, requiredLevel: 49, spCost: 82000, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 0 },
  ],
};

