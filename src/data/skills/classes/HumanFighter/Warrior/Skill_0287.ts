import { SkillDefinition } from "../../../types";

export const Skill_0287: SkillDefinition = {
  id: 287,
  code: "WR_0287",
  name: "Lionheart",
  description: "Temporarily and significantly increases resistance to Paralysis, Hold, Sleep or Shock attack. Effect 1.\n\nВременно и значительно увеличивает сопротивление к параличу, удержанию, сну или шоку. Эффект 1.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  stackType: "lionheart",
  stackOrder: 2,
  effects: [
    { stat: "mDef", mode: "percent" },
    { stat: "stunResist", mode: "percent" },
  ],
  duration: 60,
  cooldown: 150,
  icon: "/skills/0287.jpg",
  levels: [
    { level: 1, requiredLevel: 36, spCost: 31000, mpCost: 16, power: 40 },
  ],
};

