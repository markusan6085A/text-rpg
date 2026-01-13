import { SkillDefinition } from "../../../types";

// Parry Stance - toggle skill that blocks attacks
// XML: mpConsume: 36, ManaDamOverTime: 36 per 3s (12 MP/s), pDef: 1.25, mDef: 1.25
// pAtkSpd: 0.8, runSpd: 0.9, accCombat: -4
export const skill_0339: SkillDefinition = {
  id: 339,
  code: "FS_0339",
  name: "Parry Stance",
  description: "Uses weapon to block incoming attacks. P. Def and M.Def increase significantly. Speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для блокирования входящих атак. Физ. защита и маг. защита значительно увеличиваются. Скорость, скорость атаки и точность уменьшены. MP будет непрерывно потребляться во время действия.",
  icon: "/skills/skill0339.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -12, // 36 MP per 3s = 12 MP/s
  tickInterval: 1,
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1.25 },
    { stat: "mDef", mode: "multiplier", multiplier: 1.25 },
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.8 },
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.9 },
    { stat: "accuracy", mode: "flat", value: -4 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

