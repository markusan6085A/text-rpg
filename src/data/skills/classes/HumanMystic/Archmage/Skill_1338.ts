import { SkillDefinition } from "../../../types";

export const skill_1338: SkillDefinition = {
  id: 1338,
  code: "HM_1338",
  name: "Arcane Chaos",
  description: "Instantly decreases an enemy's resistance to buff canceling attacks and resistance to debuff attacks. Increases MP consumption of physical and magic skills. MP is continuously decreased.\n\nМгновенно снижает сопротивление врага к атакам отмены баффов и к дебафф-атакам. Увеличивает потребление MP физических и магических навыков. MP постоянно уменьшается.",
  icon: "/skills/skill1338.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 60,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 72,
      power: 40,
    },
  ],
};

