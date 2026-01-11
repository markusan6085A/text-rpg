import { SkillDefinition } from "../../../types";
import { heroRequiredLevel } from "./utils";

const levels = [
  { level: 1, spCost: 1600, mpCost: 18, power: 19 },
  { level: 2, spCost: 1600, mpCost: 20, power: 21 },
  { level: 3, spCost: 3200, mpCost: 22, power: 24 },
  { level: 4, spCost: 3200, mpCost: 23, power: 25 },
  { level: 5, spCost: 5800, mpCost: 25, power: 28 },
  { level: 6, spCost: 5800, mpCost: 27, power: 30 },
  { level: 7, spCost: 12000, mpCost: 29, power: 33 },
  { level: 8, spCost: 12000, mpCost: 30, power: 36 },
].map((entry) => ({
  level: entry.level,
  requiredLevel: heroRequiredLevel(entry.level),
  spCost: entry.spCost,
  mpCost: entry.mpCost,
  power: entry.power,
}));

export const skill_1031: SkillDefinition = {
  id: 1031,
  code: "DMO_1031",
  name: "Disrupt Undead",
  description: "Deals holy magic damage to undead creatures in range.",
  icon: "/skills/Skill1031_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  element: "holy",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 4,
  levels,
};
