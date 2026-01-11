import { SkillDefinition } from "../../../types";

// Wrath - decreases CP of near enemies with polearm
// XML: mpConsume: 73-83, power: 0.93 0.9 0.88 0.85 0.83 0.8 0.78 0.75 0.73 0.7 (multiplier for CP reduction)
// File shows: 7% 10% 12% 15% 17% 20% 22% 25% 27% 30%
export const skill_0320: SkillDefinition = {
  id: 320,
  code: "WS_0320",
  name: "Wrath",
  description: "By swinging a spear, decreases CP of near enemies. Usable when a spear is equipped.\n\nРазмахивая копьем, уменьшает CP ближайших врагов. Используется при экипировке копья.",
  icon: "/skills/skill0320.gif",
  category: "physical_attack",
  powerType: "percent",
  target: "area",
  scope: "area",
  castTime: 1.08,
  cooldown: 120,
  levels: [
    { level: 1, requiredLevel: 66, spCost: 390000, mpCost: 73, power: 7 },
    { level: 2, requiredLevel: 66, spCost: 390000, mpCost: 74, power: 10 },
    { level: 3, requiredLevel: 68, spCost: 430000, mpCost: 75, power: 12 },
    { level: 4, requiredLevel: 68, spCost: 430000, mpCost: 77, power: 15 },
    { level: 5, requiredLevel: 70, spCost: 420000, mpCost: 78, power: 17 },
    { level: 6, requiredLevel: 70, spCost: 420000, mpCost: 79, power: 20 },
    { level: 7, requiredLevel: 72, spCost: 840000, mpCost: 80, power: 22 },
    { level: 8, requiredLevel: 72, spCost: 840000, mpCost: 81, power: 25 },
    { level: 9, requiredLevel: 74, spCost: 1100000, mpCost: 82, power: 27 },
    { level: 10, requiredLevel: 74, spCost: 1100000, mpCost: 83, power: 30 },
  ],
};

