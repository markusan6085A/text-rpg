import { SkillDefinition } from "../../../types";

export const skill_1334: SkillDefinition = {
  id: 1334,
  code: "HM_1334",
  name: "Summon Cursed Man",
  description: "Summons Cursed Man from a corpse. Consumes 1 Crystal: Grade C during summoning, and 2 additional Crystals will be consumed at a regular interval for 4 times. Also, 15% of acquired Exp. will be consumed.",
  icon: "/skills/skill1334.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 56, spCost: 83000, mpCost: 103, power: 0 },
    { level: 2, requiredLevel: 60, spCost: 130000, mpCost: 110, power: 0 },
    { level: 3, requiredLevel: 64, spCost: 200000, mpCost: 119, power: 0 },
    { level: 4, requiredLevel: 68, spCost: 330000, mpCost: 127, power: 0 },
    { level: 5, requiredLevel: 70, spCost: 410000, mpCost: 130, power: 0 },
    { level: 6, requiredLevel: 72, spCost: 610000, mpCost: 133, power: 0 },
    { level: 7, requiredLevel: 74, spCost: 920000, mpCost: 137, power: 0 },
  ],
};

