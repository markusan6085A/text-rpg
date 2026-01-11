import { SkillDefinition } from "../../../types";

// Mighty Servitor - 3 levels from XML
// pAtk multipliers: 1.08, 1.12, 1.15
// mpConsume: 24, 36, 42
// mpConsume_Init: 6, 10, 12
const mightyServitorPAtk = [1.08, 1.12, 1.15];
const mightyServitorMp = [24, 36, 42];
const mightyServitorMpInit = [6, 10, 12];

export const skill_1146: SkillDefinition = {
  id: 1146,
  code: "DW_1146",
  name: "Mighty Servitor",
  description: "Temporarily increases servitor's P. Atk. Effect 1.\n\nЭффект Mighty Servitor на 20 мин., кастуется на саммона, действует в пределах дальности 400: - Увеличивает физическую атаку на 8-15%.",
  icon: "/skills/Skill1146_0.jpg",
  category: "buff",
  powerType: "none",
  target: "self", // Special: targets summon (handled in useSkill.ts)
  scope: "single",
  duration: 1200, // 20 minutes
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pAtk", mode: "multiplier" }], // Value from level.power (multiplier)
  levels: mightyServitorPAtk.map((multiplier, index) => ({
    level: index + 1,
    requiredLevel: index < 1 ? 35 : index < 2 ? 45 : 55,
    spCost: index < 1 ? 18000 : index < 2 ? 50000 : 100000,
    mpCost: mightyServitorMpInit[index] + mightyServitorMp[index],
    power: multiplier,
  })),
};

