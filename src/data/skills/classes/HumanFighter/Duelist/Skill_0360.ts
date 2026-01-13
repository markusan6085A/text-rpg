import { SkillDefinition } from "../../../types";

export const Skill_0360: SkillDefinition = {
  id: 360,
  code: "DL_0360",
  name: "Eye of Slayer",
  description: "Temporarily increases P. Atk. against the beasts/magic creatures/giants/dragons.\n\nВременно увеличивает физ. атаку против зверей/магических существ/гигантов/драконов.",
  category: "buff",
  powerType: "percent",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0360.jpg",
  target: "self",
  scope: "single",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 16000000, mpCost: 71, power: 30 },
  ],
};

